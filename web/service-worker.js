// pharmacy-tools 統合Service Worker
//
// 設計方針（弱点7対応、批評レビューを反映）:
// - install では軽量な共通シェルのみキャッシュする。各アプリの重量データ
//   ファイル（substitution-checker/zaiyaku-master.js は gzip後540KB超）を
//   無条件で全ユーザーに先読みさせない。
// - 実際にそのアプリへアクセスした時点でオンデマンドにキャッシュする
//   （fetchハンドラのstale-while-revalidateが兼ねる）。
// - cache-firstではなくstale-while-revalidate：キャッシュがあれば即座に
//   返しつつ裏でネットワーク取得し、次回アクセス時に新しい内容へ更新する。
// - データ更新時はCACHE_VERSIONをインクリメントする運用ルール。
//   （バージョンを上げないと、stale-while-revalidateにより次回アクセス時に
//   バックグラウンド更新はされるが、更新反映までに1回のタイムラグが生じる。
//   即時反映したい大きめの更新はバージョンを上げてactivateで全キャッシュ破棄する）
const CACHE_VERSION = 'v1';
const CACHE = 'pharmacy-tools-' + CACHE_VERSION;

// installでキャッシュする最小限の共通シェルのみ（各アプリの重量データは含めない）
const CORE_ASSETS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(CORE_ASSETS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      const networkFetch = fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            cache.put(event.request, res.clone());
          }
          return res;
        })
        .catch(() => cached);
      // stale-while-revalidate: キャッシュがあれば即返し、裏で更新
      return cached || networkFetch;
    })
  );
});
