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
        var labelTarget = button.querySelector('[data-copy-text]');
        var original = button.getAttribute('data-copy-label') || (labelTarget ? labelTarget.textContent : button.textContent);
        if (!email) return;

        try {
          await navigator.clipboard.writeText(email);
          if (labelTarget) labelTarget.textContent = 'Email Copied';
          else button.textContent = 'Email Copied';
        } catch (error) {
          if (labelTarget) labelTarget.textContent = 'Copy Failed';
          else button.textContent = 'Copy Failed';
        }

        window.setTimeout(function () {
          if (labelTarget) labelTarget.textContent = original;
          else button.textContent = original;
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

  function bindSectionIndex() {
    document.querySelectorAll('.page-index').forEach(function (nav) {
      var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
      if (!links.length) return;

      var sectionMap = links
        .map(function (link) {
          var targetId = link.getAttribute('href');
          if (!targetId) return null;
          var section = document.querySelector(targetId);
          if (!section) return null;
          return { link: link, section: section };
        })
        .filter(Boolean);

      if (!sectionMap.length) return;

      function setActive(id) {
        sectionMap.forEach(function (entry) {
          entry.link.classList.toggle('is-active', '#' + entry.section.id === id);
        });
      }

      setActive(window.location.hash || '#' + sectionMap[0].section.id);

      var observer = new IntersectionObserver(
        function (entries) {
          var visible = entries
            .filter(function (entry) {
              return entry.isIntersecting;
            })
            .sort(function (a, b) {
              return a.boundingClientRect.top - b.boundingClientRect.top;
            });

          if (visible.length) {
            setActive('#' + visible[0].target.id);
          }
        },
        {
          rootMargin: '-18% 0px -62% 0px',
          threshold: [0.1, 0.35, 0.6]
        }
      );

      sectionMap.forEach(function (entry) {
        observer.observe(entry.section);
      });

      links.forEach(function (link) {
        link.addEventListener('click', function () {
          setActive(link.getAttribute('href'));
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme();
    bindCopyButtons();
    installTopButton();
    bindPublicationSearch();
    bindNewsFilter();
    bindSectionIndex();
  });
})();
