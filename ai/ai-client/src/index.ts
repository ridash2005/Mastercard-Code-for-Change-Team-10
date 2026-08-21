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

/**
 * Google Gemini implementation. Requires GEMINI_API_KEY in the environment.
 * Uses responseMimeType: "application/json" for generateJson (Gemini's JSON
 * mode) and native function-calling for chatWithTools.
 */
export class GeminiClient implements LlmClient {
  private modelName: string;
  private apiKey: string;

  constructor(opts?: { apiKey?: string; model?: string }) {
    const apiKey = opts?.apiKey ?? process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Add it to your .env (see §14 of the build spec) before making live calls."
      );
    }
    this.apiKey = apiKey;
    this.modelName = opts?.model ?? "gemini-3.6-flash";
  }

  private async getModel() {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(this.apiKey);
    return genAI;
  }

  async generateJson<T>(opts: GenerateJsonOptions<T>): Promise<T> {
    const genAI = await this.getModel();
    const model = genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: opts.systemPrompt,
      generationConfig: {
        temperature: opts.temperature ?? 0.2,
        responseMimeType: "application/json",
        ...(opts.responseSchema ? { responseSchema: opts.responseSchema as never } : {})
      }
    });

    let lastRaw = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      const prompt =
        attempt === 0
          ? opts.userPrompt
          : `${opts.userPrompt}\n\nYour previous response was not valid JSON matching the required schema. Return ONLY valid JSON, no prose, no markdown fences.`;

      const result = await model.generateContent(prompt);
      const raw = result.response.text();
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
    const genAI = await this.getModel();
    const systemMessages = opts.messages.filter((m) => m.role === "system").map((m) => m.content);
    const conversation = opts.messages.filter((m) => m.role !== "system");

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

    const history = conversation.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
    const last = conversation[conversation.length - 1];

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(last.content);
    const response = result.response;

    const calls = response.functionCalls() ?? [];
    return {
      text: calls.length === 0 ? response.text() : null,
      toolCalls: calls.map((c) => ({ name: c.name, args: (c.args ?? {}) as Record<string, unknown> }))
    };
  }
}

/** True when GEMINI_API_KEY is set — callers use this to pick live vs. fixture mode. */
export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
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
