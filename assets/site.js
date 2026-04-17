(function(){
  function applyTheme() {
    document.body.classList.add('theme-day');
    document.body.classList.remove('theme-night');
  }

  function bindCopyButtons() {
    document.querySelectorAll('[data-copy-email]').forEach(function (button) {
      if (button.dataset.boundCopy === '1') return;
      button.dataset.boundCopy = '1';

      button.addEventListener('click', async function () {
        var email = button.getAttribute('data-copy-email');
        var original = button.getAttribute('data-copy-label') || button.textContent;
        if (!email) return;

        try {
          await navigator.clipboard.writeText(email);
          button.textContent = 'Email Copied';
        } catch (error) {
          button.textContent = 'Copy Failed';
        }

        window.setTimeout(function () {
          button.textContent = original;
        }, 1600);
      });
    });
  }

  function installTopButton() {
    if (document.querySelector('.top-fab')) return;

    var button = document.createElement('button');
    button.className = 'top-fab';
    button.type = 'button';
    button.textContent = 'Top';
    document.body.appendChild(button);

    function syncVisibility() {
      if (window.scrollY > 520) button.classList.add('is-visible');
      else button.classList.remove('is-visible');
    }

    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    syncVisibility();
    window.addEventListener('scroll', syncVisibility, { passive: true });
  }

  function bindPublicationSearch() {
    var root = document.querySelector('[data-publications-root]');
    if (!root) return;

    var input = root.querySelector('[data-publication-search]');
    var reset = root.querySelector('[data-publication-reset]');
    var count = root.querySelector('[data-publication-count]');
    var empty = root.querySelector('[data-publication-empty]');
    var items = Array.prototype.slice.call(root.querySelectorAll('[data-publication-item]'));
    var sections = Array.prototype.slice.call(root.querySelectorAll('[data-publication-section]'));
    if (!input || !count || !items.length) return;

    function update() {
      var query = input.value.trim().toLowerCase();
      var visibleCount = 0;

      items.forEach(function (item) {
        var haystack = (item.getAttribute('data-search') || item.textContent || '').toLowerCase();
        var matches = !query || haystack.indexOf(query) !== -1;
        item.hidden = !matches;
        if (matches) visibleCount += 1;
      });

      sections.forEach(function (section) {
        var hasVisibleItem = Array.prototype.some.call(
          section.querySelectorAll('[data-publication-item]'),
          function (item) {
            return !item.hidden;
          }
        );
        section.hidden = !hasVisibleItem;
      });

      count.textContent = query ? visibleCount + ' matching records' : items.length + ' total records';
      if (reset) reset.hidden = !query;
      if (empty) empty.hidden = visibleCount !== 0;
    }

    input.addEventListener('input', update);
    if (reset) {
      reset.addEventListener('click', function () {
        input.value = '';
        update();
        input.focus();
      });
    }

    update();
  }

  function bindNewsFilter() {
    var root = document.querySelector('[data-news-root]');
    if (!root) return;

    var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-news-filter]'));
    var items = Array.prototype.slice.call(root.querySelectorAll('[data-news-item]'));
    var years = Array.prototype.slice.call(root.querySelectorAll('[data-news-year]'));
    var empty = root.querySelector('[data-news-empty]');
    if (!buttons.length || !items.length) return;

    function setFilter(nextKind) {
      var visibleCount = 0;

      buttons.forEach(function (button) {
        var isActive = button.getAttribute('data-news-filter') === nextKind;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      items.forEach(function (item) {
        var kind = item.getAttribute('data-news-kind') || 'all';
        var matches = nextKind === 'all' || kind === nextKind;
        item.hidden = !matches;
        if (matches) visibleCount += 1;
      });

      years.forEach(function (year) {
        var hasVisibleItem = Array.prototype.some.call(
          year.querySelectorAll('[data-news-item]'),
          function (item) {
            return !item.hidden;
          }
        );
        year.hidden = !hasVisibleItem;
      });

      if (empty) empty.hidden = visibleCount !== 0;
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        setFilter(button.getAttribute('data-news-filter') || 'all');
      });
    });

    setFilter('all');
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme();
    bindCopyButtons();
    installTopButton();
    bindPublicationSearch();
    bindNewsFilter();
  });
})();
