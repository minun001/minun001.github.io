const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const { runInNewContext } = require("node:vm");

const source = readFileSync(join(__dirname, "../assets/home-research.js"), "utf8");

class Element {
  constructor() {
    this.hidden = false;
    this.dataset = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.children = new Map();
    this.textContent = "";
    this.classes = new Set();
    this.classList = { toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name) };
  }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  removeEventListener(type, listener) {
    this.listeners.set(type, (this.listeners.get(type) || []).filter((item) => item !== listener));
  }
  emit(type, properties = {}) {
    for (const listener of this.listeners.get(type) || []) listener({ target: this, ...properties });
  }
  querySelector(selector) { return this.children.get(selector) || null; }
  querySelectorAll(selector) { return this.children.get(selector) || []; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  removeAttribute(name) { this.attributes.delete(name); }
}

function fixture({ reduced = false, count = 5, broken = [], deferred = new Map(), missingControl = false } = {}) {
  const root = new Element();
  root.dataset.interval = "7000";
  const slides = Array.from({ length: count }, (_, index) => {
    const slide = new Element();
    slide.hidden = index !== 0;
    slide.dataset.title = `Research ${index + 1}`;
    const image = new Element();
    image.loading = index === 0 ? "eager" : "lazy";
    image.decode = () => deferred.get(index) || (broken.includes(index) ? Promise.reject(new Error("missing")) : Promise.resolve());
    slide.children.set("img", image);
    return slide;
  });
  const dots = slides.map(() => new Element());
  root.children.set("[data-research-slide]", slides);
  root.children.set("[data-research-dot]", dots);
  for (const name of ["controls", "prev", "next", "toggle", "status"]) {
    if (missingControl && name === "next") continue;
    root.children.set(`[data-research-${name}]`, new Element());
  }
  const controls = root.querySelector("[data-research-controls]");
  controls.hidden = true;
  const toggle = root.querySelector("[data-research-toggle]");
  toggle.hidden = true;
  toggle.children.set("[data-research-pause-icon]", new Element());
  toggle.children.set("[data-research-play-icon]", new Element());
  const document = new Element();
  document.children.set("[data-research-carousel]", [root]);
  const motion = new Element();
  motion.matches = reduced;
  const timers = new Map();
  let timerId = 0;
  let intersection;
  const window = new Element();
  window.matchMedia = () => motion;
  window.setTimeout = (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; };
  window.clearTimeout = (id) => timers.delete(id);
  window.IntersectionObserver = class {
    constructor(callback) { intersection = callback; }
    observe() {}
  };
  runInNewContext(source, { document, window, console });
  const visible = () => slides.findIndex((slide) => !slide.hidden);
  const flush = async () => { for (let i = 0; i < 8; i += 1) await Promise.resolve(); };
  const tick = async () => {
    assert.equal(timers.size, 1, "exactly one rotation timer");
    const [id, { callback, delay }] = timers.entries().next().value;
    assert.equal(delay, 7000);
    timers.delete(id);
    callback();
    await flush();
  };
  const button = (name) => root.querySelector(`[data-research-${name}]`);
  return { root, slides, dots, controls, toggle, document, window, motion, timers, visible, flush, tick, button,
    intersect: (ratio) => intersection([{ isIntersecting: ratio > 0, intersectionRatio: ratio }]) };
}

test("autoplay advances every seven seconds, wraps and stays silent", async () => {
  const f = fixture();
  assert.equal(f.visible(), 0);
  assert.equal(f.controls.hidden, false);
  assert.equal(f.slides[1].querySelector("img").loading, "eager");
  assert.equal(f.slides[2].querySelector("img").loading, "lazy");
  for (let i = 1; i <= 5; i += 1) { await f.tick(); assert.equal(f.visible(), i % 5); }
  assert.equal(f.button("status").textContent, "");
  assert.equal(f.dots[0].attributes.get("aria-current"), "true");
  assert.equal(f.slides.filter((slide) => !slide.hidden).length, 1);
});

