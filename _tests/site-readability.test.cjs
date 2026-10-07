const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const { runInNewContext } = require('node:vm');

const read = (path) => readFileSync(join(__dirname, '..', path), 'utf8');

test('Profile uses the requested graduate start year without inventing a month', () => {
  const profile = read('profile/index.html');
  const graduate = profile.split('M.S. in Transportation and Logistics Engineering')[1].split('</div>')[0];
  assert.match(graduate, /2025 - Present/);
  assert.doesNotMatch(graduate, /Mar\. 2025/);
  assert.match(graduate, /Graduate studies: 2025 - Present/);
  assert.match(graduate, /Admitted to Hanyang University on July 31, 2026/);
});

test('Research directions distinguish linked publications from informational cards', () => {
  const directions = read('_data/research_directions.yml');
  const cards = read('_includes/research-direction-cards.html');
  assert.doesNotMatch(directions, /link: \/profile\/#profile-research/);
  assert.equal((directions.match(/group: primary/g) || []).length, 3);
  assert.equal((directions.match(/group: related/g) || []).length, 2);
  assert.match(cards, /if direction\.link/);
  assert.match(cards, /<article class="research-topic-card"/);
  assert.match(read('profile/index.html'), /<summary>Related research:/);
});

test('Publication counts and category navigation share one source and preserve DOM hooks', () => {
  const publications = read('publications/index.html');
  assert.equal((publications.match(/aria-label="Jump to publication type"/g) || []).length, 1);
  assert.doesNotMatch(publications, /aria-label="Publication summary"/);
  assert.match(publications, /class="pub-summary-item" href="#\{\{ section\.key \}\}" data-publication-summary=/);
  for (const hook of ['data-publications-root', 'data-publication-search', 'data-publication-reset', 'data-publication-summary-count', 'data-publication-section']) {
    assert.ok(publications.includes(hook));
  }
});

test('News keeps images absent and avoids claiming an unverified completed presentation', () => {
  const news = read('news/index.html');
  assert.doesNotMatch(news, /<img\b/);
  const euroma = news.split('<h3>EurOMA 2026 conference contribution</h3>')[1].split('</article>')[0];
  assert.ok(euroma);
  assert.doesNotMatch(euroma, /will be presented|was presented/);
  for (const id of ['news-its-congress-2026', 'news-hanyang-admission-2026', 'news-safety-monitoring-2026']) {
    assert.ok(news.includes(`id="${id}"`));
    assert.ok(read('_includes/home-research.html').includes(`#${id}`));
  }
});

test('Workspace puts sign-in before its optional preview and keeps the dashboard gated', () => {
  const workspace = read('workspace/index.html');
  assert.ok(workspace.indexOf('id="workspace-login-form"') < workspace.indexOf('aria-label="Workspace preview"'));
  assert.match(workspace, /data-workspace-view="dashboard" data-workspace-private hidden/);
  assert.match(workspace, /id="workspace-helper-url" type="url"/);
  assert.doesNotMatch(workspace, /workspace-login-preview-meter" aria-hidden/);
});

test('News keeps known dates while ordering 2026 events newest first', () => {
  const news = read('news/index.html');
  const year = news.split('id="news-2026"')[1].split('id="news-2025"')[0];
  assert.ok(year.indexOf('news-its-congress-2026') < year.indexOf('news-hanyang-admission-2026'));
  assert.ok(year.indexOf('EurOMA 2026 conference contribution') < year.indexOf('news-euroma-award-2026'));
  assert.doesNotMatch(news, /Fall Conference Presentation on Traffic Sentencing/);
  assert.match(news, /conference presentation on traffic sentencing prediction<\/h3>\s*<div[^>]*><span class="news-date">Apr\. 2024/);
});

test('Mobile Publications keeps full category labels and readable counts in compact rows', () => {
  const publications = read('publications/index.html');
  assert.match(publications, /\.pub-summary-item\{grid-template-columns:minmax\(0,1fr\) auto;/);
  assert.match(publications, /\.pub-summary-item strong\{font-size:1rem;white-space:nowrap\}/);
  assert.doesNotMatch(publications, /min-height:3em/);
  assert.match(publications, /\.pub-meta-row\{grid-template-columns:3\.5rem minmax\(0,1fr\)/);
});

test('Home enlarges original publication figures without cropping them or changing carousel timing', () => {
  const css = read('assets/home-research.css');
  const html = read('_includes/home-research.html');
  assert.match(css, /\.research-paper:first-child\{grid-column:1\/-1;display:grid/);
  assert.match(css, /\.research-paper-figure img\{[^}]*height:260px;[^}]*object-fit:contain/);
  assert.match(css, /\.research-paper:first-child\{display:block\}/);
  assert.match(html, /data-interval="7000"/);
  assert.match(html, /href="\{\{ paper\.image \| relative_url \}\}"/);
});

test('Profile keeps the portrait frame and lower crop while gently enlarging the subject', () => {
  const profile = read('profile/index.html');
  assert.match(profile, /picture \{ display: block; aspect-ratio: 5 \/ 4; \}/);
  assert.match(profile, /object-position: center bottom; transform: scale\(1\.1\); transform-origin: center bottom/);
});

test('Mobile News compacts featured updates without removing filters or their targets', () => {
  const news = read('news/index.html');
  assert.match(news, /\.news-featured article\{grid-template-columns:5\.25rem minmax\(0,1fr\)/);
  assert.match(news, /\.news-featured h3 a\{display:flex;align-items:center\}/);
  assert.match(news, /\.news-featured h3 a\{[^}]*min-height:44px/);
  for (const category of ['all', 'journal', 'conference', 'project', 'award', 'academic']) {
    assert.ok(news.includes(`data-news-filter="${category}"`));
  }
});

test('TimesFM shares site colors and keeps authentication and forecasting hooks', () => {
  const css = read('assets/timesfm-forecast.css');
  const html = read('workspace/timesfm/index.html');
  assert.match(css, /--timesfm-ink: var\(--text-title\)/);
  assert.match(css, /--timesfm-accent: var\(--accent\)/);
  assert.match(css, /\.timesfm-hero,\s*\.timesfm-panel \{[^}]*border-radius: 12px;[^}]*box-shadow: none/);
  assert.match(html, /script_bundle: timesfm/);
  assert.match(html, /id="timesfm-auth-gate" hidden/);
  assert.match(html, /id="timesfm-app" hidden/);
});

test('Public pages do not link to the removed VLA page', () => {
  for (const path of ['index.html', '_includes/home-research.html', '_includes/footer.html', 'profile/index.html', 'research/index.html', 'publications/index.html', 'news/index.html', 'workspace/index.html', 'workspace/timesfm/index.html']) {
    assert.doesNotMatch(read(path), /\/VLA\//, path);
  }
});

function helperFixture(href = 'https://minun001.github.io/workspace/') {
  class Element {
    constructor() { this.listeners = {}; this.hidden = true; this.value = ''; this.dataset = {}; }
    addEventListener(type, listener) { this.listeners[type] = listener; }
    focus() { this.focused = true; }
    emit(type) { this.listeners[type]({ preventDefault() {} }); }
  }
  const elements = Object.fromEntries(['workspace-helper-setup', 'workspace-helper-form', 'workspace-helper-url', 'workspace-helper-clear', 'workspace-password', 'workspace-status'].map(id => [id, new Element()]));
  const storage = new Map();
  const location = new URL(href);
  location.assign = (url) => { location.assigned = url; };
  const window = {
    location,
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
  };
  const source = read('assets/workspace.js').replace(/\}\)\(\);\s*$/, 'window.testHelper = { normalizeHelperBaseUrl, bindHelperSetup, prepareWorkspaceConfig };})();');
  runInNewContext(source, { window, document: { addEventListener() {}, getElementById: id => elements[id] }, URL, URLSearchParams, console });
  return { elements, window, storage, api: window.testHelper };
}

test('Helper URLs retain the trusted-host restriction and reject embedded credentials', () => {
  const { api } = helperFixture();
  assert.equal(api.normalizeHelperBaseUrl('https://owned-helper.trycloudflare.com/'), 'https://owned-helper.trycloudflare.com');
  for (const url of ['https://untrusted.example', 'https://trycloudflare.com.attacker.example', 'https://user:password@owned-helper.trycloudflare.com', 'http://127.0.0.1:8765', 'javascript:alert(1)']) {
    assert.equal(api.normalizeHelperBaseUrl(url), '');
  }
  assert.equal(helperFixture('http://127.0.0.1:4000/workspace/').api.normalizeHelperBaseUrl('http://127.0.0.1:8765/'), 'http://127.0.0.1:8765');
});

test('Helper setup navigates to the existing auth flow, saves only the URL, and clears the password', () => {
  const { api, elements, window, storage } = helperFixture('https://minun001.github.io/workspace/?clearWorkspaceHelper=1&returnTo=%2Fworkspace%2Ftimesfm%2F');
  api.bindHelperSetup({ provider: 'remote-helper', localAuth: {} });
  assert.equal(elements['workspace-helper-setup'].hidden, false);
  assert.equal(elements['workspace-helper-setup'].open, true);
  elements['workspace-helper-url'].value = 'https://owned-helper.trycloudflare.com/';
  elements['workspace-password'].value = 'test-only-unsent-value';
  elements['workspace-helper-form'].emit('submit');
  const next = new URL(window.location.assigned);
  assert.equal(next.searchParams.get('workspaceHelper'), 'https://owned-helper.trycloudflare.com');
  assert.equal(next.searchParams.has('clearWorkspaceHelper'), false);
  assert.equal(next.searchParams.get('returnTo'), '/workspace/timesfm/');
  assert.equal(elements['workspace-password'].value, '');
  assert.deepEqual([...storage.entries()], [['workspace.helperBaseUrl', 'https://owned-helper.trycloudflare.com']]);
  const reloaded = helperFixture(next.toString());
  const config = reloaded.api.prepareWorkspaceConfig({ provider: 'remote-helper', localAuth: {} });
  assert.equal(config.provider, 'local-helper');
  assert.equal(config.localAuth.sessionEndpoint, 'https://owned-helper.trycloudflare.com/local-auth/session');
  assert.equal(config.localAuth.loginEndpoint, 'https://owned-helper.trycloudflare.com/local-auth/login');
});

test('Invalid helper input never saves a URL or sends credentials', () => {
  const { api, elements, window, storage } = helperFixture();
  api.bindHelperSetup({ provider: 'remote-helper', localAuth: {} });
  elements['workspace-helper-url'].value = 'https://untrusted.example';
  elements['workspace-helper-form'].emit('submit');
  assert.equal(window.location.assigned, undefined);
  assert.equal(storage.size, 0);
  assert.equal(elements['workspace-helper-url'].focused, true);
});

test('Clearing a saved helper removes both query aliases without touching credentials or auth config', () => {
  const { api, elements, window, storage } = helperFixture('https://minun001.github.io/workspace/?workspaceHelper=https%3A%2F%2Fowned-helper.trycloudflare.com&helper=https%3A%2F%2Fowned-helper.trycloudflare.com');
  storage.set('workspace.helperBaseUrl', 'https://owned-helper.trycloudflare.com');
  storage.set('unrelated-key', 'preserve');
  api.bindHelperSetup({ provider: 'local-helper', localAuth: { helperBaseUrl: 'https://owned-helper.trycloudflare.com' } });
  elements['workspace-helper-clear'].emit('click');
  const next = new URL(window.location.assigned);
  assert.equal(next.searchParams.has('workspaceHelper'), false);
  assert.equal(next.searchParams.has('helper'), false);
  assert.equal(next.searchParams.get('clearWorkspaceHelper'), '1');
  assert.equal(storage.has('workspace.helperBaseUrl'), false);
  assert.equal(storage.get('unrelated-key'), 'preserve');
});
