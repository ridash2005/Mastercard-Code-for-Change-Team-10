// The ONLY file in this backend that touches `/ai`. Every other AI-related
// route/service in backend/api goes through this bridge, which in turn is
// the only thing that dynamically imports the compiled `@katalyst/ai-client`
// package - `/ai` has no HTTP server of its own and is never reachable from
// the frontend directly, only in-process from this backend.
//
// Loaded via dynamic import() (not require()) because `@katalyst/ai-client`
// is an ESM package ("type": "module") while backend/api is CommonJS; Node
// supports import() from a CJS module natively, no build step needed here.

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

// backend/api/services/ai/ -> repo root is 4 levels up (services -> api ->
// backend -> root), then into ai/ai-client/dist. This is a static import()
// target computed at runtime, so Vercel's build-time dependency tracer
// can't see it — on Vercel, `npm run vercel-build` (see package.json) vendors
// the compiled package into backend/api/vendor/ai-client instead, which
// lives inside this function's own rootDirectory and therefore always gets
// bundled. Local/monorepo dev never creates that vendor folder, so it falls
// through to the normal workspace path unchanged.
const VENDORED_ENTRY = path.resolve(__dirname, '../../vendor/ai-client/dist/index.js');
const WORKSPACE_ENTRY = path.resolve(__dirname, '../../../../ai/ai-client/dist/index.js');
const AI_CLIENT_DIST_ENTRY = fs.existsSync(VENDORED_ENTRY) ? VENDORED_ENTRY : WORKSPACE_ENTRY;

let clientPromise = null;
let clientKind = null; // 'gemini' | 'fixture' — surfaced for logging/health checks only

async function loadAiClientModule() {
  return import(pathToFileURL(AI_CLIENT_DIST_ENTRY).href);
}

/** @returns {Promise<import('../../../ai/ai-client/src/index').LlmClient>} */
async function getLlmClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const mod = await loadAiClientModule();
      if (mod.hasGeminiKey()) {
        clientKind = 'gemini';
        return new mod.GeminiClient();
      }
      clientKind = 'fixture';
      return new mod.StaticLlmClient(
        // Generic fixture for generateJson calls: shaped for the Coach's
        // `{ reply }` schema so demos work with no GEMINI_API_KEY, matching
        // the rest of the repo's "mock services" convention. A judge-shaped
        // schema won't validate against this, so scoring calls correctly
        // fail closed to the pending_review/ai_parse_error path instead of
        // fabricating a score - see aiJudgeService.js's docstring.
        () => ({
          reply:
            "I'm running in fixture/demo mode right now (no live AI key configured), so I can't give you a real answer yet — ask again once GEMINI_API_KEY is set."
        }),
        () => ({
          text: 'AI Coach is running in fixture mode — set GEMINI_API_KEY in the environment to enable live replies.',
          toolCalls: []
        })
      );
    })();
  }
  return clientPromise;
}

function getClientKind() {
  return clientKind;
}

module.exports = { getLlmClient, getClientKind };
