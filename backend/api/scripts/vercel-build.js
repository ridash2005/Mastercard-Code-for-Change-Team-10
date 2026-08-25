// Runs as this project's Vercel build command (see package.json's
// "vercel-build" script, which Vercel auto-detects and runs instead of the
// default `next build` / no-op). Builds @katalyst/ai-client from source and
// vendors its compiled output into backend/api/vendor/ai-client — see
// services/ai/aiClientBridge.js for why: a runtime-computed import() target
// outside this project's rootDirectory won't get bundled by Vercel's
// dependency tracer, but a copy that lives inside rootDirectory will.
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '../../..');
const AI_CLIENT_SRC = path.join(REPO_ROOT, 'ai', 'ai-client');
const VENDOR_DIR = path.resolve(__dirname, '../vendor/ai-client');

// Standalone deploys (backend/api uploaded on its own, e.g. via `vercel
// deploy backend/api`) never have the sibling ai/ directory available on
// the build machine — only whatever was uploaded. In that case vendor/ was
// already populated locally before the upload (see the deploy runbook /
// README), so there's nothing to build here; skip instead of failing.
if (!fs.existsSync(AI_CLIENT_SRC)) {
  if (fs.existsSync(path.join(VENDOR_DIR, 'dist', 'index.js'))) {
    console.log('[vercel-build] ai/ai-client source not present (standalone deploy) — using pre-vendored dist as-is.');
    process.exit(0);
  }
  console.error(
    '[vercel-build] Neither ai/ai-client source nor a pre-vendored dist/index.js was found. ' +
      'For a standalone backend/api deploy, run scripts/vercel-build.js locally first so vendor/ai-client is included in the upload.'
  );
  process.exit(1);
}

// Vercel's monorepo install step scopes down to what backend/api's own
// package.json declares - ai/ai-client isn't a declared npm dependency
// (it's consumed via a vendored relative import, not require('@katalyst/
// ai-client')), so Vercel's install skips its deps (zod, @types/node) even
// though the ai/* workspace source is present in the checkout. Install
// them explicitly before compiling rather than assuming the root install
// already covered it.
if (!fs.existsSync(path.join(AI_CLIENT_SRC, 'node_modules', '@types', 'node'))) {
  console.log('[vercel-build] Installing @katalyst/ai-client dependencies...');
  // package.json only lists its runtime deps (zod, @google/generative-ai) -
  // also grab @types/node so tsc can resolve the ambient Node globals
  // (process, setTimeout) this package's source uses; version matches the
  // root workspace's devDependency. --no-workspaces forces a plain
  // standalone install rooted at AI_CLIENT_SRC - without it, npm detects
  // the monorepo's root package.json (it's a workspace member) and hoists
  // everything up to the repo root's node_modules instead, which tsc's
  // ancestor-directory @types lookup then somehow still doesn't resolve
  // reliably on Vercel's build machine.
  execFileSync('npm install --no-save --no-package-lock --no-workspaces @types/node@^22.9.0', {
    cwd: AI_CLIENT_SRC,
    stdio: 'inherit',
    shell: true
  });
}

console.log('[vercel-build] Building @katalyst/ai-client...');
execFileSync('npx tsc -p tsconfig.json', {
  cwd: AI_CLIENT_SRC,
  stdio: 'inherit',
  shell: true
});

console.log(`[vercel-build] Vendoring ai-client into ${VENDOR_DIR}...`);
fs.rmSync(VENDOR_DIR, { recursive: true, force: true });
fs.mkdirSync(path.join(VENDOR_DIR, 'dist'), { recursive: true });
// Renamed off "index.js" deliberately - Vercel's zero-config Node.js
// Functions detection scans this whole project (rootDirectory) for files
// matching its entrypoint patterns (app/index/server.{js,...}), including
// this vendored *dependency* file, and was silently treating it as a
// second, unintended serverless function: transpiling it ESM -> CommonJS
// (its own default for a package.json without "type": "module", which is
// backend/api/package.json's setting, not this vendored package's) while
// leaving vendor/ai-client/package.json's "type": "module" untouched. The
// mismatch then breaks at runtime with "exports is not defined in ES
// module scope" the moment aiClientBridge.js dynamically imports it -
// aiClientBridge.js's own import() call never triggers this misdetection,
// only Vercel's build-time directory scan does, so the rename is the fix.
for (const entry of fs.readdirSync(path.join(AI_CLIENT_SRC, 'dist'))) {
  const renamed = entry.replace(/^index\./, 'aiClient.');
  fs.copyFileSync(
    path.join(AI_CLIENT_SRC, 'dist', entry),
    path.join(VENDOR_DIR, 'dist', renamed)
  );
}
fs.copyFileSync(path.join(AI_CLIENT_SRC, 'package.json'), path.join(VENDOR_DIR, 'package.json'));

console.log('[vercel-build] Done.');
