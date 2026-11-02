const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const { runInNewContext } = require('node:vm');

const read = path => readFileSync(join(__dirname, '..', path), 'utf8');

function fixture({ reduced = false, observer = true } = {}) {
  class Element {
    constructor(attrs = {}) {
      this.attrs = attrs;
      this.listeners = {};
      this.hidden = false;
      const classes = new Set();
      this.classList = { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) };
    }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    getAttribute(name) { return this.attrs[name] ?? null; }
    setAttribute(name, value) { this.attrs[name] = value; }
    removeAttribute(name) { delete this.attrs[name]; }
    click() { this.listeners.click(); }
  }
  const buttons = ['route', 'sail', 'graph'].map(kind => new Element({ 'data-page-signature': kind }));
  const links = ['2026', '2025'].map(year => new Element({ href: '#news-' + year }));
  const filters = [new Element()];
  const years = Object.fromEntries(links.map(link => {
    const year = new Element();
    year.item = new Element();
    year.querySelector = () => year.item;
    return [link.attrs.href.slice(1), year];
  }));
  const document = {
    hidden: false, listeners: {},
    addEventListener(name, fn) { this.listeners[name] = fn; },
    getElementById: id => years[id],
    querySelectorAll: selector => selector === '[data-page-signature]' ? buttons : selector === '[data-news-filter]' ? filters : links,
  };
  const motion = { matches: reduced, addEventListener(_name, fn) { this.change = fn; } };
  const timers = new Map();
  let nextId = 0;
  const window = {
    listeners: {}, matchMedia: () => motion,
    addEventListener(name, fn) { this.listeners[name] = fn; },
    setTimeout(fn, delay) { const id = ++nextId; timers.set(id, { fn, delay }); return id; },
    clearTimeout: id => timers.delete(id),
  };
  let arrival;
  class Observer {
    constructor(callback) { this.callback = callback; this.targets = new Set(); arrival = this; }
    observe(target) { this.targets.add(target); }
    disconnect() { this.targets.clear(); }
  }
  const context = { document, window };
  if (observer) context.IntersectionObserver = Observer;
  runInNewContext(read('assets/site-signatures.js'), context);
  document.listeners.DOMContentLoaded();
  return {
    buttons, links, filters, years, document, window, motion, timers,
    intersect(target, isIntersecting = true) { arrival.callback([{ target, isIntersecting }]); },
    pending: () => arrival.targets.size,
    finish() { for (const [id, timer] of timers) { timers.delete(id); timer.fn(); } },
  };
}

test('All three signatures wait for user activation, ignore rapid repeats and clean up', () => {
  const f = fixture();
  assert.equal(f.timers.size, 0);
  for (const button of f.buttons) {
    assert.equal(button.hidden, false);
    assert.equal(button.classList.contains('is-playing'), false);
    button.click();
    button.click();
    assert.equal(f.timers.size, 1);
    assert.equal(button.attrs['aria-busy'], 'true');
    assert.equal(button.classList.contains('is-playing'), true);
    assert.ok([...f.timers.values()][0].delay < 2000);
    f.finish();
    assert.equal(button.classList.contains('is-playing'), false);
    assert.equal(button.getAttribute('aria-busy'), null);
  }
});

test('Reduced motion hides decorative controls and cancels an active or pending effect', () => {
  const f = fixture({ reduced: true });
  assert.ok(f.buttons.every(button => button.hidden));
  f.buttons[0].click();
  f.links[0].click();
  assert.equal(f.timers.size, 0);
  assert.equal(f.pending(), 0);
  f.motion.matches = false;
  f.motion.change();
  f.buttons[0].click();
  f.links[0].click();
  f.motion.matches = true;
  f.motion.change();
  assert.equal(f.timers.size, 0);
  assert.equal(f.pending(), 0);
  assert.ok(f.buttons.every(button => button.hidden && !button.classList.contains('is-playing')));
});

test('Hidden tabs and pagehide stop effects rather than leaving timers or moving graphics', () => {
  const f = fixture();
  for (const name of ['visibilitychange', 'pagehide']) {
    f.document.hidden = false;
    f.buttons[0].click();
    f.links[0].click();
    if (name === 'visibilitychange') { f.document.hidden = true; f.document.listeners[name](); }
    else f.window.listeners[name]();
    assert.equal(f.timers.size, 0);
    assert.equal(f.pending(), 0);
    assert.equal(f.buttons[0].classList.contains('is-playing'), false);
  }
  f.document.hidden = true;
  f.buttons[0].click();
  assert.equal(f.timers.size, 0);
});

