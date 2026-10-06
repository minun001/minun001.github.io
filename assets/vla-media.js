(function () {
  'use strict';

  function initialize() {
    const players = [];
    document.querySelectorAll('[data-simulation-player]').forEach(root => {
      const image = root.querySelector('[data-animation-src]');
      const button = root.querySelector('[data-simulation-toggle]');
      const status = root.querySelector('[data-simulation-status]');
      if (!image || !button || !status) return;

      const poster = image.getAttribute('src');
      const animation = image.dataset.animationSrc;
      const label = root.dataset.simulationLabel || 'simulation comparison';
      let active = false;
      let revision = 0;

      function stop() {
        revision += 1;
        active = false;
        image.onload = null;
        image.onerror = null;
        image.setAttribute('src', poster);
        button.textContent = 'Play comparison';
        button.setAttribute('aria-label', `Play ${label}`);
        button.setAttribute('aria-pressed', 'false');
        status.textContent = '';
      }

      button.addEventListener('click', () => {
        if (active) {
          stop();
          return;
        }
        // Load only the requested clip and avoid running duplicate animations.
        players.forEach(player => player.stop());
        active = true;
        const request = ++revision;
        button.textContent = 'Stop comparison';
        button.setAttribute('aria-label', `Stop ${label}`);
        button.setAttribute('aria-pressed', 'true');
        status.textContent = 'Loading comparison...';
        image.onload = () => {
          if (request === revision) status.textContent = 'Playing comparison.';
        };
        image.onerror = () => {
          if (request !== revision) return;
          stop();
          status.textContent = 'Could not load the animation. Press play to retry.';
        };
        image.setAttribute('src', animation);
      });
      button.hidden = false;
      stop();
      players.push({ stop });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) players.forEach(player => player.stop());
    });
  }

  document.addEventListener('DOMContentLoaded', initialize);
})();