test("manual navigation pauses, announces and only explicit Play restarts", async () => {
  const f = fixture();
  f.button("next").emit("click");
  await f.flush();
  assert.equal(f.visible(), 1);
  assert.equal(f.timers.size, 0);
  assert.equal(f.root.dataset.rotation, "paused");
  assert.equal(f.toggle.querySelector("[data-research-pause-icon]").attributes.has("hidden"), true);
  assert.equal(f.toggle.querySelector("[data-research-play-icon]").attributes.has("hidden"), false);
  assert.equal(f.button("status").textContent, "2 of 5: Research 2");
  f.button("prev").emit("click");
  await f.flush();
  assert.equal(f.visible(), 0);
  f.dots[4].emit("click");
  await f.flush();
  assert.equal(f.visible(), 4);
  f.toggle.emit("click");
  assert.equal(f.root.dataset.rotation, "playing");
  assert.equal(f.toggle.querySelector("[data-research-play-icon]").attributes.has("hidden"), true);
  await f.tick();
  assert.equal(f.visible(), 0);
});

test("focus stops until explicit play, including pointer Pause focus order", () => {
  const f = fixture();
  f.toggle.emit("pointerdown");
  f.root.emit("focusin", { target: f.toggle });
  f.toggle.emit("click");
  assert.equal(f.root.dataset.rotation, "paused");
  assert.equal(f.timers.size, 0);
  f.toggle.emit("keydown");
  f.toggle.emit("click");
  assert.equal(f.timers.size, 1);
  f.root.emit("focusin");
  f.root.emit("focusout");
  assert.equal(f.timers.size, 0);
});

test("hover, hidden tab, offscreen and page lifecycle suspend rotation", () => {
  const f = fixture();
  f.root.emit("pointerenter", { pointerType: "mouse" });
  assert.equal(f.timers.size, 0);
  f.root.emit("pointerleave");
  assert.equal(f.timers.size, 1);
  f.root.emit("pointerenter", { pointerType: "touch" });
  assert.equal(f.timers.size, 1);
  f.document.hidden = true;
  f.document.emit("visibilitychange");
  assert.equal(f.timers.size, 0);
  f.document.hidden = false;
  f.document.emit("visibilitychange");
  f.intersect(0.1);
  assert.equal(f.timers.size, 0);
  f.intersect(0.5);
  assert.equal(f.timers.size, 1);
  f.window.emit("pagehide");
  assert.equal(f.timers.size, 0);
  f.window.emit("pageshow");
  assert.equal(f.timers.size, 1);
});

test("reduced motion disables autoplay but preserves manual navigation", async () => {
  const f = fixture({ reduced: true });
  assert.equal(f.timers.size, 0);
  assert.equal(f.toggle.disabled, true);
  f.dots[2].emit("click");
  await f.flush();
  assert.equal(f.visible(), 2);
  assert.equal(f.slides[2].classes.has("is-entering"), false);
  f.motion.matches = false;
  f.motion.emit("change");
  assert.equal(f.timers.size, 0, "manual pause survives preference change");
});

test("a missing image keeps the current slide visible and auto skips it", async () => {
  const f = fixture({ broken: [1] });
  await f.flush();
  await f.tick();
  assert.equal(f.visible(), 2);
  f.dots[1].emit("click");
  await f.flush();
  assert.equal(f.visible(), 2);
  assert.match(f.button("status").textContent, /could not load/);
});

test("latest manual choice wins when image decoding resolves out of order", async () => {
  let resolveFirst;
  const pending = new Promise((resolve) => { resolveFirst = resolve; });
  const f = fixture({ deferred: new Map([[1, pending]]) });
  f.dots[1].emit("click");
  f.dots[4].emit("click");
  await f.flush();
  assert.equal(f.visible(), 4);
  resolveFirst();
  await f.flush();
  assert.equal(f.visible(), 4);
  assert.equal(f.timers.size, 0);
});

test("focus during a pending automatic decode prevents late rotation", async () => {
  let resolveImage;
  const pending = new Promise((resolve) => { resolveImage = resolve; });
  const f = fixture({ deferred: new Map([[1, pending]]) });
  await f.tick();
  f.root.emit("focusin");
  resolveImage();
  await f.flush();
  assert.equal(f.visible(), 0);
  assert.equal(f.timers.size, 0);
});

test("incomplete or single-slide markup remains a static fallback", () => {
  for (const options of [{ count: 1 }, { missingControl: true }]) {
    const f = fixture(options);
    assert.equal(f.visible(), 0);
    assert.equal(f.controls.hidden, true);
    assert.equal(f.timers.size, 0);
  }
});
