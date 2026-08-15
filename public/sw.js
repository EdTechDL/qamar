// Qamar service worker.
//
// SPEC §18 (offline-first) for the web target. The whole Quran ships inside
// the JS bundle, so precaching the build gives genuine offline reading — the
// only thing that needs runtime caching is recitation audio, which is fetched
// per-ayah from a remote qari source.
//
// PRECACHE and BUILD_ID are injected by scripts/build-sw.mjs after `expo
// export`, because the bundle filenames are content-hashed and unknowable
// until then. Editing them by hand accomplishes nothing; they get overwritten.

const BUILD_ID = '__BUILD_ID__';
const PRECACHE = __PRECACHE__;

const SHELL_CACHE = `qamar-shell-${BUILD_ID}`;
const AUDIO_CACHE = 'qamar-audio-v1';

// Recitation audio accumulates one entry per ayah played. Cap it so a long
// listening habit can't grow the origin's storage without bound.
const AUDIO_CACHE_MAX_ENTRIES = 800;

const SHELL_URL = '/index.html';

// ------------------------------------------------------------------- install

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // addAll() is atomic — one 404 aborts the install and leaves the old
      // worker in place, which is the behaviour we want for a broken deploy.
      await cache.addAll(PRECACHE);
      await self.skipWaiting();
    })(),
  );
});

// ------------------------------------------------------------------ activate

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith('qamar-shell-') && n !== SHELL_CACHE)
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// --------------------------------------------------------------------- fetch

function isAudioRequest(request, url) {
  return request.destination === 'audio' || /\.(mp3|m4a|ogg|opus)$/i.test(url.pathname);
}

// Cache-first, and cache opaque cross-origin responses too — the qari source
// doesn't send CORS headers, so `response.ok` is false and status is 0 even
// on success. An opaque response still replays fine through <audio>.
async function audioStrategy(request) {
  const cache = await caches.open(AUDIO_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;

  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) {
    await cache.put(request, response.clone());
    await trimCache(cache, AUDIO_CACHE_MAX_ENTRIES);
  }
  return response;
}

// Cache API exposes keys in insertion order, so dropping from the front is a
// FIFO eviction. Not a true LRU, but it needs no bookkeeping.
async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  const excess = keys.length - maxEntries;
  for (let i = 0; i < excess; i++) await cache.delete(keys[i]);
}

// Serve from cache immediately, refresh in the background for next time.
async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL_CACHE);
  const hit = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);

  return hit || (await network) || Response.error();
}

// SPA: every navigation resolves to the one app shell, and expo-router takes
// it from there. This is what makes deep links work offline.
async function navigationStrategy(request) {
  const cache = await caches.open(SHELL_CACHE);
  const shell = await cache.match(SHELL_URL);
  if (shell) return shell;
  try {
    return await fetch(request);
  } catch {
    return new Response('Hors ligne', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }

  if (isAudioRequest(request, url)) {
    event.respondWith(audioStrategy(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
