const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

const read = path => readFileSync(join(__dirname, '..', path), 'utf8');

test('Profile puts one illustrated featured project above compact supporting projects', () => {
  const profile = read('profile/index.html');
  const projects = profile.split('id="profile-projects"')[1].split('</section>')[0];
  assert.match(projects, /class="about-project profile-project-featured"/);
  assert.match(projects, /class="profile-project-copy"/);
  assert.match(projects, /class="about-project profile-project-brief"/);
  assert.doesNotMatch(projects, /about-project-grid/);
  assert.equal((projects.match(/<img\b/g) || []).length, 1);
  const more = projects.split('<summary>Other projects and grants</summary>')[1];
  assert.match(more, /class="profile-project-list"/);
  assert.equal((more.match(/<article\b/g) || []).length, 5);
  assert.doesNotMatch(more, /<img\b/);
  assert.match(profile, /\.profile-project-featured \{ display: grid; grid-template-columns: minmax\(0, \.85fr\) minmax\(0, 1\.15fr\)/);
});

test('Mobile Profile shows all six section links in a two-row grid', () => {
  const profile = read('profile/index.html');
  const mobile = profile.split('@media (max-width: 640px)')[1].split('</style>')[0];
  assert.match(mobile, /\.about-jump \{ display: grid; grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);[^}]*overflow: visible/);
  assert.match(mobile, /\.about-jump a \{[^}]*min-width: 0;[^}]*white-space: normal/);
  const nav = profile.split('aria-label="Jump to profile section"')[1].split('</nav>')[0];
  assert.equal((nav.match(/<a href="#profile-/g) || []).length, 6);
  assert.match(profile, /\.about-jump a \{[^}]*min-height: 44px/);
});

test('Publication covers use existing responsive assets without replacing source figures', () => {
  const visuals = read('_data/publication_visuals.yml');
  const papers = JSON.parse(read('_data/google-scholar-publications.json')).sections.flatMap(section => section.items);
  for (const id of ['5nxA0vEk-isC', 'ufrVoPGSRksC', 'LkGwnXOMwfcC']) {
    const entry = visuals.split(`${id}:`)[1].split(/\r?\n(?=\S)/)[0];
    for (const field of ['preview', 'scene', 'scene_small']) {
      const path = entry.match(new RegExp(`\\n  ${field}: (/assets/img/[^\\s]+)`))?.[1];
      assert.ok(path, `${id}: ${field}`);
      const bytes = readFileSync(join(__dirname, '..', path.slice(1)));
      assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    }
    assert.match(entry, /scene_alt: .+/);
    assert.ok(readFileSync(join(__dirname, '..', papers.find(p => p.id === id).image.slice(1))).length);
  }
  assert.match(read('_includes/home-research.html'), /srcset="\{\{ visual\.scene_small \| relative_url \}\} 720w/);
});

test('Footer separates contacts, private tools and privacy without removing destinations', () => {
  const footer = read('_includes/footer.html');
  const contact = footer.split('aria-label="Contact"')[1].split('</nav>')[0];
  const tools = footer.split('aria-label="Private tools"')[1].split('</nav>')[0];
  assert.match(contact, /Email<\/a>/);
  assert.match(contact, /LinkedIn<\/a>/);
  assert.match(contact, /Scholar<\/a>/);
  assert.doesNotMatch(contact, /Private Workspace|Owner analytics|Privacy/);
  assert.match(tools, /Private Workspace<\/a>/);
  assert.match(tools, /Owner analytics<\/a>/);
  assert.doesNotMatch(tools, /Privacy/);
  assert.match(footer, /class="footer-link footer-privacy"[^>]+>Privacy<\/a>/);
  const css = read('assets/site.css');
  assert.match(css, /\.footer-navigation \{[^}]*display: grid;[^}]*justify-items: start/);
  assert.match(css, /\.footer-links \{[^}]*justify-content: flex-start/);
});

test('Quieter journal badges preserve their interaction hooks and the fireworks implementation', () => {
  const publications = read('publications/index.html');
  assert.match(publications, /\.pub-journal-chip\{[^}]*min-height:30px;[^}]*font-size:\.8125rem;[^}]*font-weight:600/);
  assert.match(publications, /\.pub-journal-chip--top\{background:#e8eef4;color:#174265\}/);
  for (const name of ['pub-journal-chip--top', 'pub-journal-chip--quartile', 'pub-journal-chip--if', 'pub-chip-spark']) {
    assert.ok(publications.includes(name));
  }
  assert.match(read('assets/site.js'), /pub-chip-burst/);
  assert.match(read('_layouts/default.html'), /assets\/site\.css[^\n]*20261101b/);
  assert.match(read('_layouts/default.html'), /assets\/home-research\.css[^\n]*20261101b/);
});
