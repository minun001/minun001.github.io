(function(){
  function announce(message) {
    var region = document.getElementById('site-live-region');
    if (!region) return;
    region.textContent = '';
    window.setTimeout(function () {
      region.textContent = message;
    }, 20);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/\r?\n/g, '&#10;');
  }

  function normalizeSearchText(value) {
    return (value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function toSearchTokens(value) {
    return normalizeSearchText(value)
      .split(' ')
      .filter(Boolean);
  }

  function formatPaperCount(count) {
    return count + ' ' + (count === 1 ? 'paper' : 'papers');
  }

  function buildPublicationSearchData(item) {
    return normalizeSearchText(
      [
        item.title,
        item.venue,
        item.authors,
        item.summary,
        item.details,
        item.category,
        Array.isArray(item.keywords) ? item.keywords.join(' ') : ''
      ].join(' ')
    );
  }

  function renderPublicationMedia(item) {
    if (item.image) {
      return (
        '<div class="pub-image">' +
          '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.image_alt || item.title) + '" loading="lazy">' +
        '</div>'
      );
    }

    var markerLabel = item.category && item.category.indexOf('journals') !== -1 ? 'Journal Paper' : 'Conference Paper';
    var markerYear = item.year ? String(item.year) : '';
    return (
      '<aside class="pub-marker" aria-hidden="true">' +
        '<div class="pub-marker-head">' +
          '<span class="pub-marker-label">' + escapeHtml(markerLabel) + '</span>' +
          '<p class="pub-marker-title">' + escapeHtml(item.topic_title || 'Research Paper') + '</p>' +
          '<p class="pub-marker-copy">' + escapeHtml(item.topic_copy || 'Synchronized from the Google Scholar archive.') + '</p>' +
        '</div>' +
        '<span class="pub-marker-year">' + escapeHtml(markerYear) + '</span>' +
      '</aside>'
    );
  }

  function renderPublicationActions(item) {
    var actions = [];
    if (item.scholar_url) {
      actions.push(
        '<a class="pub-action" href="' + escapeHtml(item.scholar_url) + '" target="_blank" rel="noopener">Google Scholar</a>'
      );
    }
    if (item.bibtex && item.category && item.category.indexOf('journals') !== -1) {
      actions.push(
        '<button class="pub-action" type="button" data-bibtex-content="' + escapeAttribute(item.bibtex) + '">Cite</button>'
      );
    }
    if (!actions.length) return '';
    return '<div class="pub-actions">' + actions.join('') + '</div>';
  }

  function renderPublicationCard(item) {
    var cardClass = item.image ? 'pub-item' : 'pub-item pub-item-text';
    var searchData = escapeHtml(buildPublicationSearchData(item));
    var doiMarkup = item.doi ? '<p class="pub-note">DOI: ' + escapeHtml(item.doi) + '</p>' : '';
    var detailsMarkup = item.details
      ? '<div class="pub-meta-row"><span class="pub-meta-label">Details</span><span class="pub-meta-value">' + escapeHtml(item.details) + '</span></div>'
      : '';

    return (
      '<article class="' + cardClass + '" data-publication-item data-search="' + searchData + '">' +
        '<h3>' + escapeHtml(item.title) + '</h3>' +
        '<div class="pub-meta">' +
          '<div class="pub-meta-row"><span class="pub-meta-label">Venue</span><span class="pub-meta-value">' + escapeHtml(item.venue || '') + '</span></div>' +
          '<div class="pub-meta-row"><span class="pub-meta-label">Authors</span><span class="pub-meta-value">' + escapeHtml(item.authors || '') + '</span></div>' +
          detailsMarkup +
        '</div>' +
        '<p class="pub-summary-copy">' + escapeHtml(item.summary || '') + '</p>' +
        doiMarkup +
        renderPublicationMedia(item) +
        renderPublicationActions(item) +
      '</article>'
    );
  }

  function renderPublicationArchive(archive) {
    var root = document.querySelector('[data-publications-root]');
    if (!root || !archive || !Array.isArray(archive.sections)) return false;

    archive.sections.forEach(function (section) {
      var grid = root.querySelector('[data-publication-grid="' + section.key + '"]');
      if (grid) {
        grid.innerHTML = (section.items || []).map(renderPublicationCard).join('');
      }

      var summaryCard = root.querySelector('[data-publication-summary="' + section.key + '"]');
      if (summaryCard) {
        var countTarget = summaryCard.querySelector('[data-publication-summary-count]');
        var copyTarget = summaryCard.querySelector('[data-publication-summary-copy]');
        if (countTarget) countTarget.textContent = formatPaperCount(section.count || 0);
        if (copyTarget && section.description) copyTarget.textContent = section.description;
      }
    });

    var totalCountTarget = root.querySelector('[data-publication-count]');
    if (totalCountTarget && typeof archive.total_records === 'number') {
      totalCountTarget.textContent = archive.total_records + ' total records';
    }

    return true;
  }

  function loadPublicationArchive() {
    var root = document.querySelector('[data-publications-root]');
    if (!root || !window.fetch) return Promise.resolve(false);

    var source = root.getAttribute('data-publication-source');
    if (!source) return Promise.resolve(false);

    var cacheKey = new Date().toISOString().slice(0, 10);
    return window.fetch(source + '?v=' + encodeURIComponent(cacheKey), { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('Failed to load publication archive.');
        return response.json();
      })
      .then(function (archive) {
        return renderPublicationArchive(archive);
      })
      .catch(function () {
        return false;
      });
  }

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
          announce('Email address copied.');
        } catch (error) {
          if (labelTarget) labelTarget.textContent = 'Copy Failed';
          else button.textContent = 'Copy Failed';
          announce('Copy failed.');
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
    var results = root.querySelector('[data-publication-results]');
    var reset = root.querySelector('[data-publication-reset]');
    var count = root.querySelector('[data-publication-count]');
    var empty = root.querySelector('[data-publication-empty]');
    var items = Array.prototype.slice.call(root.querySelectorAll('[data-publication-item]'));
    var sections = Array.prototype.slice.call(root.querySelectorAll('[data-publication-section]'));
    var params = new URLSearchParams(window.location.search);
    if (!input || !count || !items.length) return;

    var records = items.map(function (item, index) {
      var titleNode = item.querySelector('h3');
      var metaValues = Array.prototype.slice.call(item.querySelectorAll('.pub-meta-value'));
      var summaryNode = item.querySelector('.pub-summary-copy');
      var primaryLink = item.querySelector('.pub-actions a[href]');
      var kindLabel = item.closest('[data-publication-section]') && item.closest('[data-publication-section]').querySelector('h2');
      var title = titleNode ? titleNode.textContent.trim() : 'Publication';
      var venue = metaValues[0] ? metaValues[0].textContent.trim() : '';
      var details = metaValues[2] ? metaValues[2].textContent.trim() : '';
      var summary = summaryNode ? summaryNode.textContent.trim() : '';
      var kind = kindLabel ? kindLabel.textContent.trim() : 'Publication';
      var anchorId = item.id || 'publication-record-' + (index + 1);

      item.id = anchorId;
      if (!item.hasAttribute('tabindex')) item.setAttribute('tabindex', '-1');

      return {
        item: item,
        anchorId: anchorId,
        title: title,
        venue: venue,
        details: details,
        summary: summary,
        kind: kind,
        primaryLink: primaryLink ? primaryLink.href : '',
        titleNorm: normalizeSearchText(title),
        venueNorm: normalizeSearchText(venue),
        detailsNorm: normalizeSearchText(details),
        summaryNorm: normalizeSearchText(summary),
        searchNorm: normalizeSearchText(item.getAttribute('data-search') || '')
      };
    });

    function scoreRecord(record, query, queryTokens) {
      if (!queryTokens.length) return { score: 0, matchedTokens: 0 };

      var score = 0;
      var matchedTokens = 0;

      queryTokens.forEach(function (token) {
        var tokenMatched = false;
        if (record.titleNorm.indexOf(token) !== -1) {
          score += 40;
          tokenMatched = true;
        } else if (record.venueNorm.indexOf(token) !== -1) {
          score += 24;
          tokenMatched = true;
        } else if (record.summaryNorm.indexOf(token) !== -1) {
          score += 18;
          tokenMatched = true;
        } else if (record.detailsNorm.indexOf(token) !== -1) {
          score += 14;
          tokenMatched = true;
        } else if (record.searchNorm.indexOf(token) !== -1) {
          score += 12;
          tokenMatched = true;
        }

        if (tokenMatched) matchedTokens += 1;
      });

      if (record.titleNorm.indexOf(query) !== -1) score += 80;
      if (record.venueNorm.indexOf(query) !== -1) score += 40;
      if (record.summaryNorm.indexOf(query) !== -1) score += 26;
      if (record.searchNorm.indexOf(query) !== -1) score += 22;
      if (record.titleNorm.slice(0, query.length) === query) score += 24;
      if (matchedTokens === queryTokens.length) score += 36;

      return { score: score, matchedTokens: matchedTokens };
    }

    function renderResults(matches, query) {
      if (!results) return;

      if (!query) {
        results.hidden = true;
        results.innerHTML = '';
        input.setAttribute('aria-expanded', 'false');
        return;
      }

      input.setAttribute('aria-expanded', 'true');

      if (!matches.length) {
        results.hidden = false;
        results.innerHTML =
          '<div class="pub-search-results-head"><span>Recommended Matches</span><span>0 results</span></div>' +
          '<div class="pub-search-result-empty">No close match yet. Try a venue, topic, or shorter paper title.</div>';
        return;
      }

      var topMatches = matches.slice(0, 6);
      var listMarkup = topMatches.map(function (entry) {
        var record = entry.record;
        var href = record.primaryLink || ('#' + record.anchorId);
        var targetAttrs = record.primaryLink ? ' target="_blank" rel="noopener"' : '';
        var metaText = [record.venue, record.details].filter(Boolean).join(' | ');
        return (
          '<a class="pub-search-result" href="' + escapeHtml(href) + '"' + targetAttrs + ' data-publication-result="' + escapeHtml(record.anchorId) + '">' +
            '<span class="pub-search-result-kind">' + escapeHtml(record.kind) + '</span>' +
            '<span class="pub-search-result-title">' + escapeHtml(record.title) + '</span>' +
            '<span class="pub-search-result-meta">' + escapeHtml(metaText) + '</span>' +
          '</a>'
        );
      }).join('');

      results.hidden = false;
      results.innerHTML =
        '<div class="pub-search-results-head"><span>Recommended Matches</span><span>' + topMatches.length + ' results</span></div>' +
        '<div class="pub-search-result-list" role="listbox">' + listMarkup + '</div>';
    }

    function update(shouldSync) {
      var rawValue = input.value.trim();
      var query = normalizeSearchText(rawValue);
      var queryTokens = toSearchTokens(rawValue);
      var visibleCount = 0;
      var matchedRecords = [];

      records.forEach(function (record) {
        var recordScore = scoreRecord(record, query, queryTokens);
        var matches = !queryTokens.length || (
          recordScore.score > 0 && (
            recordScore.matchedTokens === queryTokens.length ||
            recordScore.matchedTokens >= Math.max(1, Math.ceil(queryTokens.length / 2)) ||
            record.titleNorm.indexOf(query) !== -1 ||
            record.searchNorm.indexOf(query) !== -1
          )
        );

        record.item.hidden = !matches;
        if (matches) {
          visibleCount += 1;
          if (queryTokens.length) matchedRecords.push({ record: record, score: recordScore.score });
        }
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

      matchedRecords.sort(function (left, right) {
        if (right.score !== left.score) return right.score - left.score;
        return left.record.title.localeCompare(right.record.title);
      });

      renderResults(matchedRecords, query);
      count.textContent = query ? visibleCount + ' matching records' : items.length + ' total records';
      if (reset) reset.hidden = !query;
      if (empty) empty.hidden = visibleCount !== 0;
      if (shouldSync !== false) {
        if (rawValue) params.set('q', rawValue);
        else params.delete('q');
        var nextQuery = params.toString();
        var nextUrl = window.location.pathname + (nextQuery ? '?' + nextQuery : '') + window.location.hash;
        window.history.replaceState({}, '', nextUrl);
      }
      announce(query ? visibleCount + ' publication records shown.' : 'Showing all publication records.');
    }

    input.addEventListener('input', function () {
      update(true);
    });
    input.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' || !results || results.hidden) return;
      var firstResult = results.querySelector('.pub-search-result');
      if (!firstResult) return;
      event.preventDefault();
      firstResult.click();
    });
    if (reset) {
      reset.addEventListener('click', function () {
        input.value = '';
        update(true);
        input.focus();
      });
    }

    if (results) {
      results.addEventListener('click', function (event) {
        var target = event.target;
        if (!(target instanceof Element)) return;
        var resultLink = target.closest('.pub-search-result');
        if (!resultLink) return;

        var recordId = resultLink.getAttribute('data-publication-result');
        var anchorTarget = recordId ? document.getElementById(recordId) : null;
        if (!resultLink.getAttribute('target') && anchorTarget) {
          event.preventDefault();
          anchorTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.setTimeout(function () {
            anchorTarget.focus({ preventScroll: true });
          }, 220);
        }
      });
    }

    if (params.get('q')) input.value = params.get('q');
    update(false);
  }

  function bindScholarMetrics() {
    var card = document.querySelector('[data-scholar-card]');
    if (!card) return;

    var source = card.getAttribute('data-scholar-source');
    var citationsTarget = card.querySelector('[data-scholar-citations]');
    var hIndexTarget = card.querySelector('[data-scholar-hindex]');
    var updatedTarget = card.querySelector('[data-scholar-updated]');
    if (!source || !citationsTarget || !hIndexTarget || !updatedTarget || !window.fetch) return;

    var cacheKey = new Date().toISOString().slice(0, 10);

    window.fetch(source + '?v=' + encodeURIComponent(cacheKey), { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('Failed to load scholar metrics.');
        return response.json();
      })
      .then(function (metrics) {
        if (metrics && metrics.citations && typeof metrics.citations.all === 'number') {
          citationsTarget.textContent = String(metrics.citations.all);
        }
        if (metrics && metrics.h_index && typeof metrics.h_index.all === 'number') {
          hIndexTarget.textContent = String(metrics.h_index.all);
        }
        if (metrics && metrics.checked_at_display) {
          updatedTarget.textContent = 'Last checked on ' + metrics.checked_at_display + '.';
        }
      })
      .catch(function () {
        // Keep the static fallback values when the daily metrics snapshot is unavailable.
      });
  }

  function bindNewsFilter() {
    var root = document.querySelector('[data-news-root]');
    if (!root) return;

    var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-news-filter]'));
    var items = Array.prototype.slice.call(root.querySelectorAll('[data-news-item]'));
    var years = Array.prototype.slice.call(root.querySelectorAll('[data-news-year]'));
    var empty = root.querySelector('[data-news-empty]');
    var params = new URLSearchParams(window.location.search);
    if (!buttons.length || !items.length) return;

    function setFilter(nextKind, shouldSync) {
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
      if (shouldSync !== false) {
        if (nextKind && nextKind !== 'all') params.set('news', nextKind);
        else params.delete('news');
        var nextQuery = params.toString();
        var nextUrl = window.location.pathname + (nextQuery ? '?' + nextQuery : '') + window.location.hash;
        window.history.replaceState({}, '', nextUrl);
      }
      announce((nextKind === 'all' ? 'All' : nextKind) + ' news filter applied.');
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        setFilter(button.getAttribute('data-news-filter') || 'all', true);
      });
    });

    setFilter(params.get('news') || 'all', false);
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
    bindScholarMetrics();
    bindNewsFilter();
    bindSectionIndex();
    loadPublicationArchive().finally(function () {
      bindPublicationSearch();
    });
  });
})();
