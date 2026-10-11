(function () {
  'use strict';
  var config = window.SITE_ANALYTICS_CONFIG || {};
  var base = '', token = '', requestSequence = 0, connectionSequence = 0, connectionReady = false, expiryTimer;
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
  function availability(ready) {
    connectionReady = ready;
    $('signin').disabled = !ready;
    $('reconnect').hidden = ready;
  }
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
    if (!base) throw new Error('The PC-hosted API has no online connection configured. Sign-in requires the owner\'s PC and a permitted HTTPS tunnel. No public visits are being collected.');
    var controller = new AbortController();
    var requestBase = base, requestToken = token;
    var timer = setTimeout(function () { controller.abort(); }, 15000);
    try {
      var response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', credentials: 'omit', cache: 'no-store', headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}), body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal });
      if (!(response.headers.get('Content-Type') || '').includes('application/json')) throw new Error('API disconnected. The HTTPS tunnel did not return an Analytics response.');
      var payload = await response.json();
      if (!response.ok) {
        if (response.status === 401 && base === requestBase && token === requestToken) saveToken('');
        var failure = new Error(payload.error || 'API request failed (' + response.status + ').');
        failure.status = response.status;
        throw failure;
      }
      return payload;
    } catch (error) {
      if (error instanceof TypeError || error.name === 'AbortError') throw new Error('API disconnected. The owner\'s PC, API or secure connection is unavailable. Offline visits cannot be recovered.');
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
      availability(true);
      $('connection').textContent = 'Private API connected';
      clearTimeout(expiryTimer);
      expiryTimer = setTimeout(function () { saveToken(''); lock(); $('connection').textContent = 'Owner sign-in required'; status('Session expired. Sign in again to view private statistics.'); }, 30 * 60 * 1000);
      status('Only consented visits recorded while this PC and its tunnel are online are included.');
    } catch (error) { if (sequence === requestSequence) { lock(); availability(error.status === 401); status(error.message, true); $('connection').textContent = 'Statistics unavailable'; } }
    finally { $('refresh').disabled = false; }
  }
  async function connect() {
    var connectionBase = base, sequence = ++connectionSequence;
    lock(); availability(false); $('reconnect').disabled = true; $('password').value = '';
    $('connection').textContent = 'Checking connection'; status('Checking the PC-hosted API…');
    try {
      var session = await api('/analytics/session');
      if (connectionBase !== base || sequence !== connectionSequence) return;
      availability(session.configured === true);
      $('connection').textContent = session.configured ? 'Owner sign-in required' : 'Account setup required';
      if (session.authenticated) { await refresh(); return; }
      saveToken('');
      status(session.configured ? 'Sign in to view private statistics. API: ' + base : 'Configure the owner account on this PC before signing in.', !session.configured);
    } catch (error) { if (connectionBase === base && sequence === connectionSequence) { availability(false); $('connection').textContent = base ? 'PC-hosted API offline' : 'Online setup pending'; status(error.message, true); $('settings').open = true; } }
    finally { if (sequence === connectionSequence) $('reconnect').disabled = false; }
  }
  $('login-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!connectionReady) { $('password').value = ''; status('Connect the PC-hosted API before signing in. Use Retry connection after the PC and its secure connection are running.', true); return; }
    var loginBase = base, sequence = connectionSequence;
    $('signin').disabled = true; status('Signing in to ' + base + '…');
    try {
      var data = await api('/analytics/login', { username: $('username').value.trim(), password: $('password').value });
      if (loginBase !== base || sequence !== connectionSequence) return;
      saveToken(data.session_token); $('password').value = ''; await refresh();
      if (!$('dashboard').hidden) { $('title').focus(); window.scrollTo(0, 0); }
    } catch (error) { if (loginBase === base && sequence === connectionSequence) { $('password').value = ''; availability(Boolean(error.status && error.status < 500)); status(error.message, true); } }
    finally { if (loginBase === base && sequence === connectionSequence) $('signin').disabled = !connectionReady; }
  });
  $('api-form').addEventListener('submit', function (event) {
    event.preventDefault(); var next = normalize($('api-url').value);
    if (!next) { status('Use an HTTPS origin without credentials, paths or query strings. HTTP is allowed only for local development.', true); return; }
    saveToken(''); lock(); base = next;
    try { localStorage.setItem('site.analytics.api', base); } catch (_error) {}
    $('password').value = ''; connect();
  });
  $('refresh').addEventListener('click', refresh); $('range').addEventListener('change', refresh);
  $('reconnect').addEventListener('click', connect);
  $('signout').addEventListener('click', async function () {
    connectionSequence += 1;
    $('signout').disabled = true;
    try { await api('/analytics/logout', {}); status('Signed out.'); }
    catch (_error) { availability(false); status('Signed out in this browser. The API was unreachable; the server session will expire automatically.', true); }
    finally { saveToken(''); lock(); $('connection').textContent = 'Owner sign-in required'; $('signout').disabled = false; $('username').focus(); }
  });
  try { base = normalize(localStorage.getItem('site.analytics.api')) || normalize(config.apiBaseUrl); } catch (_error) { base = normalize(config.apiBaseUrl); }
  if (!base && ['localhost', '127.0.0.1'].indexOf(location.hostname) !== -1) base = 'http://127.0.0.1:8792';
  try { token = sessionStorage.getItem(tokenKey()) || ''; } catch (_error) {}
  $('api-url').value = base; connect();
})();
