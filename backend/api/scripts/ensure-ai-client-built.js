// Ensures `ai/ai-client`'s compiled output exists before this backend
// starts. `dist/` is gitignored (a build artifact, not source) - a fresh
// clone/deploy has no `ai/ai-client/dist/index.js` on disk, and
// services/ai/aiClientBridge.js's dynamic import of that file would crash
// the moment anything calls the AI gateway. Wired as `prestart`/`predev` so
// it runs automatically on both `npm start` and `npm run dev` here,
// regardless of whether the whole monorepo or just this package was
// installed.
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const AI_CLIENT_DIR = path.resolve(__dirname, '../../../ai/ai-client');
const DIST_ENTRY = path.join(AI_CLIENT_DIR, 'dist', 'index.js');

if (fs.existsSync(DIST_ENTRY)) {
  console.log('[ensure-ai-client-built] ai/ai-client/dist already present, skipping build.');
  process.exit(0);
}

if (!fs.existsSync(path.join(AI_CLIENT_DIR, 'tsconfig.json'))) {
  console.error(
    `[ensure-ai-client-built] Cannot find ${AI_CLIENT_DIR} - is this backend running from its expected location (backend/api)?`
  );
  process.exit(1);
}

// A stale tsconfig.tsbuildinfo (TypeScript's incremental-build cache) can
// convince tsc that dist/ is already up to date even when it's missing on
// disk - e.g. dist/ deleted or lost but the build-info file persisted on a
// cached layer/volume. Removing it forces a real rebuild rather than a
// silent, wrong no-op ("TypeScript: No errors found" with nothing emitted).
const BUILD_INFO = path.join(AI_CLIENT_DIR, 'tsconfig.tsbuildinfo');
if (fs.existsSync(BUILD_INFO)) fs.unlinkSync(BUILD_INFO);

console.log('[ensure-ai-client-built] ai/ai-client/dist missing - building it now...');
try {
  execFileSync('npx tsc -p tsconfig.json', {
    cwd: AI_CLIENT_DIR,
    stdio: 'inherit',
    shell: true // npx resolution needs a shell on Windows
  });
} catch (err) {
  console.error('[ensure-ai-client-built] Build failed:', err.message);
  process.exit(1);
}

if (!fs.existsSync(DIST_ENTRY)) {
  console.error('[ensure-ai-client-built] Build reported success but dist/index.js still missing - aborting startup.');
  process.exit(1);
}
console.log('[ensure-ai-client-built] Build complete.');
