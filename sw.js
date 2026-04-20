// 現場帳 Service Worker
const CACHE_NAME = 'genbacho-v4';
const ASSETS = [
  '/',
  '/index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=DM+Mono:wght@400;500;600&display=swap'
];

// インストール時にキャッシュ
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // 外部リソースはキャッシュ失敗しても続行
      return cache.addAll(['/index.html']).catch(() => {});
    })
  );
  self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ネットワーク優先、失敗時にキャッシュ
self.addEventListener('fetch', e => {
  // API通信はキャッシュしない
  if (e.request.url.includes('anthropic.com') || e.request.url.includes('api.')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 成功したらキャッシュを更新
        if (res && res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // オフライン時はキャッシュから返す
        return caches.match(e.request).then(cached => {
          if (cached) return cached;
          // index.htmlをフォールバック
          return caches.match('/index.html');
        });
      })
  );
});
