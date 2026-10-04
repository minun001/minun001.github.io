(function () {
  "use strict";

  function initializeCarousel(root) {
    const slides = Array.from(root.querySelectorAll("[data-research-slide]"));
    const dots = Array.from(root.querySelectorAll("[data-research-dot]"));
    const controls = root.querySelector("[data-research-controls]");
    const previous = root.querySelector("[data-research-prev]");
    const next = root.querySelector("[data-research-next]");
    const toggle = root.querySelector("[data-research-toggle]");
    const status = root.querySelector("[data-research-status]");
    if (slides.length < 2 || dots.length !== slides.length || !controls || !previous || !next || !toggle || !status) return;
    const pauseIcon = toggle.querySelector("[data-research-pause-icon]");
    const playIcon = toggle.querySelector("[data-research-play-icon]");
    if (!pauseIcon || !playIcon) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const interval = Math.max(5000, Number(root.dataset.interval) || 7000);
    const failed = new Set();
    const imagePromises = new WeakMap();
    let current = Math.max(0, slides.findIndex((slide) => !slide.hidden));
    let timer = null;
    let userPaused = false;
    let focusPaused = false;
    let pointerPaused = false;
    let inView = true;
    let suspended = false;
    let loading = false;
    let requestId = 0;
    let pointerToggleIntent = null;

    function stopTimer() {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
    }

    function wantsRotation() {
      return !userPaused && !focusPaused && !motion.matches;
    }

    function updateRotationControl() {
      const playing = wantsRotation();
      root.dataset.rotation = motion.matches ? "reduced-motion" : playing ? "playing" : "paused";
      toggle.disabled = motion.matches;
      toggle.setAttribute("aria-label", motion.matches ? "Automatic slides off: reduced motion enabled" : playing ? "Pause automatic slides" : "Play automatic slides");
      // SVG elements do not reflect the HTML hidden property.
      if (playing) {
        pauseIcon.removeAttribute("hidden");
        playIcon.setAttribute("hidden", "");
      } else {
        pauseIcon.setAttribute("hidden", "");
        playIcon.removeAttribute("hidden");
      }
    }

    function nextAvailable() {
      for (let step = 1; step < slides.length; step += 1) {
        const index = (current + step) % slides.length;
        if (!failed.has(index)) return index;
      }
      return current;
    }

    function schedule() {
      stopTimer();
      if (!wantsRotation() || pointerPaused || document.hidden || !inView || suspended || loading || nextAvailable() === current) return;
      timer = window.setTimeout(() => showSlide(nextAvailable(), false), interval);
    }

    function readyImage(index) {
      const image = slides[index].querySelector("img");
      if (!image) return Promise.reject(new Error("Slide image missing"));
      if (imagePromises.has(image)) return imagePromises.get(image);
      image.loading = "eager";
      const ready = typeof image.decode === "function" ? image.decode() : new Promise((resolve, reject) => {
        if (image.complete) {
          if (image.naturalWidth > 0) resolve();
          else reject(new Error("Slide image unavailable"));
          return;
        }
        function clean() {
          image.removeEventListener("load", onLoad);
          image.removeEventListener("error", onError);
        }
        function onLoad() { clean(); resolve(); }
        function onError() { clean(); reject(new Error("Slide image unavailable")); }
        image.addEventListener("load", onLoad);
        image.addEventListener("error", onError);
      });
      imagePromises.set(image, ready);
      return ready;
    }

    function preloadNext() {
      const index = nextAvailable();
      if (index === current) return;
      readyImage(index).catch(() => { failed.add(index); });
    }

    async function showSlide(index, manual) {
      stopTimer();
      if (manual) {
        userPaused = true;
        updateRotationControl();
      }
      const id = ++requestId;
      if (index === current) {
        loading = false;
        schedule();
        return;
      }
      loading = true;
      try {
        await readyImage(index);
        if (id !== requestId) return;
        if (!manual && (!wantsRotation() || pointerPaused || document.hidden || !inView || suspended)) return;
        slides.forEach((slide, slideIndex) => {
          slide.hidden = slideIndex !== index;
          slide.classList.toggle("is-entering", slideIndex === index && !motion.matches);
        });
        current = index;
        dots.forEach((dot, dotIndex) => {
          if (dotIndex === current) dot.setAttribute("aria-current", "true");
          else dot.removeAttribute("aria-current");
        });
        // Only user-requested changes are announced; autoplay stays quiet.
        if (manual) status.textContent = `${current + 1} of ${slides.length}: ${slides[current].dataset.title}`;
        preloadNext();
      } catch (_) {
        if (id !== requestId) return;
        failed.add(index);
        if (manual) status.textContent = "This image could not load. Choose another research slide.";
      } finally {
        if (id === requestId) {
          loading = false;
          schedule();
        }
      }
    }

    previous.addEventListener("click", () => showSlide((current - 1 + slides.length) % slides.length, true));
    next.addEventListener("click", () => showSlide((current + 1) % slides.length, true));
    dots.forEach((dot, index) => dot.addEventListener("click", () => showSlide(index, true)));
    // Remember pre-focus intent so a pointer click on Pause cannot become Play.
    toggle.addEventListener("pointerdown", () => { pointerToggleIntent = wantsRotation(); });
    toggle.addEventListener("pointercancel", () => { pointerToggleIntent = null; });
    toggle.addEventListener("keydown", () => { pointerToggleIntent = null; });
    toggle.addEventListener("click", () => {
      const wasPlaying = pointerToggleIntent === null ? wantsRotation() : pointerToggleIntent;
      pointerToggleIntent = null;
      userPaused = wasPlaying;
      focusPaused = false;
      updateRotationControl();
      schedule();
    });
    root.addEventListener("focusin", () => {
      focusPaused = true;
      stopTimer();
      updateRotationControl();
    });
    root.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch") return;
      pointerPaused = true;
      stopTimer();
    });
    root.addEventListener("pointerleave", () => { pointerPaused = false; schedule(); });
    document.addEventListener("visibilitychange", schedule);
    motion.addEventListener("change", () => { updateRotationControl(); schedule(); });
    window.addEventListener("pagehide", () => { suspended = true; stopTimer(); });
    window.addEventListener("pageshow", () => { suspended = false; schedule(); });
    if ("IntersectionObserver" in window) {
      const observer = new window.IntersectionObserver((entries) => {
        inView = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.15;
        schedule();
      }, { threshold: 0.15 });
      observer.observe(root);
    }

    slides.forEach((slide, index) => { slide.hidden = index !== current; });
    controls.hidden = false;
    toggle.hidden = false;
    updateRotationControl();
    preloadNext();
    schedule();
  }

  document.querySelectorAll("[data-research-carousel]").forEach(initializeCarousel);
})();
