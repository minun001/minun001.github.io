const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const { runInNewContext } = require('node:vm');

const source = readFileSync(join(__dirname, '../assets/site.js'), 'utf8');

function fixture(query = '', reduced = false) {
  class Element {
    constructor(attrs = {}, textContent = '') {
      this.attrs = { ...attrs };
      this.textContent = textContent;
      this.hidden = false;
      this.value = '';
      this.innerHTML = '';
      this.listeners = {};
      this.nodes = {};
      const classes = new Set();
      this.classList = {
        remove: name => classes.delete(name),
        contains: name => classes.has(name),
        toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); },
      };
    }
    getAttribute(name) { return this.attrs[name] ?? null; }
    hasAttribute(name) { return Object.hasOwn(this.attrs, name); }
    setAttribute(name, value) { this.attrs[name] = value; }
    removeAttribute(name) { delete this.attrs[name]; }
    querySelector(selector) { return this.nodes[selector] || null; }
    querySelectorAll(selector) { return this.nodes[selector] || []; }
    addEventListener(name, listener) { this.listeners[name] = listener; }
    focus(options) { this.focused = options || true; }
    scrollIntoView(options) { this.scrolled = options; }
    closest(selector) { return selector === '[data-publication-section]' ? this.section : this; }
  }
  const sections = ['international-journals', 'domestic-journals'].map((id, index) => {
    const section = new Element();
    section.id = id;
    section.nodes.h2 = new Element({}, index ? 'Domestic journals' : 'International journals');
    section.nodes['[data-publication-item]'] = [];
    return section;
  });
  const definitions = [
    ['SolarNexus', 'SolarNexus forecasting', 'Applied Energy', 'Volume 391 Article 125848', 0],
    ['SolarFlux', 'SolarFlux forecasting', 'Electronics', 'Volume 13', 0],
    ['Traffic', 'Traffic prediction', 'Transport Journal', 'Volume 24', 1],
  ];
  const items = definitions.map(([short, title, venue, details, index]) => {
    const item = new Element({ 'data-short-title': short, 'data-search': `${title} ${venue} ${details}` });
    item.id = `publication-${short}`;
    item.section = sections[index];
    item.nodes.h3 = new Element({}, title);
    item.nodes['.pub-meta-value'] = [new Element({}, venue), new Element({}, 'One Author'), new Element({}, 'Cited by 0')];
    item.nodes['[data-publication-details]'] = new Element({}, details);
    item.section.nodes['[data-publication-item]'].push(item);
    return item;
  });
  const summaries = sections.map(section => {
    const link = new Element({ href: `#${section.id}`, 'data-publication-summary': section.id });
    link.nodes.span = new Element({}, section.nodes.h2.textContent);
    link.nodes['[data-publication-summary-count]'] = new Element();
    return link;
  });
  const controls = Object.fromEntries(['search', 'results', 'reset', 'count', 'empty'].map(name => [name, new Element()]));
  const root = new Element();
  for (const [name, element] of Object.entries(controls)) root.nodes[`[data-publication-${name}]`] = element;
  for (const section of sections) root.nodes[`#${section.id}`] = section;
  root.nodes['[data-publication-item]'] = items;
  root.nodes['[data-publication-section]'] = sections;
  root.nodes['[data-publication-summary]'] = summaries;
  const window = {
    location: new URL('https://minun001.github.io/publications/' + query),
    history: { replaceState(_state, _title, url) { window.location = new URL(url, window.location); } },
    matchMedia: () => ({ matches: reduced }),
  };
  const document = {
    querySelector: () => root,
    getElementById: id => items.find(item => item.id === id) || null,
    addEventListener() {},
  };
  runInNewContext(source.replace(/\}\)\(\);\s*$/, 'window.bindSearch = bindPublicationSearch;})();'), { window, document, Element, URLSearchParams });
  window.bindSearch();
  function search(value) { controls.search.value = value; controls.search.listeners.input(); }
  function key(key) {
    const event = { key, prevented: false, preventDefault() { this.prevented = true; } };
    controls.search.listeners.keydown(event);
    return event;
  }
  return { controls, items, sections, summaries, window, Element, search, key };
}

test('Publication search starts with canonical counts and every section reachable', () => {
  const f = fixture();
  assert.equal(f.controls.count.textContent, '3 total records');
  assert.equal(f.summaries[0].nodes['[data-publication-summary-count]'].textContent, '2 papers');
  assert.ok(f.summaries.every(link => link.hasAttribute('href') && !link.hasAttribute('aria-disabled')));
  assert.equal(f.controls.results.hidden, true);
});

test('Single-match search disables empty category targets and does not duplicate the record', () => {
  const f = fixture();
  f.summaries[1].classList.toggle('is-active', true);
  f.search('SolarNexus');
  assert.equal(f.controls.count.textContent, '1 of 3 records');
  assert.deepEqual(f.sections.map(section => section.hidden), [false, true]);
  assert.equal(f.summaries[0].nodes['[data-publication-summary-count]'].textContent, '1 / 2');
  assert.equal(f.summaries[1].getAttribute('aria-label'), 'Domestic journals, 0 of 1 paper');
  assert.equal(f.summaries[1].getAttribute('aria-disabled'), 'true');
  assert.equal(f.summaries[1].getAttribute('tabindex'), '-1');
  assert.equal(f.summaries[1].hasAttribute('href'), false);
  assert.equal(f.summaries[1].classList.contains('is-active'), false);
  assert.equal(f.controls.results.hidden, true);
  assert.equal(f.controls.search.getAttribute('aria-expanded'), 'false');
});

