const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const { runInNewContext } = require('node:vm');

function fixture(failPage = 0) {
  const nodes = Object.fromEntries(['media-pdf', 'pdf-canvas', 'pdf-previous', 'pdf-next', 'pdf-page', 'media-status', 'pdf-text'].map(id => [id, {
    clientWidth: 800, listeners: {}, attributes: {},
    addEventListener(name, fn) { this.listeners[name] = fn; },
    setAttribute(name, value) { this.attributes[name] = value; },
    getContext() { return {}; },
  }]));
  const rendered = [];
  let destroyed = false;
  let request;
  const pdfjsLib = {
    GlobalWorkerOptions: {},
    getDocument(options) {
      request = options;
      return { destroy() { destroyed = true; }, promise: Promise.resolve({
        numPages: 3,
        async getPage(number) {
          if (number === failPage) throw new Error('Page unavailable');
          return {
            getViewport({ scale }) { return { width: 600 * scale, height: 800 * scale }; },
            render(options) { rendered.push({ number, options }); return { promise: Promise.resolve() }; },
            async getTextContent() { return { items: [{ str: `Page ${number} text`, hasEOL: true }] }; },
          };
        },
      }) };
    },
  };
  const window = { devicePixelRatio: 3, listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; } };
  const document = { getElementById: id => nodes[id] };
  const code = readFileSync(join(__dirname, '..', 'assets/publication-pdf.js'), 'utf8')
    .replace(/^import .*;\s*/m, '')
    .replace('import.meta.url', JSON.stringify('https://minun001.github.io/assets/publication-pdf.js'))
    .replace('export async function', 'async function');
  runInNewContext(code + '\nwindow.openPDF = openPDF;', { pdfjsLib, document, window, URL });
  return { nodes, rendered, window, pdfjsLib, request: () => request, destroyed: () => destroyed,
    open: () => window.openPDF('https://minun001.github.io/assets/papers/example.pdf', 'Example paper') };
}

const settle = () => new Promise(resolve => setImmediate(resolve));

test('PDF pages use a local worker, bounded HiDPI canvas and accessible page text', async () => {
  const f = fixture();
  await f.open();
  assert.equal(f.request().isEvalSupported, false);
  assert.match(f.pdfjsLib.GlobalWorkerOptions.workerSrc, /\/assets\/lib\/pdfjs-6\.5\.438\/pdf\.worker\.min\.mjs$/);
  assert.equal(f.nodes['pdf-page'].textContent, 'Page 1 of 3');
  assert.equal(f.nodes['pdf-previous'].disabled, true);
  assert.equal(f.nodes['pdf-next'].disabled, false);
  assert.equal(f.nodes['pdf-canvas'].width, 1600);
  assert.equal(f.rendered[0].options.transform[0], 2);
  assert.match(f.nodes['pdf-canvas'].attributes['aria-label'], /Example paper, page 1 of 3/);
  assert.equal(f.nodes['pdf-text'].textContent, 'Page 1 text\n');
});

test('Rapid paging cannot concurrently render one canvas or go beyond the document', async () => {
  const f = fixture();
  await f.open();
  f.nodes['pdf-next'].listeners.click();
  f.nodes['pdf-next'].listeners.click();
  await settle();
  assert.equal(f.nodes['pdf-page'].textContent, 'Page 2 of 3');
  f.nodes['pdf-next'].listeners.click();
  await settle();
  assert.equal(f.nodes['pdf-next'].disabled, true);
  f.nodes['pdf-next'].listeners.click();
  await settle();
  assert.deepEqual(f.rendered.map(page => page.number), [1, 2, 3]);
  f.nodes['pdf-previous'].listeners.click();
  await settle();
  assert.equal(f.nodes['pdf-page'].textContent, 'Page 2 of 3');
});

test('A broken PDF page recovers controls and provides the original-file fallback', async () => {
  const f = fixture(2);
  await f.open();
  f.nodes['pdf-next'].listeners.click();
  await settle();
  assert.match(f.nodes['media-status'].textContent, /could not render.*Open original file/);
  assert.equal(f.nodes['pdf-previous'].disabled, false);
  f.nodes['pdf-previous'].listeners.click();
  await settle();
  assert.match(f.nodes['media-status'].textContent, /Page 1 of 3/);
});

test('The PDF worker is disposed on navigation without breaking back-forward cache', async () => {
  const f = fixture();
  await f.open();
  f.window.listeners.pagehide({ persisted: true });
  assert.equal(f.destroyed(), false);
  f.window.listeners.pagehide({ persisted: false });
  assert.equal(f.destroyed(), true);
  for (const name of ['pdf.min.mjs', 'pdf.worker.min.mjs', 'LICENSE']) {
    assert.equal(existsSync(join(__dirname, '..', 'assets/lib/pdfjs-6.5.438', name)), true);
  }
});
