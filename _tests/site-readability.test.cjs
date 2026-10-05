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