test('No-match state and Reset restore category links, totals, focus and query parameters', () => {
  const f = fixture('?keep=1#international-journals');
  f.search('unmatched-zzzz');
  assert.equal(f.controls.empty.hidden, false);
  assert.ok(f.sections.every(section => section.hidden));
  assert.ok(f.summaries.every(link => !link.hasAttribute('href')));
  f.controls.reset.listeners.click();
  assert.equal(f.controls.count.textContent, '3 total records');
  assert.ok(f.items.every(item => !item.hidden));
  assert.ok(f.summaries.every(link => link.hasAttribute('href') && !link.hasAttribute('aria-disabled') && !link.hasAttribute('tabindex')));
  assert.equal(f.controls.search.focused, true);
  assert.equal(f.window.location.search, '?keep=1');
  assert.equal(f.window.location.hash, '#international-journals');
});

test('Initial URL queries and later searches keep category states synchronized', () => {
  const f = fixture('?q=Traffic');
  assert.deepEqual(f.sections.map(section => section.hidden), [true, false]);
  f.search('forecasting');
  assert.deepEqual(f.sections.map(section => section.hidden), [false, true]);
  assert.equal(f.summaries[0].getAttribute('href'), '#international-journals');
  assert.equal(f.controls.search.getAttribute('aria-expanded'), 'true');
});

test('Collapsed bibliographic details remain searchable', () => {
  const f = fixture();
  f.search('125848');
  assert.equal(f.items[0].hidden, false);
  assert.equal(f.items[1].hidden, true);
  assert.equal(f.controls.count.textContent, '1 of 3 records');
});

test('Multiple-match shortcuts stay on the archive instead of opening Scholar', () => {
  const f = fixture();
  f.search('forecasting');
  assert.match(f.controls.results.innerHTML, /Jump to a match/);
  assert.match(f.controls.results.innerHTML, /href="#publication-SolarNexus"/);
  assert.doesNotMatch(f.controls.results.innerHTML, /target=|https:|pub-search-result-meta/);
  const target = new f.Element({ 'data-publication-result': 'publication-SolarFlux' });
  let prevented = false;
  f.controls.results.listeners.click({ target, preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.ok(f.items[1].focused);
  assert.equal(f.items[1].scrolled.block, 'start');
});

test('Enter jumps to a visible record, respects reduced motion and ignores empty results', () => {
  const f = fixture('', true);
  f.search('SolarNexus');
  assert.equal(f.key('Enter').prevented, true);
  assert.equal(f.items[0].scrolled.behavior, 'auto');
  assert.ok(f.items[0].focused);
  f.search('unmatched-zzzz');
  assert.equal(f.key('Enter').prevented, false);
});

test('Publication detail disclosures preserve source metadata and visible citations', () => {
  const html = readFileSync(join(__dirname, '../publications/index.html'), 'utf8');
  assert.match(html, /<details class="pub-details">\s*<summary>Publication details<\/summary>/);
  assert.match(html, /data-publication-details>\{\{ item.details \| escape \}\}/);
  assert.match(html, /DOI: \{\{ item.doi \| escape \}\}/);
  assert.match(html, /data-publication-citations/);
  assert.match(html, /item.citation_count != nil/);
  assert.match(html, /createCelebrationBurst|pub-chip-spark/);
});

test('Section observer cannot reactivate a disabled or hidden publication category', () => {
  let observeEntries;
  const sections = ['first', 'second'].map(id => ({ id, hidden: false }));
  const links = sections.map(section => {
    const attrs = { href: `#${section.id}` };
    return {
      attrs, active: false,
      getAttribute: name => attrs[name] || null,
      addEventListener() {},
      classList: { toggle(_name, active) { links[sections.indexOf(section)].active = active; } },
    };
  });
  const document = {
    addEventListener() {},
    querySelectorAll: () => [{ querySelectorAll: () => links }],
    querySelector: selector => sections.find(section => '#' + section.id === selector),
  };
  const window = { location: { hash: '' } };
  class Observer {
    constructor(callback) { observeEntries = callback; }
    observe() {}
  }
  runInNewContext(source.replace(/\}\)\(\);\s*$/, 'window.bindIndex = bindSectionIndex;})();'), { window, document, IntersectionObserver: Observer });
  window.bindIndex();
  assert.equal(links[0].active, true);
  sections[0].hidden = true;
  links[0].attrs['aria-disabled'] = 'true';
  observeEntries([{ isIntersecting: true, target: sections[0], boundingClientRect: { top: 0 } }]);
  assert.equal(links[0].active, false);
  observeEntries([{ isIntersecting: true, target: sections[1], boundingClientRect: { top: 1 } }]);
  assert.equal(links[1].active, true);
});
