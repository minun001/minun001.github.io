const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const { runInNewContext } = require('node:vm');

const read = path => readFileSync(join(__dirname, '..', path), 'utf8');

function citationFixture() {
  const document = {
    listeners: {},
    addEventListener(name, listener) { this.listeners[name] = listener; },
  };
  class Element {
    constructor(attrs = {}) {
      this.attrs = attrs;
      this.listeners = {};
      this.isConnected = true;
      this.textContent = '';
      this.visible = true;
    }
    addEventListener(name, listener) { this.listeners[name] = listener; }
    getAttribute(name) { return this.attrs[name] || null; }
    getClientRects() { return this.visible ? [{}] : []; }
    focus() { document.activeElement = this; }
    closest() { return this.attrs['data-bibtex-target'] || this.attrs['data-bibtex-content'] ? this : null; }
  }
  const trigger = new Element({ 'data-bibtex-target': 'test-citation' });
  const modal = new Element();
  const dialog = new Element();
  const close = new Element();
  const backdrop = new Element();
  const copy = new Element();
  const content = new Element();
  const status = new Element();
  const source = new Element();
  source.textContent = '  @article{example, author={One Author and Another Author}}  ';
  modal.hidden = true;
  dialog.controls = [close, copy];
  dialog.querySelectorAll = () => dialog.controls;
  dialog.contains = node => node === dialog || dialog.controls.includes(node);
  modal.querySelector = () => dialog;
  modal.querySelectorAll = () => [close, backdrop];
  const elements = {
    'bibtex-modal': modal, 'bibtex-content': content, 'bibtex-copy-state': status,
    'bibtex-copy-button': copy, 'test-citation': source,
  };
  document.getElementById = id => elements[id];
  const clipboard = { async writeText(value) { clipboard.value = value; } };
  const script = read('publications/index.html').match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  runInNewContext(script, { document, Element, navigator: { clipboard } });
  document.listeners.DOMContentLoaded();
  function open() {
    trigger.focus();
    document.listeners.click({ target: trigger });
  }
  function key(name, shiftKey = false) {
    const event = { key: name, shiftKey, prevented: false, preventDefault() { this.prevented = true; } };
    document.listeners.keydown(event);
    return event;
  }
  return { document, trigger, modal, dialog, close, backdrop, copy, content, status, clipboard, open, key };
}

test('Opening a citation focuses its first control and preserves its content', () => {
  const f = citationFixture();
  f.open();
  assert.equal(f.modal.hidden, false);
  assert.equal(f.document.activeElement, f.close);
  assert.equal(f.content.textContent, '@article{example, author={One Author and Another Author}}');
  assert.match(read('publications/index.html'), /id="bibtex-copy-state" role="status" aria-live="polite"/);
});

test('Tab and Shift+Tab wrap inside the citation dialog', () => {
  const f = citationFixture();
  f.open();
  assert.equal(f.key('Tab').prevented, false);
  assert.equal(f.key('Tab', true).prevented, true);
  assert.equal(f.document.activeElement, f.copy);
  assert.equal(f.key('Tab').prevented, true);
  assert.equal(f.document.activeElement, f.close);
  f.trigger.focus();
  assert.equal(f.key('Tab').prevented, true);
  assert.equal(f.document.activeElement, f.close);
});

test('Escape returns focus to the original citation button without trapping a closed page', () => {
  const f = citationFixture();
  f.open();
  assert.equal(f.key('Escape').prevented, true);
  assert.equal(f.modal.hidden, true);
  assert.equal(f.document.activeElement, f.trigger);
  assert.equal(f.status.textContent, 'Ready to copy.');
  assert.equal(f.key('Tab').prevented, false);
});

test('Close and backdrop restore focus; a removed trigger is not focused', () => {
  const f = citationFixture();
  f.open();
  f.close.listeners.click();
  assert.equal(f.document.activeElement, f.trigger);
  f.open();
  f.backdrop.listeners.click();
  assert.equal(f.modal.hidden, true);
  assert.equal(f.document.activeElement, f.trigger);
  f.open();
  f.trigger.isConnected = false;
  f.close.listeners.click();
  assert.equal(f.document.activeElement, f.close);
});

