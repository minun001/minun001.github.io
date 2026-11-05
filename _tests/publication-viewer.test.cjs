const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const { runInNewContext } = require('node:vm');

const read = path => readFileSync(join(__dirname, '..', path), 'utf8');
const origin = 'https://minun001.github.io';
const records = {
  figure: { title: 'Example research figure', figure: '/assets/img/fig-model.png', figure_alt: 'Original model diagram', pdf: '' },
  paper: { title: 'Example conference paper', figure: '', pdf: '/assets/papers/min-2026-euroma-service-routines.pdf' },
};

function fixture(search, catalog = records, rawJson, loadPDF) {
  class Element {
    constructor() { this.hidden = true; this.textContent = ''; this.listeners = {}; this.src = ''; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
  }
  const ids = ['media-status', 'publication-media-data', 'media-title', 'media-kind', 'media-download', 'media-original', 'media-actions', 'media-pdf', 'media-pdf-help', 'media-figure', 'media-figure-frame'];
  const nodes = Object.fromEntries(ids.map(id => [id, new Element()]));
  nodes['publication-media-data'].textContent = rawJson ?? JSON.stringify(catalog);
  const document = { title: 'Publication viewer', listeners: {}, getElementById: id => nodes[id], addEventListener(name, fn) { this.listeners[name] = fn; } };
  const window = { location: { origin, search } };
  const source = read('assets/publication-viewer.js').replace(/\}\)\(\);\s*$/, 'window.resolveMedia = resolveMedia; window.initializeViewer = initializeViewer;})();');
  runInNewContext(source, { document, window, URL, URLSearchParams });
  const pdfCalls = [];
  const ready = window.initializeViewer(async media => { pdfCalls.push(media); if (loadPDF) await loadPDF(media); });
  return { nodes, document, resolve: window.resolveMedia, pdfCalls, ready };
}

test('The PDF reader keeps the website document and passes only its published original to the renderer', () => {
  const { nodes, document, pdfCalls } = fixture('?paper=paper&type=pdf');
  assert.equal(document.title, 'Full paper PDF | Hyunsik Min');
  assert.equal(nodes['media-pdf'].hidden, false);
  assert.equal(pdfCalls.length, 1);
  assert.equal(pdfCalls[0].url, origin + records.paper.pdf);
  assert.equal(pdfCalls[0].title, records.paper.title);
  assert.equal(nodes['media-pdf-help'].hidden, false);
  assert.equal(nodes['media-figure-frame'].hidden, true);
  assert.equal(nodes['media-original'].href, origin + records.paper.pdf);
  assert.equal(nodes['media-download'].href, nodes['media-original'].href);
});

test('The image reader uses the original figure, meaningful alt text and a recoverable load error', () => {
  const { nodes } = fixture('?paper=figure&type=figure');
  assert.equal(nodes['media-figure-frame'].hidden, false);
  assert.equal(nodes['media-figure'].src, origin + records.figure.figure);
  assert.equal(nodes['media-figure'].alt, records.figure.figure_alt);
  assert.equal(nodes['media-pdf'].hidden, true);
  nodes['media-figure'].listeners.load();
  assert.match(nodes['media-status'].textContent, /fitted to this screen/);
  nodes['media-figure'].listeners.error();
  assert.equal(nodes['media-figure-frame'].hidden, true);
  assert.match(nodes['media-status'].textContent, /could not load/);
  assert.equal(nodes['media-actions'].hidden, false);
});

test('A failed PDF renderer leaves original links available instead of an empty document', async () => {
  const { nodes, ready } = fixture('?paper=paper&type=pdf', records, undefined, async () => { throw new Error('PDF unavailable'); });
  await ready;
  assert.equal(nodes['media-pdf'].hidden, true);
  assert.equal(nodes['media-actions'].hidden, false);
  assert.equal(nodes['media-original'].href, origin + records.paper.pdf);
  assert.match(nodes['media-status'].textContent, /preview could not load/);
});

test('Missing, unknown and prototype-key publication parameters cannot load any file', () => {
  for (const search of ['', '?paper=unknown&type=pdf', '?paper=constructor&type=pdf', '?paper=__proto__&type=figure', '?paper=paper&type=iframe', '?paper=paper&type=figure', '?src=https://attacker.example/a.pdf&type=pdf']) {
    const { nodes } = fixture(search);
    assert.equal(nodes['media-pdf'].src, '', search);
    assert.equal(nodes['media-figure'].src, '', search);
    assert.equal(nodes['media-actions'].hidden, true, search);
    assert.match(nodes['media-status'].textContent, /not available/, search);
  }
});

test('The allowlist rejects remote URLs, private paths, traversal, encoded paths and non-media files', () => {
  const f = fixture('');
  const blocked = ['https://attacker.example/a.pdf', '//attacker.example/a.pdf', 'javascript:alert(1)', 'data:application/pdf,example', '/.private/file.pdf', '/assets/papers/../../.private/file.pdf', '/assets/papers/%2e%2e/private.pdf', '/assets/papers/a.pdf?token=secret', '/assets/papers/a.pdf#fragment', '/assets/papers/a.html', '/assets/papers/..\\private.pdf'];
  for (const pdf of blocked) assert.equal(f.resolve({ paper: { title: 'Example', pdf } }, '?paper=paper&type=pdf', origin), null, pdf);
});

test('Malformed registry data fails closed without breaking navigation or leaking a source URL', () => {
  const { nodes } = fixture('?paper=paper&type=pdf', records, '{bad json');
  assert.equal(nodes['media-actions'].hidden, true);
  assert.equal(nodes['media-pdf'].src, '');
  assert.match(nodes['media-status'].textContent, /publication list could not load/);
});

test('Published assets, Scholar PDF metadata and public paper descriptions remain canonical', () => {
  const papers = JSON.parse(read('_data/publication_fulltexts.json'));
  for (const record of Object.values(papers)) {
    const pdf = readFileSync(join(__dirname, '..', record.pdf_path));
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    assert.ok(read(record.path.slice(1) + 'index.html').includes('layout: conference-paper'));
  }
  assert.match(read('_includes/scholarly-paper-meta.html'), /citation_pdf_url" content="\{\{ paper\.pdf_path \| absolute_url \}\}"/);
  assert.match(read('_layouts/conference-paper.html'), /\?paper=\{\{ page\.paper_id \| url_encode \}\}&amp;type=pdf/);
  assert.match(read('publications/index.html'), /\?paper=\{\{ item\.id \| url_encode \}\}&amp;type=pdf/);
  assert.doesNotMatch(read('assets/publication-viewer.js'), /innerHTML|fetch\(|localStorage|sessionStorage|window\.open|location\.(assign|replace)/);
});

test('The viewer inherits the shared favicon and keeps no-JS originals and mobile fallbacks available', () => {
  const viewer = read('viewer/index.html');
  assert.match(viewer, /layout: default/);
  assert.match(viewer, /robots: noindex,follow/);
  assert.match(viewer, /<noscript>[\s\S]*paper\.image \| relative_url[\s\S]*fulltext\.pdf_path \| relative_url/);
  assert.match(viewer, /replace: '<', '\\u003c'/);
  assert.match(viewer, /id="media-download" download/);
  assert.match(viewer, /id="media-original" target="_blank" rel="noopener"/);
  assert.match(read('assets/publication-viewer.css'), /max-width: 100%/);
  assert.match(read('_layouts/default.html'), /script_bundle == 'publication-media'/);
});
