// Post-processes dist/sw.js after `expo export --platform web`.
//
// Metro content-hashes the bundle and font filenames, so the precache list
// can't be written by hand — this walks the export and injects it, along with
// a build id derived from the file contents. A changed build id means a new
// shell cache, which is what evicts the previous deploy on activate.

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const SW_PATH = join(DIST, 'sw.js');

// Cloudflare consumes _headers/_redirects at deploy time — they're never
// served, so caching them would 404 the whole atomic addAll().
const EXCLUDED_FILES = new Set(['sw.js', '_headers', '_redirects']);
const EXCLUDED_EXTENSIONS = ['.map'];

const PRECACHE_WARN_BYTES = 12 * 1024 * 1024;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(DIST).filter((full) => {
  const rel = relative(DIST, full);
  if (EXCLUDED_FILES.has(rel)) return false;
  return !EXCLUDED_EXTENSIONS.some((ext) => rel.endsWith(ext));
});

if (files.length === 0) {
  console.error('dist/ is empty — run `npm run export:web` first.');
  process.exit(1);
}

const hash = createHash('sha256');
let totalBytes = 0;
const urls = [];

for (const full of files.sort()) {
  const contents = readFileSync(full);
  totalBytes += contents.length;
  const rel = relative(DIST, full).split(sep).join(posix.sep);
  hash.update(rel);
  hash.update(contents);
  urls.push('/' + rel);
}

const buildId = hash.digest('hex').slice(0, 12);

let sw = readFileSync(SW_PATH, 'utf8');

if (!sw.includes('__PRECACHE__') || !sw.includes('__BUILD_ID__')) {
  console.error(
    'dist/sw.js has no placeholders to replace. Either it was already ' +
      'processed, or public/sw.js was edited — check that __BUILD_ID__ and ' +
      '__PRECACHE__ are both still present in the source.',
  );
  process.exit(1);
}

sw = sw.replace('__BUILD_ID__', buildId).replace('__PRECACHE__', JSON.stringify(urls, null, 2));

writeFileSync(SW_PATH, sw);

const mb = (totalBytes / 1024 / 1024).toFixed(1);
console.info(`sw.js  build ${buildId}  ${urls.length} files  ${mb} MB precached`);

if (totalBytes > PRECACHE_WARN_BYTES) {
  console.warn(
    `Precache is ${mb} MB. Browsers evict origins that overrun their storage ` +
      'quota, and the install is atomic — consider moving large assets to ' +
      'runtime caching.',
  );
}
