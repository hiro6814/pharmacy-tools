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
//
// キャッシュはシェル用・データ用の2系統に分離している（タブバー追加時に導入）。
// UI/ナビゲーションだけの変更でSHELL_CACHE_VERSIONを上げても、
// zaiyaku-master.js・drugs-master.js等の大容量データキャッシュは巻き添えで
// 破棄されない。データ本体の更新時のみDATA_CACHEのバージョンを独立して上げる。
// ロールバック時もSHELL_CACHE_VERSIONは常に単調増加させ、古い値を再利用しない。
const SHELL_CACHE_VERSION = 'v2';
const SHELL_CACHE = 'pharmacy-tools-shell-' + SHELL_CACHE_VERSION;
const DATA_CACHE_VERSION = 'v1';
const DATA_CACHE = 'pharmacy-tools-data-' + DATA_CACHE_VERSION;

// zaiyaku-master.js, drugs-master.js等の「-master.js」命名規則で大容量データを判定する
const DATA_FILE_PATTERN = /-master\.js$/;
function cacheNameFor(url) {
  return DATA_FILE_PATTERN.test(url.pathname) ? DATA_CACHE : SHELL_CACHE;
}

// installでキャッシュする最小限の共通シェルのみ（各アプリの重量データは含めない）
const CORE_ASSETS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.allSettled(CORE_ASSETS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.open(cacheNameFor(url)).then(async (cache) => {
      const cached = await cache.match(event.request);
      const networkFetch = fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            cache.put(event.request, res.clone());
          }
          return res;
        })
        .catch(() => cached);
      // stale-while-revalidate: キャッシュがあれば即返し、裏で更新。
      // waitUntilで明示的に延命しないと、respondWithがcachedで解決した
      // 直後にSWが休止し、裏のfetch/cache.putが完了しないことがある。
      if (cached) {
        event.waitUntil(networkFetch);
        return cached;
      }
      return networkFetch;
    })
  );
});
