const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

const root = join(__dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

test('Public navigation introduces Research while Workspace remains reachable from the footer', () => {
  const nav = read('_config.yml').split('\nnav:')[1].split('\nexclude:')[0];
  assert.deepEqual([...nav.matchAll(/link: "([^"]+)"/g)].map(match => match[1]), [
    '/', '/profile/', '/research/', '/publications/', '/news/',
  ]);
  assert.match(read('_includes/footer.html'), /href="\{\{ '\/workspace\/' \| relative_url \}\}">Private Workspace<\/a>/);
  assert.match(read('workspace/index.html'), /href="\{\{ '\/research\/' \| relative_url \}\}">Public research<\/a>/);
});

test('Selected research resolves existing publications instead of duplicating bibliographic data', () => {
  const projects = read('_data/research_projects.yml');
  const papers = JSON.parse(read('_data/google-scholar-publications.json')).sections.flatMap(section => section.items);
  const ids = [...projects.matchAll(/publication_id: (\S+)/g)].map(match => match[1]);
  assert.equal(ids.length, 3);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    const paper = papers.find(item => item.id === id);
    assert.ok(paper, `Unknown publication: ${id}`);
    assert.ok(existsSync(join(root, paper.image)), `Missing source figure: ${paper.image}`);
    assert.ok(read('_data/publication_visuals.yml').includes(id));
  }
  assert.doesNotMatch(projects, /^\s*(title|venue|year|citations|details):/m);
  const card = read('_includes/research-project-card.html');
  for (const field of ['venue', 'year', 'details']) assert.ok(card.includes(`project_paper.${field}`));
  assert.match(card, /#publication-\{\{ project_paper\.id \| escape \}\}/);
});

test('Research stays public without the removed simulation demo or its navigation link', () => {
  const research = read('research/index.html');
  assert.match(research, /body_class: page-research/);
  assert.doesNotMatch(research, /workspace-config|workspace\.js|data-workspace-private|sessionStorage|\.gif/);
  assert.doesNotMatch(research, /Simulation demo|research-demo|Scene reasoning for proactive driving|Open comparison and limitations|\/VLA\//);
  assert.ok(existsSync(join(root, 'VLA/index.html')));
  assert.ok(existsSync(join(root, 'VLA/assets/carla_event_a-poster.png')));
  for (const id of ['research-directions', 'research-work']) {
    assert.ok(research.includes(`id="${id}"`));
    assert.ok(research.includes(`href="#${id}"`));
  }
});

test('Profile stays concise while existing research anchors and onward links remain intact', () => {
  const profile = read('profile/index.html');
  assert.match(profile, /id="profile-research"/);
  assert.match(profile, /class="profile-research-summary"/);
  assert.match(profile, /Explore research and demos/);
  for (const path of ['profile/index.html', 'publications/index.html', '_includes/home-research.html']) {
    assert.match(read(path), /'\/research\/' \| relative_url/);
  }
});

test('Workspace groups are ordered and remain inside the initially hidden private dashboard', () => {
  const html = read('workspace/index.html');
  const dashboard = html.split('data-workspace-view="dashboard" data-workspace-private hidden>')[1].split('</article>')[0];
  assert.ok(dashboard);
  const ids = ['workspace-overview', 'workspace-tools', 'workspace-infrastructure', 'workspace-files'];
  let previous = -1;
  for (const id of ids) {
    const position = dashboard.indexOf(`id="${id}"`);
    assert.ok(position > previous, `Missing or out-of-order section: ${id}`);
    assert.ok(dashboard.includes(`href="#${id}"`));
    previous = position;
  }
  assert.match(dashboard, /\/workspace\/timesfm\//);
  for (const id of ['workspace-server-alerts', 'workspace-minhs-work', 'workspace-servers', 'workspace-links', 'workspace-signals']) {
    assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1);
    assert.ok(dashboard.includes(`id="${id}"`));
  }
});

test('Workspace preserves manual refresh, accessible status, and private file viewer hooks', () => {
  const html = read('workspace/index.html');
  for (const source of ['minhs', 'servers']) {
    assert.ok(html.includes(`data-workspace-refresh-source="${source}"`));
  }
  for (const id of ['workspace-login-form', 'workspace-email', 'workspace-password', 'workspace-helper-form', 'workspace-signout', 'workspace-private-file-detail', 'workspace-private-file-title', 'workspace-private-file-meta', 'workspace-private-file-body']) {
    assert.ok(html.includes(`id="${id}"`));
  }
  assert.match(html, /id="workspace-status"[^>]*role="status" aria-live="polite"/);
  assert.match(html, /<details class="workspace-site-details">\s*<summary id="workspace-analytics-title">Site traffic<\/summary>/);
  for (const flag of ['show_footer: false', 'include_public_analytics: false', 'robots: noindex,nofollow']) assert.ok(html.includes(flag));
});

test('Private data stays excluded from GitHub Pages output', () => {
  const config = read('_config.yml');
  for (const name of ['workspace_content.json', 'workspace_server_sync_fallback.json', 'workspace_site_signals.json']) {
    assert.ok(config.includes(`- tools/${name}`));
  }
  assert.match(read('assets/workspace-config.js'), /provider: 'remote-helper'/);
});