test('Year jumps animate the destination only after arrival and keep native links intact', () => {
  const f = fixture();
  const item = f.years['news-2025'].item;
  f.links[1].click();
  assert.equal(f.pending(), 1);
  assert.equal(f.timers.size, 0);
  f.intersect(item, false);
  assert.equal(f.timers.size, 0);
  f.intersect(item);
  assert.equal(f.pending(), 0);
  assert.equal(item.classList.contains('is-year-pulsing'), true);
  f.finish();
  assert.equal(item.classList.contains('is-year-pulsing'), false);
  assert.doesNotMatch(read('assets/site-signatures.js'), /preventDefault|location\.|fetch\(|setInterval/);
});

test('A new year choice, filtering or a hidden destination cannot trigger a stale pulse', () => {
  const f = fixture();
  f.links[0].click();
  f.links[1].click();
  f.intersect(f.years['news-2026'].item);
  assert.equal(f.timers.size, 0);
  f.filters[0].click();
  f.intersect(f.years['news-2025'].item);
  assert.equal(f.timers.size, 0);
  f.links[0].hidden = true;
  f.links[0].click();
  f.years['news-2025'].hidden = true;
  f.links[1].click();
  assert.equal(f.pending(), 0);
});

test('Older browsers without an arrival observer keep year links functional', () => {
  const f = fixture({ observer: false });
  f.links[0].click();
  assert.equal(f.years['news-2026'].item.classList.contains('is-year-pulsing'), true);
  f.finish();
  assert.equal(f.timers.size, 0);
});

test('Author emphasis matches the complete owner name at render time without editing source data', () => {
  const template = read('_includes/publication-authors.html');
  assert.match(template, /include\.authors \| split: ','/);
  assert.match(template, /author == owner_name/);
  assert.match(template, /class="pub-author-self"/);
  assert.match(template, /author \| escape/);
  assert.match(read('publications/index.html'), /include publication-authors\.html authors=item\.authors/);
  const css = read('assets/site-signatures.css');
  assert.match(css, /\.pub-author-self \{[^}]*font-weight: 700/);
  assert.match(css, /\.pub-item:focus-within \.pub-author-self/);
  const archive = JSON.parse(read('_data/google-scholar-publications.json'));
  const papers = archive.sections.flatMap(section => section.items);
  assert.ok(papers.length > 0);
  assert.equal(papers.filter(item => item.authors.split(',').map(author => author.trim()).includes(archive.profile_name)).length, papers.length);
});

test('Buttons use native keyboard semantics, preserve colors and reserve News fireworks for awards', () => {
  const publications = read('publications/index.html');
  for (const kind of ['top', 'quartile', 'if']) {
    assert.match(publications, new RegExp(`<button type="button" class="pub-journal-chip pub-journal-chip--${kind}" aria-label=`));
  }
  const news = read('news/index.html');
  assert.ok((news.match(/<button type="button" class="news-badge award"/g) || []).length > 0);
  assert.doesNotMatch(news, /<img\b|<span class="news-badge award"/);
  assert.match(read('assets/site.js'), /if \(!badge \|\| !badge\.classList\.contains\('award'\)\) return/);
  assert.match(read('assets/site.js'), /\['click', 'focusin'\]/);
  assert.match(read('_includes/page-signature.html'), /type="button"[^>]*aria-label=[^>]*hidden/);
});

test('Public effects are opt-in and cannot change private Workspace or Analytics behavior', () => {
  for (const path of ['index.html', 'profile/index.html', 'research/index.html', 'publications/index.html', 'news/index.html']) {
    assert.match(read(path), /page_effects: true/);
  }
  for (const path of ['workspace/index.html', 'workspace/timesfm/index.html', 'analytics/index.html']) {
    assert.doesNotMatch(read(path), /page_effects:/);
  }
  assert.match(read('_layouts/default.html'), /if page\.page_effects/);
  assert.match(read('assets/site-signatures.css'), /prefers-reduced-motion: reduce/);
});

test('The favicon and touch icon use the new common identity instead of the old portrait', () => {
  const head = read('_includes/head.html');
  assert.doesNotMatch(head, /blank-favicon/);
  for (const path of ['/favicon.ico', '/favicon.svg', '/assets/img/apple-touch-icon.png']) assert.ok(head.includes(path));
  assert.match(read('about/index.html'), /\/favicon\.svg\?v=20261102a/);
  assert.match(read('favicon.svg'), /viewBox="0 0 64 64"/);
  const ico = readFileSync(join(__dirname, '..', 'favicon.ico'));
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
  assert.deepEqual([0, 1, 2].map(index => ico[6 + index * 16]), [16, 32, 48]);
  const touch = readFileSync(join(__dirname, '..', 'assets/img/apple-touch-icon.png'));
  assert.equal(touch.readUInt32BE(16), 180);
  assert.equal(touch.readUInt32BE(20), 180);
});

function burstFixture(reduced = false) {
  class Element {
    constructor(classes = []) {
      this.attrs = {};
      this.children = [];
      this.isConnected = true;
      this.rect = { left: 10, top: 10, width: 50, height: 30 };
      this.classList = { contains: name => classes.includes(name) };
      this.style = { setProperty() {} };
    }
    getAttribute(name) { return this.attrs[name] || null; }
    setAttribute(name, value) { this.attrs[name] = value; }
    hasAttribute(name) { return name in this.attrs; }
    getBoundingClientRect() { return this.rect; }
    appendChild(child) { this.children.push(child); }
    closest(selector) {
      const classes = selector.split('.').filter(Boolean);
      return classes.every(name => this.classList.contains(name)) ? this : null;
    }
    remove() { this.removed = true; }
  }
  const listeners = {};
  const bursts = [];
  const timers = [];
  const document = {
    documentElement: new Element(), body: { appendChild: element => bursts.push(element) },
    createElement: () => new Element(),
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
  };
  const windowEvents = new Map();
  const window = {
    matchMedia: () => ({ matches: reduced }), setTimeout: fn => timers.push(fn),
    addEventListener(type, fn) { if (!windowEvents.has(type)) windowEvents.set(type, new Set()); windowEvents.get(type).add(fn); },
    removeEventListener(type, fn) { windowEvents.get(type)?.delete(fn); },
  };
  const source = read('assets/site.js').replace(/\}\)\(\);\s*$/, 'window.bindEffects = function () { bindPublicationChipEffects(); bindNewsBadgeEffects(); };})();');
  runInNewContext(source, { document, window, Element });
  window.bindEffects();
  return {
    bursts, timers, windowEvents,
    element: classes => new Element(classes),
    emit(type, target) { for (const fn of listeners[type] || []) fn({ target, relatedTarget: null }); },
  };
}

