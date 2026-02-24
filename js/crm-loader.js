(function () {
  var BUILD_TAG = String(Date.now());

  function withBust(url) {
    var sep = url.indexOf('?') === -1 ? '?' : '&';
    return url + sep + 'v=' + encodeURIComponent(BUILD_TAG);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var el = document.createElement('script');
      el.src = withBust(src);
      el.onload = resolve;
      el.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.body.appendChild(el);
    });
  }

  fetch(withBust('partials/crm-body.html'), { credentials: 'same-origin', cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return response.text();
    })
    .then(function (html) {
      var root = document.getElementById('crm-root');
      root.innerHTML = html;
      return loadScript('js/app-core.js');
    })
    .then(function () {
      return loadScript('js/app-main.js');
    })
    .then(function () {
      // Re-fire DOMContentLoaded because split scripts are injected after initial document load.
      if (document.readyState !== 'loading') {
        document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));
      }
    })
    .catch(function (error) {
      console.error('CRM bootstrap failed', error);
      var root = document.getElementById('crm-root');
      if (root) {
        root.innerHTML = '<div style="padding:16px;color:#f87171;font-family:sans-serif;">Не удалось загрузить интерфейс CRM.</div>';
      }
    });
})();
