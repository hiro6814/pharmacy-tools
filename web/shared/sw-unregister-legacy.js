// web/shared/sw-unregister-legacy.js
// 旧バージョン・別スコープのService Workerが残っていれば解除する。
// 各アプリの<head>最上部から <script src="../shared/sw-unregister-legacy.js"></script>
// で読み込む（同期scriptなのでinline版と同じタイミングで実行される）。
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (rs) {
    rs.forEach(function (r) {
      var active = r.active && r.active.scriptURL;
      if (!active || active.indexOf('/service-worker.js') === -1) r.unregister();
    });
  });
}
