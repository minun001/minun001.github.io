(function () {
  'use strict';
  var config = window.SITE_ANALYTICS_CONFIG || {};
  var paths = ['/', '/profile/', '/research/', '/publications/', '/news/'];
  var path = window.location.pathname.replace(/index\.html$/, '');
  if (paths.indexOf(path) === -1 || !config.collectionEnabled) return;
  if (navigator.globalPrivacyControl || navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
  var api;
  try {
    api = new URL(config.apiBaseUrl);
    if (api.protocol !== 'https:' || api.username || api.password || api.search || api.hash) return;
    if (!window.crypto || !window.crypto.randomUUID) return;
    if (sessionStorage.getItem('site.analytics.owner') === 'yes') return;
  } catch (_error) { return; }
  var sent = false;
  function collect() {
    if (sent) return;
    try {
      if (localStorage.getItem('site.analytics.consent') !== 'yes') return;
      var browser = JSON.parse(localStorage.getItem('site.analytics.browser') || 'null');
      var now = Date.now();
      if (!browser || !browser.id || !Number.isFinite(browser.created) || browser.created > now || now - browser.created > 30 * 86400000) {
        browser = { id: crypto.randomUUID(), created: now };
        localStorage.setItem('site.analytics.browser', JSON.stringify(browser));
      }
      var referrer = '';
      try { var source = new URL(document.referrer); if (source.hostname !== location.hostname) referrer = source.hostname; } catch (_error) {}
      var data = { event_id: crypto.randomUUID(), browser_id: browser.id, page_path: path, referrer_host: referrer, device: window.innerWidth < 768 ? 'mobile' : 'desktop', consent: true };
      sent = true;
      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, 8000);
      fetch(api.href.replace(/\/$/, '') + '/analytics/collect', {
        method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store', keepalive: true,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: controller.signal
      }).catch(function () {}).finally(function () { clearTimeout(timeout); });
    } catch (_error) { /* Analytics must never interfere with the public site. */ }
  }
  function start() {
    try {
      var preference = localStorage.getItem('site.analytics.consent');
      if (preference === 'yes') { collect(); return; }
      if (preference === 'no') return;
    } catch (_error) { return; }
    var notice = document.createElement('aside');
    notice.setAttribute('aria-label', 'Optional analytics');
    notice.style.cssText = 'position:fixed;bottom:1rem;left:1rem;right:1rem;max-width:36rem;margin:auto;padding:1rem;background:#fff;color:#293e52;border:1px solid #d8e0e8;border-radius:12px;box-shadow:0 8px 32px #102c4618;z-index:40;font-size:.85rem';
    var text = document.createElement('p');
    text.textContent = 'Allow anonymous visit counts to help improve this research website?';
    text.style.margin = '0 0 .75rem';
    notice.appendChild(text);
    ['Allow analytics', 'No thanks'].forEach(function (label, index) {
      var button = document.createElement('button');
      button.type = 'button'; button.className = 'btn-soft'; button.textContent = label;
      button.style.cssText = 'margin:0 .6rem .5rem 0;font-size:.8rem';
      button.addEventListener('click', function () {
        try { localStorage.setItem('site.analytics.consent', index === 0 ? 'yes' : 'no'); } catch (_error) {}
        notice.remove(); if (index === 0) collect();
      });
      notice.appendChild(button);
    });
    var link = document.createElement('a'); link.href = '/privacy/'; link.textContent = 'Privacy details';
    notice.appendChild(link); document.body.appendChild(notice);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