test('A dialog without enabled visible controls keeps focus on the dialog', () => {
  const f = citationFixture();
  f.close.disabled = true;
  f.copy.visible = false;
  f.open();
  assert.equal(f.document.activeElement, f.dialog);
  assert.equal(f.key('Tab').prevented, true);
  assert.equal(f.document.activeElement, f.dialog);
});

test('Copy reports success or a manual-copy fallback without changing the citation', async () => {
  const f = citationFixture();
  f.open();
  await f.copy.listeners.click();
  assert.equal(f.clipboard.value, f.content.textContent);
  assert.equal(f.status.textContent, 'Copied to clipboard.');
  f.clipboard.writeText = async () => { throw new Error('Clipboard unavailable'); };
  await f.copy.listeners.click();
  assert.equal(f.status.textContent, 'Copy failed. Select and copy manually.');
  assert.match(f.content.textContent, /One Author and Another Author/);
});

function newsFixture(query = '') {
  function element(attrs = {}) {
    const classes = new Set();
    return {
      attrs, hidden: false, listeners: {},
      getAttribute: name => attrs[name] || null,
      setAttribute(name, value) { attrs[name] = value; },
      addEventListener(name, listener) { this.listeners[name] = listener; },
      classList: {
        toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); },
        remove: name => classes.delete(name),
        contains: name => classes.has(name),
      },
    };
  }
  const buttons = ['all', 'journal', 'conference', 'project', 'award', 'academic']
    .map(kind => element({ 'data-news-filter': kind }));
  const years = ['2026', '2025', '2024'].map(year => {
    const node = element();
    node.id = 'news-' + year;
    node.items = [];
    node.querySelectorAll = () => node.items;
    return node;
  });
  years[0].items = [element({ 'data-news-kind': 'academic' }), element({ 'data-news-kind': 'conference' })];
  years[1].items = [element({ 'data-news-kind': 'journal' })];
  years[2].items = [element({ 'data-news-kind': 'project' })];
  const links = years.map(year => element({ href: '#' + year.id }));
  const empty = element();
  const selectors = {
    '[data-news-filter]': buttons,
    '[data-news-item]': years.flatMap(year => year.items),
    '[data-news-year]': years,
    '.news-jump a[href^="#"]': links,
  };
  const root = {
    querySelectorAll: selector => selectors[selector] || [],
    querySelector: selector => selector === '[data-news-empty]' ? empty : years.find(year => '#' + year.id === selector),
  };
  const window = {
    location: new URL('https://minun001.github.io/news/' + query),
    history: { replaceState(_state, _title, url) { window.location = new URL(url, window.location); } },
  };
  const source = read('assets/site.js').replace(/\}\)\(\);\s*$/, 'window.bindNewsFilter = bindNewsFilter;})();');
  runInNewContext(source, {
    window, URLSearchParams,
    document: { querySelector: () => root, getElementById: () => null, addEventListener() {} },
  });
  window.bindNewsFilter();
  const click = kind => buttons.find(button => button.attrs['data-news-filter'] === kind).listeners.click();
  return { window, buttons, years, links, empty, click };
}

test('News year links follow the visible filtered years and All restores them', () => {
  const f = newsFixture('?news=academic');
  assert.deepEqual(f.years.map(year => year.hidden), [false, true, true]);
  assert.deepEqual(f.links.map(link => link.hidden), [false, true, true]);
  f.click('journal');
  assert.deepEqual(f.links.map(link => link.hidden), [true, false, true]);
  f.click('all');
  assert.ok(f.links.every(link => !link.hidden));
  assert.ok(f.years.every(year => !year.hidden));
  assert.equal(f.window.location.search, '');
});

test('An empty News category hides all year links and removes stale active state', () => {
  const f = newsFixture();
  f.links[0].classList.toggle('is-active', true);
  f.click('award');
  assert.equal(f.empty.hidden, false);
  assert.ok(f.links.every(link => link.hidden && !link.classList.contains('is-active')));
  f.click('conference');
  assert.equal(f.empty.hidden, true);
  assert.deepEqual(f.links.map(link => link.hidden), [false, true, true]);
});

test('Invalid News queries still fall back to All with every valid year link', () => {
  const f = newsFixture('?news=foo');
  assert.ok(f.links.every(link => !link.hidden));
  assert.equal(f.window.location.search, '');
  assert.equal(f.buttons[0].attrs['aria-pressed'], 'true');
});