test('Publication focus and click keep colored fireworks, suppress duplicates and remove particles', () => {
  const f = burstFixture();
  const chip = f.element(['pub-journal-chip', 'pub-journal-chip--top']);
  f.emit('focusin', chip);
  f.emit('click', chip);
  assert.equal(f.bursts.length, 1);
  assert.equal(f.bursts[0].children.length, 12);
  assert.equal(f.bursts[0].attrs['aria-hidden'], 'true');
  f.timers.forEach(fn => fn());
  assert.equal(f.bursts[0].removed, true);
});

test('Only News awards celebrate on focus or tap; informational badges no longer burst', () => {
  const f = burstFixture();
  for (const kind of ['journal', 'conference', 'project', 'academic']) {
    const badge = f.element(['news-badge', kind]);
    for (const event of ['pointerover', 'focusin', 'click']) f.emit(event, badge);
  }
  assert.equal(f.bursts.length, 0);
  const award = f.element(['news-badge', 'award']);
  f.emit('click', award);
  f.emit('focusin', award);
  assert.equal(f.bursts.length, 1);
  assert.equal(f.bursts[0].children.length, 14);
});

test('Reduced motion suppresses both publication and award particle effects', () => {
  const f = burstFixture(true);
  f.emit('click', f.element(['pub-journal-chip', 'pub-journal-chip--if']));
  f.emit('click', f.element(['news-badge', 'award']));
  assert.equal(f.bursts.length, 0);
  assert.equal(f.timers.length, 0);
});

test('Fireworks follow their badge during keyboard scrolling and remove tracking listeners', () => {
  const f = burstFixture();
  const chip = f.element(['pub-journal-chip', 'pub-journal-chip--top']);
  f.emit('focusin', chip);
  assert.equal(f.bursts[0].style.top, '25px');
  chip.rect.top = 210;
  for (const fn of f.windowEvents.get('scroll')) fn();
  assert.equal(f.bursts[0].style.top, '225px');
  chip.rect.left = 40;
  for (const fn of f.windowEvents.get('resize')) fn();
  assert.equal(f.bursts[0].style.left, '65px');
  f.timers.forEach(fn => fn());
  assert.equal(f.windowEvents.get('scroll').size, 0);
  assert.equal(f.windowEvents.get('resize').size, 0);
});
