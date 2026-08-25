// Thin provider abstraction (§14 of the build spec): every AI Judge / AI Coach
// call goes through this interface so swapping Gemini -> Groq -> Claude later
// is a one-line change, never a rewrite of prompt/business logic.
//
// generateJson() retries once on invalid/unparsable output (matches the
// AI Judge's §4.2 step-3 "reject/retry once" contract) then throws — callers
// decide what "route to pending_review" means for them.

import type { ZodType } from "zod";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolName?: string;
}

/**
 * Subset of the OpenAPI 3.0 schema object Gemini accepts for
 * `GenerationConfig.responseSchema` (see @google/generative-ai's `Schema`
 * type). Hand-rolled here instead of imported so callers that don't use
 * Gemini (fixture/mock clients) don't need the provider SDK as a type dep.
 */
export interface GeminiResponseSchema {
  type?: "string" | "number" | "integer" | "boolean" | "array" | "object";
  format?: string;
  description?: string;
  nullable?: boolean;
  items?: GeminiResponseSchema;
  enum?: string[];
  properties?: Record<string, GeminiResponseSchema>;
  required?: string[];
}

export interface GenerateJsonOptions<T> {
  systemPrompt: string;
  userPrompt: string;
  schema: ZodType<T>;
  temperature?: number;
  /**
   * Optional provider-side response schema (Gemini's `responseSchema`
   * generation-config field). When set, the provider is constrained to
   * emit exactly this JSON shape instead of relying solely on prose
   * instructions in the prompt - `schema` (above) still runs as the
   * final safety-net validation either way. Providers that don't support
   * constrained JSON output may ignore this field.
   */
  responseSchema?: GeminiResponseSchema;
}

export interface ChatWithToolsOptions {
  messages: ChatMessage[];
  tools: ToolDefinition[];
  temperature?: number;
}

export interface ChatWithToolsResult {
  text: string | null;
  toolCalls: ToolCall[];
}

export interface LlmClient {
  generateJson<T>(opts: GenerateJsonOptions<T>): Promise<T>;
  chatWithTools(opts: ChatWithToolsOptions): Promise<ChatWithToolsResult>;
}

export class LlmOutputError extends Error {
  constructor(message: string, public readonly raw: string) {
    super(message);
    this.name = "LlmOutputError";
  }
}

function stripCodeFence(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

// Transient provider/network failures (overload, rate limit, momentary
// connection drops) are a normal fact of calling a live LLM API and are
// unrelated to whether the prompt/schema was valid — retrying the *content*
// loop below won't help with these, so they get their own short backoff
// retry instead of immediately surfacing as a hard failure to the caller.
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const MAX_TRANSIENT_RETRIES = 3;
const TRANSIENT_RETRY_BASE_DELAY_MS = 500;

function isRetryableProviderError(err: unknown): boolean {
  const status =
    (err as { status?: number })?.status ?? (err as { statusCode?: number })?.statusCode;
  if (typeof status === "number" && RETRYABLE_STATUS_CODES.has(status)) return true;

  const message = err instanceof Error ? err.message : String(err);
  return /\b(429|500|502|503|504)\b/.test(message) || /high demand|overloaded|rate.?limit|ECONNRESET|ETIMEDOUT|fetch failed/i.test(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retries `fn` with exponential backoff on transient provider/network errors only. */
async function withTransientRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_TRANSIENT_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryableProviderError(err) || attempt === MAX_TRANSIENT_RETRIES - 1) throw err;
      await sleep(TRANSIENT_RETRY_BASE_DELAY_MS * 2 ** attempt);
    }
  }
  throw lastErr;
}

// A key that's hit its quota (daily cap or per-minute RPM) won't start
// working again from backoff-retrying the same key - swap to the next
// configured key instead. Distinct from isRetryableProviderError above:
// that one decides whether a same-key backoff retry is worth trying at
// all; this one decides whether persistent failure means "this key is
// done for now, move on" rather than "give up entirely".
function isQuotaExceededError(err: unknown): boolean {
  const status = (err as { status?: number })?.status ?? (err as { statusCode?: number })?.statusCode;
  if (status === 429) return true;
  const message = err instanceof Error ? err.message : String(err);
  return /\b429\b/.test(message) || /quota|RESOURCE_EXHAUSTED/i.test(message);
}

