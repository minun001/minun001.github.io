(function () {
  'use strict';
  var config = window.SITE_ANALYTICS_CONFIG || {};
  var base = '', token = '', requestSequence = 0, expiryTimer;
  var $ = function (id) { return document.getElementById('analytics-' + id); };
  function normalize(value) {
    try {
      var url = new URL(String(value).trim());
      var loopback = ['localhost', '127.0.0.1', '[::1]'].indexOf(url.hostname) !== -1;
      if (url.protocol !== 'https:' && !(loopback && url.protocol === 'http:' && location.protocol === 'http:')) return '';
      if (url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) return '';
      return url.origin;
    } catch (_error) { return ''; }
  }
  function tokenKey() { return 'site.analytics.session:' + base; }
  function status(message, error) { $('status').textContent = message; $('status').dataset.error = error ? 'true' : 'false'; }
  function saveToken(value) {
    token = value;
    try {
      if (value) { sessionStorage.setItem(tokenKey(), value); sessionStorage.setItem('site.analytics.owner', 'yes'); }
      else { sessionStorage.removeItem(tokenKey()); sessionStorage.removeItem('site.analytics.owner'); }
    } catch (_error) {}
  }
  function lock() {
    clearTimeout(expiryTimer);
    requestSequence += 1;
    $('dashboard').hidden = true; $('login').hidden = false;
    ['chart', 'daily', 'pages', 'referrers', 'recent'].forEach(function (id) { $(id).replaceChildren(); });
    ['today-browsers', 'today-views', 'total-browsers', 'total-views'].forEach(function (id) { $(id).textContent = '—'; });
  }
  async function api(path, body) {
    if (!base) throw new Error('Set your trusted Analytics API URL below. Statistics are unavailable until the local API and HTTPS tunnel are running.');
    var controller = new AbortController();
    var requestBase = base, requestToken = token;
    var timer = setTimeout(function () { controller.abort(); }, 15000);
    try {
      var response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', credentials: 'omit', cache: 'no-store', headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}), body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal });
      if (!(response.headers.get('Content-Type') || '').includes('application/json')) throw new Error('API disconnected. The HTTPS tunnel did not return an Analytics response.');
      var payload = await response.json();
      if (!response.ok) {
        if (response.status === 401 && base === requestBase && token === requestToken) saveToken('');
        throw new Error(payload.error || 'API request failed (' + response.status + ').');
      }
      return payload;
    } catch (error) {
      if (error instanceof TypeError || error.name === 'AbortError') throw new Error('API disconnected. Keep this PC, the Analytics API and its HTTPS tunnel running.');
      throw error;
    } finally { clearTimeout(timer); }
  }
  function cell(row, value) { var node = document.createElement('td'); node.textContent = String(value); row.appendChild(node); }
  function rows(id, values) { $(id).replaceChildren(); values.forEach(function (values) { var row = document.createElement('tr'); values.forEach(function (value) { cell(row, value); }); $(id).appendChild(row); }); }
  function ranking(id, values, key) {
    $(id).replaceChildren();
    if (!values.length) { var empty = document.createElement('li'); empty.textContent = 'No recorded visits.'; $(id).appendChild(empty); }
    values.forEach(function (item) { var row = document.createElement('li'), label = document.createElement('span'), count = document.createElement('strong'); label.textContent = item[key] || 'Direct / unknown'; count.textContent = item.pageviews + ' views'; row.append(label, count); $(id).appendChild(row); });
  }
  function chart(daily) {
    var ns = 'http://www.w3.org/2000/svg';
    function svgNode(tag, attrs, text) { var node = document.createElementNS(ns, tag); Object.keys(attrs).forEach(function (key) { node.setAttribute(key, attrs[key]); }); if (text) node.textContent = text; return node; }
    var svg = svgNode('svg', { viewBox: '0 0 900 255', role: 'img', 'aria-label': 'Daily page views in blue and estimated browsers in slate. Exact values are available in the daily numbers table.' });
    var max = Math.max(1, ...daily.map(function (day) { return day.pageviews; }));
    [0, .5, 1].forEach(function (fraction) { var y = 200 - fraction * 150; svg.appendChild(svgNode('line', { x1: 45, x2: 865, y1: y, y2: y, stroke: '#e5eaf0' })); svg.appendChild(svgNode('text', { x: 5, y: y + 5, fill: '#536579', 'font-size': 14 }, String(Math.round(max * fraction)))); });
    ['pageviews', 'browsers'].forEach(function (key, index) {
      var points = daily.map(function (day, i) { return (45 + i * 820 / Math.max(1, daily.length - 1)) + ',' + (200 - day[key] * 150 / max); }).join(' ');
      svg.appendChild(svgNode('polyline', { points: points, fill: 'none', stroke: index ? '#7c91a6' : '#174a8b', 'stroke-width': 3, 'stroke-dasharray': index ? '6 4' : 'none' }));
    });
    svg.appendChild(svgNode('text', { x: 45, y: 235, fill: '#536579', 'font-size': 14 }, daily[0].date));
    svg.appendChild(svgNode('text', { x: 865, y: 235, 'text-anchor': 'end', fill: '#536579', 'font-size': 14 }, daily[daily.length - 1].date));
    svg.appendChild(svgNode('text', { x: 45, y: 25, fill: '#174a8b', 'font-size': 14 }, 'Page views'));
    svg.appendChild(svgNode('text', { x: 170, y: 25, fill: '#536579', 'font-size': 14 }, 'Browsers (dashed)'));
    $('chart').replaceChildren(svg);
  }
  async function refresh() {
    var sequence = ++requestSequence;
    $('refresh').disabled = true;
    try {
      var days = Number($('range').value);
      var data = await api('/analytics/summary?days=' + days);
      if (sequence !== requestSequence) return;
      $('today-browsers').textContent = data.today.browsers; $('today-views').textContent = data.today.pageviews;
      $('total-browsers').textContent = data.totals.browsers; $('total-views').textContent = data.totals.pageviews;
      $('range-caption').textContent = 'Last ' + days + ' days';
      $('updated').textContent = 'Updated ' + new Date(data.generated_at).toLocaleTimeString('en-GB', { timeZone: 'Asia/Seoul' });
      $('empty').hidden = data.totals.pageviews !== 0;
      rows('daily', data.daily.map(function (day) { return [day.date, day.browsers, day.pageviews]; }));
      rows('recent', data.recent.map(function (visit) { return [new Date(visit.timestamp).toLocaleString('en-GB', { timeZone: 'Asia/Seoul' }), visit.browser, visit.page, visit.referrer || 'Direct / unknown']; }));
      ranking('pages', data.pages, 'path'); ranking('referrers', data.referrers, 'host'); chart(data.daily);
      $('dashboard').hidden = false; $('login').hidden = true; $('settings').open = false;
      $('connection').textContent = 'Private API connected';
      clearTimeout(expiryTimer);
      expiryTimer = setTimeout(function () { saveToken(''); lock(); $('connection').textContent = 'Owner sign-in required'; status('Session expired. Sign in again to view private statistics.'); }, 30 * 60 * 1000);
      status('Only consented visits recorded while this PC and its tunnel are online are included.');
    } catch (error) { if (sequence === requestSequence) { lock(); status(error.message, true); $('connection').textContent = 'Statistics unavailable'; } }
    finally { $('refresh').disabled = false; }
  }
  async function connect() {
    var connectionBase = base;
    lock(); $('connection').textContent = 'Checking connection';
    try {
      var session = await api('/analytics/session');
      if (connectionBase !== base) return;
      $('connection').textContent = session.configured ? 'Owner sign-in required' : 'Account setup required';
      if (session.authenticated) { await refresh(); return; }
      saveToken('');
      status(session.configured ? 'Sign in to view private statistics. API: ' + base : 'Configure the owner account on this PC before signing in.', !session.configured);
    } catch (error) { if (connectionBase === base) { $('connection').textContent = 'API disconnected'; status(error.message, true); $('settings').open = true; } }
  }
  $('login-form').addEventListener('submit', async function (event) {
    var loginBase = base;
    event.preventDefault(); $('signin').disabled = true; status('Signing in to ' + base + '…');
    try {
      var data = await api('/analytics/login', { username: $('username').value.trim(), password: $('password').value });
      if (loginBase !== base) return;
      saveToken(data.session_token); $('password').value = ''; await refresh();
      if (!$('dashboard').hidden) { $('title').focus(); window.scrollTo(0, 0); }
    } catch (error) { if (loginBase === base) { $('password').value = ''; status(error.message, true); } }
    finally { $('signin').disabled = false; }
  });
  $('api-form').addEventListener('submit', function (event) {
    event.preventDefault(); var next = normalize($('api-url').value);
    if (!next) { status('Use an HTTPS origin without credentials, paths or query strings. HTTP is allowed only for local development.', true); return; }
    saveToken(''); lock(); base = next;
    try { localStorage.setItem('site.analytics.api', base); } catch (_error) {}
    $('password').value = ''; connect();
  });
  $('refresh').addEventListener('click', refresh); $('range').addEventListener('change', refresh);
  $('signout').addEventListener('click', async function () {
    $('signout').disabled = true;
    try { await api('/analytics/logout', {}); status('Signed out.'); }
    catch (_error) { status('Signed out in this browser. The API was unreachable; the server session will expire automatically.', true); }
    finally { saveToken(''); lock(); $('connection').textContent = 'Owner sign-in required'; $('signout').disabled = false; $('username').focus(); }
  });
  try { base = normalize(localStorage.getItem('site.analytics.api')) || normalize(config.apiBaseUrl); } catch (_error) { base = normalize(config.apiBaseUrl); }
  if (!base && ['localhost', '127.0.0.1'].indexOf(location.hostname) !== -1) base = 'http://127.0.0.1:8792';
  try { token = sessionStorage.getItem(tokenKey()) || ''; } catch (_error) {}
  $('api-url').value = base; connect();
})();
