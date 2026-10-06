const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const { runInNewContext } = require('node:vm');

const rootPath = join(__dirname, '..');
const source = readFileSync(join(rootPath, 'assets/vla-media.js'), 'utf8');

function fixture(count = 1) {
  const roots = Array.from({ length: count }, (_, index) => {
    const attrs = { src: `poster-${index}.png` };
    const image = {
      dataset: { animationSrc: `clip-${index}.gif` }, assignments: [],
      getAttribute: name => attrs[name],
      setAttribute(name, value) { attrs[name] = value; this.assignments.push(value); },
    };
    const button = {
      hidden: true, attrs: {}, listeners: {},
      setAttribute(name, value) { this.attrs[name] = value; },
      addEventListener(name, listener) { this.listeners[name] = listener; },
      click() { this.listeners.click(); },
    };
    const status = { textContent: '' };
    return {
      image, button, status, dataset: { simulationLabel: `event ${index}` },
      querySelector(selector) { return selector === '[data-animation-src]' ? image : selector === '[data-simulation-toggle]' ? button : status; },
    };
  });
  const document = {
    hidden: false, listeners: {}, querySelectorAll: () => roots,
    addEventListener(name, listener) { this.listeners[name] = listener; },
  };
  runInNewContext(source, { document });
  document.listeners.DOMContentLoaded();
  return { roots, document };
}

test('VLA starts with existing posters, preserves original clips and the scientific boundary', () => {
  const html = readFileSync(join(rootPath, 'VLA/index.html'), 'utf8');
  assert.doesNotMatch(html, /<img\b[^>]*\ssrc="[^"]+\.gif"/);
  assert.equal((html.match(/data-simulation-player/g) || []).length, 9); // Includes its CSS rule.
  assert.equal((html.match(/data-animation-src=/g) || []).length, 8);
  assert.equal((html.match(/<noscript>/g) || []).length, 8);
  for (const match of html.matchAll(/(?:\ssrc|data-animation-src)="(assets\/[^"]+)"/g)) {
    assert.ok(existsSync(join(rootPath, 'VLA', match[1])), match[1]);
  }
  assert.ok(html.includes('실제 차량 제어 성능 인증'));
  assert.ok(html.includes('0.560에서 0.013'));
});

test('No GIF is loaded until the user presses play', () => {
  const { roots: [player] } = fixture();
  assert.equal(player.button.hidden, false);
  assert.deepEqual(player.image.assignments, ['poster-0.png']);
  player.button.click();
  assert.equal(player.image.getAttribute('src'), 'clip-0.gif');
  assert.equal(player.button.attrs['aria-pressed'], 'true');
  player.image.onload();
  assert.equal(player.status.textContent, 'Playing comparison.');
});

test('Stop returns to the still frame and ignores late load events', () => {
  const { roots: [player] } = fixture();
  player.button.click();
  const lateLoad = player.image.onload;
  player.button.click();
  lateLoad();
  assert.equal(player.image.getAttribute('src'), 'poster-0.png');
  assert.equal(player.status.textContent, '');
  assert.equal(player.button.attrs['aria-pressed'], 'false');
});

test('An animation error restores the poster and permits retry', () => {
  const { roots: [player] } = fixture();
  player.button.click();
  player.image.onerror();
  assert.equal(player.image.getAttribute('src'), 'poster-0.png');
  assert.match(player.status.textContent, /retry/);
  player.button.click();
  assert.equal(player.image.getAttribute('src'), 'clip-0.gif');
});

test('Only the selected clip plays', () => {
  const { roots: [first, second] } = fixture(2);
  first.button.click();
  second.button.click();
  assert.equal(first.image.getAttribute('src'), 'poster-0.png');
  assert.equal(second.image.getAttribute('src'), 'clip-1.gif');
});

test('Hidden pages stop animation without removing the controls', () => {
  const { roots: [player], document } = fixture();
  player.button.click();
  document.hidden = true;
  document.listeners.visibilitychange();
  assert.equal(player.image.getAttribute('src'), 'poster-0.png');
  assert.equal(player.button.hidden, false);
});