/** GEMINI_API_KEY may be a single key or a comma-separated list for fallback. */
function parseApiKeysFromEnv(): string[] {
  const raw = process.env.GEMINI_API_KEY;
  if (!raw) return [];
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

/**
 * Google Gemini implementation. Requires GEMINI_API_KEY in the environment
 * (a single key, or a comma-separated list to fall back through when one
 * hits its quota - see isQuotaExceededError/withKeyFallback).
 * Uses responseMimeType: "application/json" for generateJson (Gemini's JSON
 * mode) and native function-calling for chatWithTools.
 */
export class GeminiClient implements LlmClient {
  private modelName: string;
  private apiKeys: string[];
  // Sticky index so a client instance that successfully falls back to key
  // N keeps using key N on later calls, instead of re-trying the
  // already-known-exhausted key 0 first every time.
  private currentKeyIndex = 0;

  constructor(opts?: { apiKey?: string; apiKeys?: string[]; model?: string }) {
    const apiKeys = opts?.apiKeys ?? (opts?.apiKey ? [opts.apiKey] : parseApiKeysFromEnv());
    if (apiKeys.length === 0) {
      throw new Error(
        "GEMINI_API_KEY is not set. Add it to your .env (see §14 of the build spec) before making live calls."
      );
    }
    this.apiKeys = apiKeys;
    this.modelName = opts?.model ?? "gemini-3.6-flash";
  }

  private async getGenAI(apiKey: string) {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    return new GoogleGenerativeAI(apiKey);
  }

  /**
   * Runs `fn` against each configured key in turn (starting from the last
   * key known to work), backing off with withTransientRetry on each one
   * individually. A key whose failure looks like quota exhaustion moves on
   * to the next key rather than continuing to retry it; any other error
   * (bad prompt, non-quota provider error) surfaces immediately instead of
   * masking it by needlessly cycling through every key.
   */
  private async withKeyFallback<T>(fn: (apiKey: string) => Promise<T>): Promise<T> {
    let lastErr: unknown;
    for (let i = 0; i < this.apiKeys.length; i++) {
      const keyIndex = (this.currentKeyIndex + i) % this.apiKeys.length;
      try {
        const result = await withTransientRetry(() => fn(this.apiKeys[keyIndex]));
        this.currentKeyIndex = keyIndex;
        return result;
      } catch (err) {
        lastErr = err;
        if (!isQuotaExceededError(err) || i === this.apiKeys.length - 1) throw err;
        // else: this key is quota-exhausted, fall through and try the next one
      }
    }
    throw lastErr;
  }

  async generateJson<T>(opts: GenerateJsonOptions<T>): Promise<T> {
    let lastRaw = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      const prompt =
        attempt === 0
          ? opts.userPrompt
          : `${opts.userPrompt}\n\nYour previous response was not valid JSON matching the required schema. Return ONLY valid JSON, no prose, no markdown fences.`;

      const raw = await this.withKeyFallback(async (apiKey) => {
        const genAI = await this.getGenAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: this.modelName,
          systemInstruction: opts.systemPrompt,
          generationConfig: {
            temperature: opts.temperature ?? 0.2,
            responseMimeType: "application/json",
            ...(opts.responseSchema ? { responseSchema: opts.responseSchema as never } : {})
          }
        });
        const result = await model.generateContent(prompt);
        return result.response.text();
      });
      lastRaw = raw;

      try {
        const parsed = JSON.parse(stripCodeFence(raw));
        const validated = opts.schema.safeParse(parsed);
        if (validated.success) return validated.data;
      } catch {
        // fall through to retry
      }
    }

    throw new LlmOutputError("LLM did not return schema-valid JSON after 2 attempts", lastRaw);
  }

  async chatWithTools(opts: ChatWithToolsOptions): Promise<ChatWithToolsResult> {
    const systemMessages = opts.messages.filter((m) => m.role === "system").map((m) => m.content);
    const conversation = opts.messages.filter((m) => m.role !== "system");

    const history = conversation.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
    const last = conversation[conversation.length - 1];

    const response = await this.withKeyFallback(async (apiKey) => {
      const genAI = await this.getGenAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: systemMessages.join("\n\n"),
        tools: [
          {
            functionDeclarations: opts.tools.map((t) => ({
              name: t.name,
              description: t.description,
              parameters: t.parameters as never
            }))
          }
        ],
        generationConfig: { temperature: opts.temperature ?? 0.4 }
      });
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(last.content);
      return result.response;
    });

    const calls = response.functionCalls() ?? [];
    return {
      text: calls.length === 0 ? response.text() : null,
      toolCalls: calls.map((c) => ({ name: c.name, args: (c.args ?? {}) as Record<string, unknown> }))
    };
  }
}

/** True when GEMINI_API_KEY (one key, or a comma-separated list) is set — callers use this to pick live vs. fixture mode. */
export function hasGeminiKey(): boolean {
  return parseApiKeysFromEnv().length > 0;
}

/**
 * Deterministic, reusable client for fixture-driven demos (no network, no
 * API key, never runs dry). Unlike MockLlmClient's one-shot queue, each
 * responder is a function invoked fresh on every call so the same client
 * instance can back a long-running API route.
 */
export class StaticLlmClient implements LlmClient {
  constructor(
    private jsonResponder: (opts: GenerateJsonOptions<unknown>) => unknown,
    private toolResponder?: (opts: ChatWithToolsOptions) => ChatWithToolsResult
  ) {}

  async generateJson<T>(opts: GenerateJsonOptions<T>): Promise<T> {
    const raw = this.jsonResponder(opts as GenerateJsonOptions<unknown>);
    const validated = opts.schema.safeParse(raw);
    if (!validated.success) {
      throw new LlmOutputError(validated.error.message, JSON.stringify(raw));
    }
    return validated.data;
  }

  async chatWithTools(opts: ChatWithToolsOptions): Promise<ChatWithToolsResult> {
    if (this.toolResponder) return this.toolResponder(opts);
    return {
      text: "This is a fixture reply — set GEMINI_API_KEY to enable live AI Coach conversations.",
      toolCalls: []
    };
  }
}

/**
 * In-memory client for tests and fixture-driven development (no network,
 * no API key). Feed it a queue of canned responses.
 */
export class MockLlmClient implements LlmClient {
  constructor(
    private jsonQueue: unknown[] = [],
    private toolQueue: ChatWithToolsResult[] = []
  ) {}

  async generateJson<T>(opts: GenerateJsonOptions<T>): Promise<T> {
    const next = this.jsonQueue.shift();
    if (next === undefined) throw new Error("MockLlmClient: no more queued JSON responses");
    const validated = opts.schema.safeParse(next);
    if (!validated.success) {
      throw new LlmOutputError(validated.error.message, JSON.stringify(next));
    }
    return validated.data;
  }

  async chatWithTools(): Promise<ChatWithToolsResult> {
    const next = this.toolQueue.shift();
    if (!next) throw new Error("MockLlmClient: no more queued tool responses");
    return next;
  }
}
