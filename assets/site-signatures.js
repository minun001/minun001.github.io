(function () {
  function initializeSignatures() {
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var buttons = Array.from(document.querySelectorAll('[data-page-signature]'));
    var active = new Map();
    var pendingYear = null;
    var arrival = typeof IntersectionObserver === 'function' ? new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.target !== pendingYear || !entry.isIntersecting) return;
        arrival.disconnect();
        pendingYear = null;
        play(entry.target, 'is-year-pulsing');
      });
    }, { rootMargin: '-90px 0px -10% 0px', threshold: .5 }) : null;

    function cancelArrival() {
      if (arrival) arrival.disconnect();
      pendingYear = null;
    }

    function stopAll() {
      cancelArrival();
      active.forEach(function (entry, target) {
        window.clearTimeout(entry.timer);
        target.classList.remove(entry.className);
        target.removeAttribute('aria-busy');
      });
      active.clear();
    }

    function play(target, className) {
      if (!target || motion.matches || document.hidden || active.has(target)) return;
      target.classList.add(className);
      target.setAttribute('aria-busy', 'true');
      active.set(target, {
        className: className,
        timer: window.setTimeout(function () {
          target.classList.remove(className);
          target.removeAttribute('aria-busy');
          active.delete(target);
        }, 1400)
      });
    }

    function syncMotion() {
      stopAll();
      buttons.forEach(function (button) { button.hidden = motion.matches; });
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () { play(button, 'is-playing'); });
    });
    document.querySelectorAll('.news-jump a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function () {
        cancelArrival();
        if (motion.matches || document.hidden) return;
        if (link.hidden || link.getAttribute('aria-disabled') === 'true') return;
        var year = document.getElementById(link.getAttribute('href').slice(1));
        if (!year || year.hidden) return;
        var target = year.querySelector('[data-news-item]:not([hidden])');
        if (!target) return;
        // Wait until the destination is visible; a long year jump must not play offscreen.
        if (arrival) {
          pendingYear = target;
          arrival.observe(target);
        } else {
          play(target, 'is-year-pulsing');
        }
      });
    });
    document.querySelectorAll('[data-news-filter]').forEach(function (button) {
      button.addEventListener('click', cancelArrival);
    });
    motion.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stopAll(); });
    window.addEventListener('pagehide', stopAll);
    syncMotion();
  }
  document.addEventListener('DOMContentLoaded', initializeSignatures);
})();
