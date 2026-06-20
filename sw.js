/* 서비스워커
   - HTML 문서: network-first (항상 최신 index.html, 오프라인 시 캐시 폴백)
   - 정적 에셋(아이콘 등): cache-first
   - Firebase(CDN/RTDB) 요청은 통과(네트워크) */
const CACHE = 'chetics-v8';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function putCache(req, res){
  const copy = res.clone();
  caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
  return res;
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isHTML = e.request.mode === 'navigate' ||
                 (e.request.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // 최신 HTML 우선, 실패 시 캐시
    e.respondWith(
      fetch(e.request).then((res) => putCache(e.request, res))
        .catch(() => caches.match(e.request).then((h) => h || caches.match('./index.html')))
    );
    return;
  }

  // 정적 에셋: 캐시 우선
  e.respondWith(
    caches.match(e.request).then((hit) =>
      hit || fetch(e.request).then((res) => putCache(e.request, res))
    )
  );
});
