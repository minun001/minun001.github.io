(function () {
  function getConfig() {
    return window.WORKSPACE_AUTH_CONFIG || {};
  }

  function getWorkspaceEmail() {
    var emailInput = byId('workspace-email');
    return emailInput && emailInput.value ? String(emailInput.value).trim() : '';
  }

  function getMasterUserId(config) {
    return String((config && config.masterUserId) || '').trim().toLowerCase();
  }

  function getIdleTimeoutMinutes(config) {
    var session = (config && config.session) || {};
    var minutes = Number(session.idleMinutes || 15);
    if (!Number.isFinite(minutes) || minutes <= 0) return 15;
    return minutes;
  }

  function formatIdleTimeoutLabel(minutes) {
    var safeMinutes = Math.max(1, Math.round(Number(minutes) || 15));
    return safeMinutes + ' min idle';
  }

  function hasSupabaseConfig(config) {
    return Boolean(config && config.supabaseUrl && config.supabaseAnonKey);
  }

  var workspaceState = {
    notesItems: [],
    linksItems: [],
    opsTargets: [],
    analyticsSummary: null,
    selectedNoteId: null,
    selectedLinkId: null,
    selectedOpsId: null,
    selectedSignalKey: null
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function setStatus(message, tone) {
    var status = byId('workspace-status');
    if (!status) return;
    status.textContent = message || '';
    status.dataset.tone = tone || 'neutral';
  }

  function setConfirmationAction(visible) {
    var button = byId('workspace-resend-confirmation');
    if (!button) return;
    button.hidden = !visible;
  }

  function setView(name) {
    var panels = document.querySelectorAll('[data-workspace-view]');
    Array.prototype.forEach.call(panels, function (panel) {
      panel.hidden = panel.getAttribute('data-workspace-view') !== name;
    });
  }

  function setShellMode(mode) {
    var shell = document.querySelector('[data-workspace-shell]');
    var page = document.querySelector('[data-workspace-page]');
    var privatePanels = document.querySelectorAll('[data-workspace-private]');
    if (shell) shell.setAttribute('data-mode', mode === 'private' ? 'private' : 'auth');
    if (page) page.setAttribute('data-mode', mode === 'private' ? 'private' : 'auth');
    Array.prototype.forEach.call(privatePanels, function (panel) {
      panel.hidden = mode !== 'private';
    });
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getAccessLabel(user, config) {
    var role = resolveRole(user);
    if (role) return role;
    if (isAuthorized(user, config)) return 'Master access';
    return '-';
  }

  function setIdentity(user, config) {
    var email = byId('workspace-user-email');
    var role = byId('workspace-user-role');
    var timeout = byId('workspace-session-timeout');
    if (email) email.textContent = user && user.email ? user.email : '-';
    if (role) role.textContent = getAccessLabel(user, config);
    if (timeout) timeout.textContent = formatIdleTimeoutLabel(getIdleTimeoutMinutes(config));
  }

  function resolveRole(user) {
    if (!user) return '';
    if (user.app_metadata && user.app_metadata.role) return user.app_metadata.role;
    if (user.user_metadata && user.user_metadata.role) return user.user_metadata.role;
    return '';
  }

  function isAuthorized(user, config) {
    var requiredRole = String((config && config.requiredRole) || 'master').toLowerCase();
    var role = String(resolveRole(user) || '').toLowerCase();
    var userId = user && user.id ? String(user.id).trim().toLowerCase() : '';
    var masterUserId = getMasterUserId(config);
    return (Boolean(role) && role === requiredRole) || (Boolean(userId) && userId === masterUserId);
  }

  function setHtml(id, html) {
    var node = byId(id);
    if (!node) return;
    node.innerHTML = html;
  }

  function getLoginErrorMessage(error) {
    var message = error && error.message ? String(error.message) : '';
    var code = error && error.code ? String(error.code) : '';
    if (message === 'Invalid login credentials') {
      return 'Login failed. This usually means the Supabase Auth user does not exist yet or the password does not match.';
    }
    if (message === 'Email not confirmed' || code === 'email_not_confirmed') {
      return 'Login failed because the email address has not been confirmed yet. Check your inbox for the Supabase confirmation email, then try again.';
    }
    return message || 'Unable to sign in.';
  }

  function isEmailNotConfirmedError(error) {
    var message = error && error.message ? String(error.message) : '';
    var code = error && error.code ? String(error.code) : '';
    return message === 'Email not confirmed' || code === 'email_not_confirmed';
  }

  async function resendVerificationEmail(client, email) {
    return client.auth.resend({
      type: 'signup',
      email: email
    });
  }

  function buildFallbackMetricCards(summary) {
    return [
      {
        label: 'Today',
        value: String((summary && summary.todayVisitors) || 0),
        context: 'Unique visitors today'
      },
      {
        label: 'Last 30 Days',
        value: String((summary && summary.last30Visitors) || 0),
        context: 'Recent unique visitors'
      },
      {
        label: 'Visitors',
        value: String((summary && summary.lifetimeVisitors) || 0),
        context: 'Since launch'
      },
      {
        label: 'Tracked Pages',
        value: String((summary && summary.trackedPages) || 0),
        context: 'Pages tracked'
      }
    ];
  }

  function renderMetricCards(items, summary) {
    var safeItems = Array.isArray(items) ? items : [];
    if (!safeItems.length) {
      safeItems = buildFallbackMetricCards(summary);
    }

    return safeItems.map(function (item) {
      return (
        '<article class="workspace-mini-card">' +
          '<span>' + escapeHtml(item.label || 'Metric') + '</span>' +
          '<strong>' + escapeHtml(item.value || '-') + '</strong>' +
          '<p>' + escapeHtml(item.context || '') + '</p>' +
        '</article>'
      );
    }).join('');
  }

  function toSelectionId(value) {
    return String(value == null ? '' : value);
  }

  function truncateText(value, maxLength) {
    var text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, Math.max(0, maxLength - 3)).trimEnd() + '...';
  }

  function formatRichText(value) {
    var text = String(value || '').trim();
    if (!text) return '<p>No details yet.</p>';
    return text
      .split(/\n{2,}/)
      .map(function (paragraph) {
        return '<p>' + escapeHtml(paragraph).replace(/\n/g, '<br>') + '</p>';
      })
      .join('');
  }

  function revealSectionDetail(detailId) {
    if (!window.matchMedia || !window.matchMedia('(max-width: 900px)').matches) return;
    window.requestAnimationFrame(function () {
      var node = byId(detailId);
      if (node && typeof node.scrollIntoView === 'function') {
        node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  function renderNotes(items, selectedId) {
    var safeItems = Array.isArray(items) ? items : [];
    if (!safeItems.length) {
      return '<div class="workspace-empty">No research log yet.</div>';
    }

    var activeId = String(selectedId || '');
    var activeItem = safeItems.find(function (item) {
      return toSelectionId(item.id) === activeId;
    }) || null;

    return (
      '<div class="workspace-summary-grid">' +
        safeItems.map(function (item, index) {
          var itemId = toSelectionId(item.id);
          var isActive = itemId === activeId;
          var isPinnedFeatured = Boolean(item.pinned) && index === 0;
          return (
            '<button type="button" class="workspace-select-card' + (isActive ? ' is-active' : '') + (isPinnedFeatured ? ' workspace-select-card--featured' : '') + '" data-workspace-note-trigger="' + escapeHtml(itemId) + '" aria-expanded="' + (isActive ? 'true' : 'false') + '" aria-controls="workspace-note-detail">' +
              '<div class="workspace-select-card-head">' +
                '<div>' +
                  '<h4>' + escapeHtml(item.title || 'Untitled note') + '</h4>' +
                '</div>' +
                (item.pinned ? '<span class="workspace-note-badge">Pinned</span>' : '<span class="workspace-card-microtag">Log</span>') +
              '</div>' +
              '<p class="workspace-select-card-copy">' + escapeHtml(truncateText(item.body, isPinnedFeatured ? 180 : 110)) + '</p>' +
              '<div class="workspace-note-meta">Updated ' + escapeHtml(formatDate(item.updated_at) || 'recently') + '</div>' +
            '</button>'
          );
        }).join('') +
      '</div>' +
      '<section class="workspace-detail-panel" id="workspace-note-detail" role="region" aria-labelledby="workspace-note-detail-title"' + (activeItem ? '' : ' hidden') + '>' +
        (activeItem ? (
          '<div class="workspace-detail-head">' +
            '<div>' +
              '<div class="eyebrow">Research Log</div>' +
              '<h4 id="workspace-note-detail-title">' + escapeHtml(activeItem.title || 'Untitled note') + '</h4>' +
            '</div>' +
            '<button type="button" class="workspace-detail-close" data-workspace-note-close>Close</button>' +
          '</div>' +
          '<div class="workspace-detail-meta">' +
            '<span>Updated ' + escapeHtml(formatDate(activeItem.updated_at) || 'recently') + '</span>' +
            '<span>' + escapeHtml(activeItem.pinned ? 'Pinned note' : 'Research note') + '</span>' +
          '</div>' +
          '<div class="workspace-detail-copy">' + formatRichText(activeItem.body) + '</div>'
        ) : '') +
      '</section>'
    );
  }

  function renderLinks(items, selectedId) {
    var safeItems = Array.isArray(items) ? items : [];
    if (!safeItems.length) {
      return '<div class="workspace-empty">No private library links yet.</div>';
    }

    var activeId = String(selectedId || '');
    var activeItem = safeItems.find(function (item) {
      return toSelectionId(item.id) === activeId;
    }) || null;

    return (
      '<div class="workspace-summary-grid">' +
        safeItems.map(function (item) {
          var itemId = toSelectionId(item.id);
          var isActive = itemId === activeId;
          var label = String(item.tag || 'Open').trim() || 'Open';
          return (
            '<button type="button" class="workspace-select-card' + (isActive ? ' is-active' : '') + '" data-workspace-link-trigger="' + escapeHtml(itemId) + '" aria-expanded="' + (isActive ? 'true' : 'false') + '" aria-controls="workspace-link-detail">' +
              '<div class="workspace-select-card-head">' +
                '<div>' +
                  '<h4>' + escapeHtml(item.title || 'Resource') + '</h4>' +
                '</div>' +
                '<span class="workspace-link-tag">' + escapeHtml(label) + '</span>' +
              '</div>' +
              '<p class="workspace-select-card-copy">' + escapeHtml(truncateText(item.description, 110)) + '</p>' +
              '<div class="workspace-note-meta">' + escapeHtml(label) + '</div>' +
            '</button>'
          );
        }).join('') +
      '</div>' +
      '<section class="workspace-detail-panel" id="workspace-link-detail" role="region" aria-labelledby="workspace-link-detail-title"' + (activeItem ? '' : ' hidden') + '>' +
        (activeItem ? (
          '<div class="workspace-detail-head">' +
            '<div>' +
              '<div class="eyebrow">Private Library</div>' +
              '<h4 id="workspace-link-detail-title">' + escapeHtml(activeItem.title || 'Resource') + '</h4>' +
            '</div>' +
            '<button type="button" class="workspace-detail-close" data-workspace-link-close>Close</button>' +
          '</div>' +
          '<div class="workspace-detail-meta">' +
            '<span>' + escapeHtml(String(activeItem.tag || 'Open').trim() || 'Open') + '</span>' +
            '<span>External resource</span>' +
          '</div>' +
          '<div class="workspace-detail-copy">' + formatRichText(activeItem.description) + '</div>' +
          '<div class="workspace-detail-actions">' +
            '<a class="workspace-button" href="' + escapeHtml(activeItem.url || '#') + '" target="_blank" rel="noreferrer">' + escapeHtml(String(activeItem.tag || 'Open').trim() || 'Open') + '</a>' +
          '</div>'
        ) : '') +
      '</section>'
    );
  }

  function getOpsBadge(item) {
    return String((item && item.id) || '') === 'shared-shell-deploy' ? 'Deploy' : 'Edit Target';
  }

  function renderOps(items, selectedId) {
    var safeItems = Array.isArray(items) ? items : [];
    if (!safeItems.length) {
      return '<div class="workspace-empty">No website ops targets yet.</div>';
    }

    var activeId = String(selectedId || '');
    var activeItem = safeItems.find(function (item) {
      return toSelectionId(item.id) === activeId;
    }) || null;

    return (
      '<div class="workspace-summary-grid">' +
        safeItems.map(function (item) {
          var itemId = toSelectionId(item.id);
          var isActive = itemId === activeId;
          var badge = getOpsBadge(item);
          var pathCount = item.repoPaths.length;
          return (
            '<button type="button" class="workspace-select-card' + (isActive ? ' is-active' : '') + '" data-workspace-op-trigger="' + escapeHtml(itemId) + '" aria-expanded="' + (isActive ? 'true' : 'false') + '" aria-controls="workspace-op-detail">' +
              '<div class="workspace-select-card-head">' +
                '<div>' +
                  '<h4>' + escapeHtml(item.title || 'Website Ops') + '</h4>' +
                '</div>' +
                '<span class="workspace-card-microtag">' + escapeHtml(badge) + '</span>' +
              '</div>' +
              '<p class="workspace-select-card-copy">' + escapeHtml(item.summary || 'Frequent website maintenance target.') + '</p>' +
              '<div class="workspace-note-meta">' + escapeHtml(String(pathCount) + ' edit surface' + (pathCount === 1 ? '' : 's')) + '</div>' +
            '</button>'
          );
        }).join('') +
      '</div>' +
      '<section class="workspace-detail-panel" id="workspace-op-detail" role="region" aria-labelledby="workspace-op-detail-title"' + (activeItem ? '' : ' hidden') + '>' +
        (activeItem ? (
          '<div class="workspace-detail-head">' +
            '<div>' +
              '<div class="eyebrow">Website Ops</div>' +
              '<h4 id="workspace-op-detail-title">' + escapeHtml(activeItem.title || 'Website Ops') + '</h4>' +
            '</div>' +
            '<button type="button" class="workspace-detail-close" data-workspace-op-close>Close</button>' +
          '</div>' +
          '<div class="workspace-detail-meta">' +
            '<span>' + escapeHtml(getOpsBadge(activeItem)) + '</span>' +
            (activeItem.previewPath ? '<span>' + escapeHtml('Preview ' + activeItem.previewPath) + '</span>' : '') +
          '</div>' +
          '<div class="workspace-detail-copy">' +
            '<div class="workspace-detail-block">' +
              '<h5>Why this area matters</h5>' +
              '<p>' + escapeHtml(activeItem.summary || 'Frequent website maintenance area.') + '</p>' +
            '</div>' +
            '<div class="workspace-detail-block">' +
              '<h5>Frequent edit points</h5>' +
              '<ul class="workspace-detail-list">' +
                activeItem.commonTasks.map(function (task) {
                  return '<li>' + escapeHtml(task) + '</li>';
                }).join('') +
              '</ul>' +
            '</div>' +
            '<div class="workspace-detail-block">' +
              '<h5>Affected repo paths</h5>' +
              '<ul class="workspace-detail-list">' +
                activeItem.repoPaths.map(function (path) {
                  return '<li><code>' + escapeHtml(path) + '</code></li>';
                }).join('') +
              '</ul>' +
            '</div>' +
            '<div class="workspace-detail-block">' +
              '<h5>Verification checklist</h5>' +
              '<ul class="workspace-detail-list">' +
                activeItem.verifyChecklist.map(function (task) {
                  return '<li>' + escapeHtml(task) + '</li>';
                }).join('') +
              '</ul>' +
            '</div>' +
          '</div>' +
          (activeItem.previewPath ? (
            '<div class="workspace-detail-actions">' +
              '<a class="workspace-button secondary" href="' + escapeHtml(activeItem.previewPath) + '" target="_blank" rel="noreferrer">' +
                escapeHtml(activeItem.id === 'shared-shell-deploy' ? 'Open production site' : 'Open live page') +
              '</a>' +
            '</div>'
          ) : '')
        ) : '') +
      '</section>'
    );
  }

  function formatDate(value) {
    if (!value) return '';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function getAnalyticsDateKey(date) {
    var formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    var parts = formatter.formatToParts(date);
    var values = {};
    parts.forEach(function (part) {
      values[part.type] = part.value;
    });
    return [values.year, values.month, values.day].join('-');
  }

  function getAnalyticsDateOffset(daysAgo) {
    var date = new Date();
    date.setUTCDate(date.getUTCDate() - daysAgo);
    return getAnalyticsDateKey(date);
  }

  function getAnalyticsLaunchDate(config) {
    var analytics = (config && config.analytics) || {};
    var launchDate = String(analytics.launchDate || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(launchDate)) return launchDate;
    return getAnalyticsDateOffset(Math.max(Number(analytics.days || 14) - 1, 0));
  }

  function formatAnalyticsDate(dateKey) {
    if (!dateKey) return '-';
    var date = new Date(dateKey + 'T12:00:00Z');
    if (Number.isNaN(date.getTime())) return dateKey;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatAnalyticsMonth(monthKey) {
    if (!monthKey) return '-';
    var date = new Date(monthKey + '-01T12:00:00Z');
    if (Number.isNaN(date.getTime())) return monthKey;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  function formatAnalyticsFullDate(dateKey) {
    if (!dateKey) return '-';
    var date = new Date(dateKey + 'T12:00:00Z');
    if (Number.isNaN(date.getTime())) return dateKey;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function getMonthKeyFromDateKey(dateKey) {
    return String(dateKey || '').slice(0, 7);
  }

  function normalizePath(path) {
    var value = String(path || '/').trim();
    if (!value) return '/';
    if (!value.startsWith('/')) value = '/' + value;
    if (value !== '/' && !value.endsWith('/')) value += '/';
    return value;
  }

  function getSiteNavItems(config) {
    var navItems = Array.isArray(window.SITE_NAV) ? window.SITE_NAV : [];
    var resolved = navItems
      .map(function (item) {
        return {
          name: String((item && item.name) || '').trim(),
          link: normalizePath((item && item.link) || '/')
        };
      })
      .filter(function (item) {
        return Boolean(item.name && item.link);
      });

    if (resolved.length) return resolved;

    return [
      { name: 'Home', link: '/' },
      { name: 'Profile', link: '/profile/' },
      { name: 'Publications', link: '/publications/' },
      { name: 'News', link: '/news/' },
      { name: String(((config && config.sectionName) || 'Dashboard')).trim() || 'Dashboard', link: '/workspace/' }
    ];
  }

  function getOpsTargets(config) {
    var items = Array.isArray(config && config.opsTargets) ? config.opsTargets : [];
    return items
      .map(function (item) {
        var previewPath = String((item && item.previewPath) || '').trim();
        return {
          id: String((item && item.id) || '').trim(),
          title: String((item && item.title) || '').trim(),
          summary: String((item && item.summary) || '').trim(),
          previewPath: previewPath ? normalizePath(previewPath) : '',
          repoPaths: Array.isArray(item && item.repoPaths) ? item.repoPaths.map(function (path) {
            return String(path || '').trim();
          }).filter(Boolean) : [],
          commonTasks: Array.isArray(item && item.commonTasks) ? item.commonTasks.map(function (task) {
            return String(task || '').trim();
          }).filter(Boolean) : [],
          verifyChecklist: Array.isArray(item && item.verifyChecklist) ? item.verifyChecklist.map(function (task) {
            return String(task || '').trim();
          }).filter(Boolean) : []
        };
      })
      .filter(function (item) {
        return Boolean(item.id && item.title);
      });
  }

  function buildMonthlySeries(startDateKey, monthlyBuckets) {
    var safeStart = /^\d{4}-\d{2}-\d{2}$/.test(String(startDateKey || '')) ? startDateKey : getAnalyticsDateOffset(0);
    var start = new Date(safeStart.slice(0, 7) + '-01T00:00:00Z');
    var now = new Date();
    var end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    var current = new Date(start.getTime());
    var series = [];

    while (current <= end) {
      var monthKey = current.toISOString().slice(0, 7);
      var bucket = monthlyBuckets[monthKey] || { tokenMap: {}, hits: 0 };
      series.push({
        monthKey: monthKey,
        visitors: Object.keys(bucket.tokenMap || {}).length,
        hits: Number(bucket.hits || 0)
      });
      current.setUTCMonth(current.getUTCMonth() + 1);
    }

    return series;
  }

  function getPathLabel(path) {
    var value = normalizePath(path);
    var match = getSiteNavItems(getConfig()).find(function (item) {
      return item.link === value;
    });
    if (match) return match.name;
    return value.replace(/^\//, '').replace(/\/$/, '') || 'Page';
  }

  function buildZeroAnalyticsState(config) {
    var launchDateKey = getAnalyticsLaunchDate(config);
    var defaultTopPages = getSiteNavItems(config).map(function (item) {
      return {
        path: item.link,
        hits: 0
      };
    });

    return {
      todayVisitors: 0,
      last30Visitors: 0,
      lifetimeVisitors: 0,
      trackedPages: 0,
      launchDateKey: launchDateKey,
      monthlySeries: buildMonthlySeries(launchDateKey, {}),
      topPages: defaultTopPages
    };
  }

  function aggregateVisitAnalytics(items, config) {
    var days = {};
    var pages = {};
    var todayKey = getAnalyticsDateOffset(0);
    var last30Cutoff = getAnalyticsDateOffset(29);
    var launchDateKey = getAnalyticsLaunchDate(config);
    var last30Tokens = {};
    var lifetimeTokens = {};
    var months = {};
    var distinctPages = {};

    items.forEach(function (item) {
      var dateKey = item.visited_on;
      var token = String(item.visitor_token || '').trim();
      var pagePath = String(item.page_path || '/').trim() || '/';
      if (!dateKey || !token) return;

      if (!days[dateKey]) {
        days[dateKey] = {
          tokenMap: {},
          hits: 0
        };
      }

      days[dateKey].tokenMap[token] = true;
      days[dateKey].hits += 1;
      pages[pagePath] = (pages[pagePath] || 0) + 1;
      distinctPages[pagePath] = true;
      lifetimeTokens[token] = true;

      var monthKey = getMonthKeyFromDateKey(dateKey);
      if (!months[monthKey]) {
        months[monthKey] = {
          tokenMap: {},
          hits: 0
        };
      }

      months[monthKey].tokenMap[token] = true;
      months[monthKey].hits += 1;

      if (dateKey >= last30Cutoff) {
        last30Tokens[token] = true;
      }
    });

    var topPages = Object.keys(pages)
      .map(function (pagePath) {
        return {
          path: pagePath,
          hits: pages[pagePath]
        };
      })
      .sort(function (left, right) {
        return right.hits - left.hits;
      })
      .slice(0, 4);

    return {
      todayVisitors: days[todayKey] ? Object.keys(days[todayKey].tokenMap).length : 0,
      last30Visitors: Object.keys(last30Tokens).length,
      lifetimeVisitors: Object.keys(lifetimeTokens).length,
      trackedPages: Object.keys(distinctPages).length,
      launchDateKey: launchDateKey,
      monthlySeries: buildMonthlySeries(launchDateKey, months),
      topPages: topPages
    };
  }

  function renderAnalyticsSummary(summary) {
    var cards = [
      {
        label: 'Today',
        value: summary.todayVisitors,
        detail: 'Unique visitors today'
      },
      {
        label: 'Last 30 Days',
        value: summary.last30Visitors,
        detail: 'Unique visitors in the recent month'
      },
      {
        label: 'Since Launch',
        value: summary.lifetimeVisitors,
        detail: 'Unique visitors since ' + formatAnalyticsFullDate(summary.launchDateKey)
      },
      {
        label: 'Tracked Pages',
        value: summary.trackedPages,
        detail: 'Public pages with recorded traffic'
      }
    ];

    return cards.map(function (card) {
      return (
        '<article class="workspace-analytics-card">' +
          '<span>' + escapeHtml(card.label) + '</span>' +
          '<strong>' + escapeHtml(card.value) + '</strong>' +
          '<p>' + escapeHtml(card.detail) + '</p>' +
        '</article>'
      );
    }).join('');
  }

  function renderAnalyticsDays(items, launchDateKey) {
    if (!items.length) {
      return renderAnalyticsDays(buildZeroAnalyticsState({ analytics: { launchDate: launchDateKey } }).monthlySeries, launchDateKey);
    }

    var maxVisitors = items.reduce(function (maxValue, item) {
      return Math.max(maxValue, Number(item.visitors || 0));
    }, 0) || 1;
    var chartWidth = 640;
    var chartHeight = 280;
    var innerLeft = 20;
    var innerRight = 620;
    var lineFloor = 228;
    var lineTop = 42;
    var xStep = items.length > 1 ? (innerRight - innerLeft) / (items.length - 1) : 0;
    var points = items.map(function (item, index) {
      var visitors = Number(item.visitors || 0);
      var x = items.length > 1 ? innerLeft + (xStep * index) : (chartWidth / 2);
      var y = lineFloor - ((visitors / maxVisitors) * (lineFloor - lineTop));
      return {
        monthKey: item.monthKey,
        visitors: visitors,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10
      };
    });
    var polyline = points.map(function (point) {
      return point.x + ',' + point.y;
    }).join(' ');
    var launchLabel = formatAnalyticsFullDate(launchDateKey);

    return (
      '<div class="workspace-chart">' +
        '<div class="workspace-line-chart" role="img" aria-label="' + escapeHtml('Monthly visitors from ' + launchLabel + ' to today') + '">' +
          '<svg viewBox="0 0 ' + chartWidth + ' ' + chartHeight + '" preserveAspectRatio="none">' +
            '<line class="workspace-line-chart-axis" x1="' + innerLeft + '" y1="' + lineFloor + '" x2="' + innerRight + '" y2="' + lineFloor + '"></line>' +
            '<polyline class="workspace-line-chart-path" points="' + escapeHtml(polyline) + '"></polyline>' +
            points.map(function (point) {
              return (
                '<g>' +
                  '<circle class="workspace-line-chart-dot" cx="' + escapeHtml(point.x) + '" cy="' + escapeHtml(point.y) + '" r="4"></circle>' +
                  '<text class="workspace-line-chart-value" x="' + escapeHtml(point.x) + '" y="' + escapeHtml(point.y - 10) + '">' + escapeHtml(point.visitors) + '</text>' +
                '</g>'
              );
            }).join('') +
          '</svg>' +
          '<div class="workspace-line-chart-labels">' +
            points.map(function (point) {
              return '<span>' + escapeHtml(formatAnalyticsMonth(point.monthKey)) + '</span>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderAnalyticsPages(items) {
    if (!items.length) {
      return renderAnalyticsPages(buildZeroAnalyticsState(getConfig()).topPages);
    }

    var maxHits = items.reduce(function (maxValue, item) {
      return Math.max(maxValue, Number(item.hits || 0));
    }, 0) || 1;

    return (
      '<div class="workspace-chart">' +
        '<div class="workspace-chart-rows">' +
          items.map(function (item) {
            var hits = Number(item.hits || 0);
            var width = Math.max(8, Math.round((hits / maxHits) * 100));
            return (
              '<div class="workspace-chart-row">' +
                '<div class="workspace-chart-row-head">' +
                  '<strong>' + escapeHtml(getPathLabel(item.path)) + '</strong>' +
                  '<span>' + escapeHtml(hits + ' hits') + '</span>' +
                '</div>' +
                '<div class="workspace-chart-track" aria-hidden="true">' +
                  '<div class="workspace-chart-fill" style="width:' + escapeHtml(width + '%') + '"></div>' +
                '</div>' +
              '</div>'
            );
          }).join('') +
        '</div>' +
      '</div>'
    );
  }

  function renderSignalSparkline(items) {
    var safeItems = Array.isArray(items) ? items.slice(-6) : [];
    if (!safeItems.length) {
      return '<div class="workspace-signal-empty">No trend data yet.</div>';
    }

    var width = 240;
    var height = 110;
    var left = 10;
    var right = 230;
    var top = 18;
    var bottom = 92;
    var maxVisitors = safeItems.reduce(function (maxValue, item) {
      return Math.max(maxValue, Number(item.visitors || 0));
    }, 0) || 1;
    var step = safeItems.length > 1 ? (right - left) / (safeItems.length - 1) : 0;
    var points = safeItems.map(function (item, index) {
      var visitors = Number(item.visitors || 0);
      var x = safeItems.length > 1 ? left + (step * index) : (width / 2);
      var y = bottom - ((visitors / maxVisitors) * (bottom - top));
      return {
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        visitors: visitors
      };
    });

    return (
      '<div class="workspace-signal-mini">' +
        '<svg viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none" aria-hidden="true">' +
          '<polyline class="workspace-signal-mini-path" points="' + escapeHtml(points.map(function (point) { return point.x + ',' + point.y; }).join(' ')) + '"></polyline>' +
          points.map(function (point) {
            return '<circle class="workspace-signal-mini-dot" cx="' + escapeHtml(point.x) + '" cy="' + escapeHtml(point.y) + '" r="3"></circle>';
          }).join('') +
        '</svg>' +
      '</div>'
    );
  }

  function renderSignalPagesMini(items) {
    var safeItems = Array.isArray(items) ? items.slice(0, 3) : [];
    if (!safeItems.length) {
      return '<div class="workspace-signal-empty">No page ranking yet.</div>';
    }

    var maxHits = safeItems.reduce(function (maxValue, item) {
      return Math.max(maxValue, Number(item.hits || 0));
    }, 0) || 1;

    return (
      '<div class="workspace-signal-mini-bars">' +
        safeItems.map(function (item) {
          var hits = Number(item.hits || 0);
          var width = Math.max(10, Math.round((hits / maxHits) * 100));
          return (
            '<div class="workspace-signal-mini-bar">' +
              '<div class="workspace-signal-mini-bar-head">' +
                '<span>' + escapeHtml(getPathLabel(item.path)) + '</span>' +
                '<strong>' + escapeHtml(String(hits)) + '</strong>' +
              '</div>' +
              '<div class="workspace-signal-mini-bar-track" aria-hidden="true">' +
                '<div class="workspace-signal-mini-bar-fill" style="width:' + escapeHtml(width + '%') + '"></div>' +
              '</div>' +
            '</div>'
          );
        }).join('') +
      '</div>'
    );
  }

  function renderSignalSummaryTiles(summary, selectedKey) {
    var safeSummary = summary || buildZeroAnalyticsState(getConfig());
    var activeKey = String(selectedKey || '');
    var cards = [
      {
        key: 'snapshot',
        title: 'Traffic Snapshot',
        copy: 'Quick read on recent visitors and tracked public pages.',
        body: (
          '<div class="workspace-signal-stats">' +
            [
              { label: 'Today', value: safeSummary.todayVisitors },
              { label: 'Last 30', value: safeSummary.last30Visitors },
              { label: 'Since Launch', value: safeSummary.lifetimeVisitors },
              { label: 'Tracked', value: safeSummary.trackedPages }
            ].map(function (item) {
              return (
                '<div class="workspace-signal-stat">' +
                  '<span>' + escapeHtml(item.label) + '</span>' +
                  '<strong>' + escapeHtml(String(item.value)) + '</strong>' +
                '</div>'
              );
            }).join('') +
          '</div>'
        )
      },
      {
        key: 'trend',
        title: 'Trend',
        copy: 'Small visitor sparkline for the recent monthly trajectory.',
        body: renderSignalSparkline(safeSummary.monthlySeries)
      },
      {
        key: 'pages',
        title: 'Top Pages',
        copy: 'Quick ranking of the public pages drawing the most visits.',
        body: renderSignalPagesMini(safeSummary.topPages)
      }
    ];

    return (
      '<div class="workspace-signal-grid">' +
        cards.map(function (card) {
          var isActive = card.key === activeKey;
          return (
            '<button type="button" class="workspace-signal-card' + (isActive ? ' is-active' : '') + '" data-workspace-signal-trigger="' + escapeHtml(card.key) + '" aria-expanded="' + (isActive ? 'true' : 'false') + '" aria-controls="workspace-signal-detail">' +
              '<div class="workspace-signal-head">' +
                '<div>' +
                  '<h4>' + escapeHtml(card.title) + '</h4>' +
                '</div>' +
                '<span class="workspace-card-microtag">View</span>' +
              '</div>' +
              '<p class="workspace-signal-copy">' + escapeHtml(card.copy) + '</p>' +
              card.body +
            '</button>'
          );
        }).join('') +
      '</div>'
    );
  }

  function renderSignalDetail(summary, selectedKey) {
    var safeSummary = summary || buildZeroAnalyticsState(getConfig());
    var key = String(selectedKey || '');
    if (!key) {
      return '<section class="workspace-detail-panel" id="workspace-signal-detail" role="region" aria-labelledby="workspace-signal-detail-title" hidden></section>';
    }

    var title = 'Site Signals';
    var description = '';
    var body = '';

    if (key === 'snapshot') {
      title = 'Traffic Snapshot';
      description = 'Expanded traffic overview across the current site footprint.';
      body = renderAnalyticsSummary(safeSummary);
    } else if (key === 'trend') {
      title = 'Trend';
      description = 'Monthly visitor trend since launch.';
      body = renderAnalyticsDays(safeSummary.monthlySeries, safeSummary.launchDateKey);
    } else {
      title = 'Top Pages';
      description = 'Page ranking based on recorded visits.';
      body = renderAnalyticsPages(safeSummary.topPages);
    }

    return (
      '<section class="workspace-detail-panel" id="workspace-signal-detail" role="region" aria-labelledby="workspace-signal-detail-title">' +
        '<div class="workspace-detail-head">' +
          '<div>' +
            '<div class="eyebrow">Site Signals</div>' +
            '<h4 id="workspace-signal-detail-title">' + escapeHtml(title) + '</h4>' +
          '</div>' +
          '<button type="button" class="workspace-detail-close" data-workspace-signal-close>Close</button>' +
        '</div>' +
        '<div class="workspace-detail-meta">' +
          '<span>' + escapeHtml(description) + '</span>' +
        '</div>' +
        '<div class="workspace-detail-copy">' + body + '</div>' +
      '</section>'
    );
  }

  function renderSignals(summary, selectedKey) {
    return renderSignalSummaryTiles(summary, selectedKey) + renderSignalDetail(summary, selectedKey);
  }

  function syncInteractiveSelections() {
    if (!workspaceState.notesItems.some(function (item) { return toSelectionId(item.id) === String(workspaceState.selectedNoteId || ''); })) {
      workspaceState.selectedNoteId = null;
    }
    if (!workspaceState.linksItems.some(function (item) { return toSelectionId(item.id) === String(workspaceState.selectedLinkId || ''); })) {
      workspaceState.selectedLinkId = null;
    }
    if (!workspaceState.opsTargets.some(function (item) { return toSelectionId(item.id) === String(workspaceState.selectedOpsId || ''); })) {
      workspaceState.selectedOpsId = null;
    }
    if (['snapshot', 'trend', 'pages'].indexOf(String(workspaceState.selectedSignalKey || '')) === -1) {
      workspaceState.selectedSignalKey = null;
    }
  }

  function renderWorkspaceNotes() {
    setHtml('workspace-notes', renderNotes(workspaceState.notesItems, workspaceState.selectedNoteId));
  }

  function renderWorkspaceLinks() {
    setHtml('workspace-links', renderLinks(workspaceState.linksItems, workspaceState.selectedLinkId));
  }

  function renderWorkspaceOps() {
    setHtml('workspace-ops', renderOps(workspaceState.opsTargets, workspaceState.selectedOpsId));
  }

  function renderWorkspaceSignals() {
    setHtml('workspace-signals', renderSignals(workspaceState.analyticsSummary || buildZeroAnalyticsState(getConfig()), workspaceState.selectedSignalKey));
  }

  function bindInteractiveSections() {
    var notesRoot = byId('workspace-notes');
    if (notesRoot && !notesRoot.dataset.bound) {
      notesRoot.dataset.bound = 'true';
      notesRoot.addEventListener('click', function (event) {
        var closeButton = event.target.closest('[data-workspace-note-close]');
        if (closeButton) {
          workspaceState.selectedNoteId = null;
          renderWorkspaceNotes();
          return;
        }
        var trigger = event.target.closest('[data-workspace-note-trigger]');
        if (!trigger) return;
        var noteId = String(trigger.getAttribute('data-workspace-note-trigger') || '');
        var nextId = workspaceState.selectedNoteId === noteId ? null : noteId;
        workspaceState.selectedNoteId = nextId;
        renderWorkspaceNotes();
        if (nextId) revealSectionDetail('workspace-note-detail');
      });
    }

    var linksRoot = byId('workspace-links');
    if (linksRoot && !linksRoot.dataset.bound) {
      linksRoot.dataset.bound = 'true';
      linksRoot.addEventListener('click', function (event) {
        var closeButton = event.target.closest('[data-workspace-link-close]');
        if (closeButton) {
          workspaceState.selectedLinkId = null;
          renderWorkspaceLinks();
          return;
        }
        var trigger = event.target.closest('[data-workspace-link-trigger]');
        if (!trigger) return;
        var linkId = String(trigger.getAttribute('data-workspace-link-trigger') || '');
        var nextId = workspaceState.selectedLinkId === linkId ? null : linkId;
        workspaceState.selectedLinkId = nextId;
        renderWorkspaceLinks();
        if (nextId) revealSectionDetail('workspace-link-detail');
      });
    }

    var opsRoot = byId('workspace-ops');
    if (opsRoot && !opsRoot.dataset.bound) {
      opsRoot.dataset.bound = 'true';
      opsRoot.addEventListener('click', function (event) {
        var closeButton = event.target.closest('[data-workspace-op-close]');
        if (closeButton) {
          workspaceState.selectedOpsId = null;
          renderWorkspaceOps();
          return;
        }
        var trigger = event.target.closest('[data-workspace-op-trigger]');
        if (!trigger) return;
        var opsId = String(trigger.getAttribute('data-workspace-op-trigger') || '');
        var nextId = workspaceState.selectedOpsId === opsId ? null : opsId;
        workspaceState.selectedOpsId = nextId;
        renderWorkspaceOps();
        if (nextId) revealSectionDetail('workspace-op-detail');
      });
    }

    var signalsRoot = byId('workspace-signals');
    if (signalsRoot && !signalsRoot.dataset.bound) {
      signalsRoot.dataset.bound = 'true';
      signalsRoot.addEventListener('click', function (event) {
        var closeButton = event.target.closest('[data-workspace-signal-close]');
        if (closeButton) {
          workspaceState.selectedSignalKey = null;
          renderWorkspaceSignals();
          return;
        }
        var trigger = event.target.closest('[data-workspace-signal-trigger]');
        if (!trigger) return;
        var signalKey = String(trigger.getAttribute('data-workspace-signal-trigger') || '');
        var nextKey = workspaceState.selectedSignalKey === signalKey ? null : signalKey;
        workspaceState.selectedSignalKey = nextKey;
        renderWorkspaceSignals();
        if (nextKey) revealSectionDetail('workspace-signal-detail');
      });
    }
  }

  async function loadWorkspaceData(client, config) {
    var tables = config.tables || {};
    var limits = config.limits || {};
    var analytics = config.analytics || {};
    var analyticsStart = getAnalyticsLaunchDate(config);

    var metricsPromise = client
      .from(tables.dashboard || 'workspace_dashboard_metrics')
      .select('label,value,context,sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limits.dashboard || 4);

    var visitsPromise = client
      .from(analytics.visitsTable || 'site_visits')
      .select('visited_on,visitor_token,page_path')
      .gte('visited_on', analyticsStart)
      .order('visited_on', { ascending: false })
      .limit(5000);

    var notesPromise = client
      .from(tables.notes || 'workspace_notes')
      .select('id,title,body,pinned,sort_order,updated_at')
      .eq('is_active', true)
      .order('pinned', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('updated_at', { ascending: false })
      .limit(limits.notes || 6);

    var linksPromise = client
      .from(tables.links || 'workspace_links')
      .select('id,title,description,url,tag,sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limits.links || 6);

    var results = await Promise.all([metricsPromise, visitsPromise, notesPromise, linksPromise]);
    var metrics = results[0];
    var visits = results[1];
    var notes = results[2];
    var links = results[3];

    var metricsItems = metrics.error ? [] : (metrics.data || []);
    var analyticsSummary = visits.error ? buildZeroAnalyticsState(config) : aggregateVisitAnalytics(visits.data || [], config);
    var notesItems = notes.error ? [] : (notes.data || []);
    var linksItems = links.error ? [] : (links.data || []).filter(function (item) {
      var url = String((item && item.url) || '').trim().toLowerCase();
      return !/example\.com/.test(url);
    });

    workspaceState.notesItems = notesItems;
    workspaceState.linksItems = linksItems;
    workspaceState.analyticsSummary = analyticsSummary;
    syncInteractiveSelections();

    setHtml('workspace-metrics', renderMetricCards(metricsItems, analyticsSummary));
    renderWorkspaceNotes();
    renderWorkspaceLinks();
    renderWorkspaceOps();
    renderWorkspaceSignals();
  }

  async function boot() {
    var config = getConfig();
    var form = byId('workspace-login-form');
    var signOut = byId('workspace-signout');
    var resendConfirmation = byId('workspace-resend-confirmation');
    var emailInput = byId('workspace-email');
    var passwordInput = byId('workspace-password');

    if (!hasSupabaseConfig(config)) {
      setShellMode('auth');
      setView('setup');
      setStatus('Workspace auth is not configured yet.', 'warn');
      return;
    }

    if (!window.supabase || !window.supabase.createClient) {
      setShellMode('auth');
      setView('setup');
      setStatus('Supabase client failed to load.', 'error');
      return;
    }

    var client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    workspaceState.opsTargets = getOpsTargets(config);
    syncInteractiveSelections();
    bindInteractiveSections();
    renderWorkspaceOps();
    var pendingSignedOutMessage = '';
    var idleTimeoutMinutes = getIdleTimeoutMinutes(config);
    var idleTimerId = null;
    var idleListenersReady = false;
    var idleTrackingActive = false;

    function clearIdleTimer() {
      if (idleTimerId) {
        window.clearTimeout(idleTimerId);
        idleTimerId = null;
      }
    }

    async function signOutForInactivity() {
      if (!idleTrackingActive) return;
      idleTrackingActive = false;
      clearIdleTimer();
      pendingSignedOutMessage = 'Signed out automatically after ' + idleTimeoutMinutes + ' minutes of inactivity.';
      await client.auth.signOut();
    }

    function scheduleIdleTimer() {
      if (!idleTrackingActive) return;
      clearIdleTimer();
      idleTimerId = window.setTimeout(function () {
        signOutForInactivity().catch(function () {
          pendingSignedOutMessage = 'Session ended after inactivity. Please sign in again.';
        });
      }, idleTimeoutMinutes * 60 * 1000);
    }

    function trackActivity() {
      if (!idleTrackingActive) return;
      if (document.hidden) return;
      scheduleIdleTimer();
    }

    function ensureIdleListeners() {
      if (idleListenersReady) return;
      idleListenersReady = true;
      ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart', 'click'].forEach(function (eventName) {
        window.addEventListener(eventName, trackActivity, { passive: true });
      });
      document.addEventListener('visibilitychange', function () {
        if (!idleTrackingActive) return;
        if (document.hidden) {
          clearIdleTimer();
          return;
        }
        scheduleIdleTimer();
      });
    }

    function startIdleTracking() {
      ensureIdleListeners();
      idleTrackingActive = true;
      scheduleIdleTimer();
    }

    function stopIdleTracking() {
      idleTrackingActive = false;
      clearIdleTimer();
    }

    async function applySession(session) {
      var user = session && session.user ? session.user : null;
      if (!user) {
        stopIdleTracking();
        setIdentity(null, config);
        setShellMode('auth');
        setView('login');
        setConfirmationAction(false);
        if (pendingSignedOutMessage) {
          setStatus(pendingSignedOutMessage, 'warn');
          pendingSignedOutMessage = '';
        } else {
          setStatus('Sign in with your workspace account.', 'neutral');
        }
        return;
      }

      if (!isAuthorized(user, config)) {
        stopIdleTracking();
        setIdentity(user, config);
        setShellMode('auth');
        setView('unauthorized');
        setStatus('This account is signed in but does not have workspace access.', 'error');
        return;
      }

      setIdentity(user, config);
      setShellMode('private');
      setView('dashboard');
      setStatus('Workspace unlocked.', 'success');
      startIdleTracking();
      renderWorkspaceOps();
      try {
        await loadWorkspaceData(client, config);
      } catch (error) {
        setStatus(error && error.message ? error.message : 'Private content failed to load.', 'warn');
      }
    }

    client.auth.onAuthStateChange(function (_event, session) {
      applySession(session);
    });

    var initial = await client.auth.getSession();
    await applySession(initial.data.session);

    if (form) {
      form.addEventListener('submit', async function (event) {
        event.preventDefault();
        setStatus('Signing in...', 'neutral');

        var email = getWorkspaceEmail();
        var password = passwordInput ? passwordInput.value : '';

        var result = await client.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (result.error) {
          if (isEmailNotConfirmedError(result.error)) {
            setConfirmationAction(true);
            var resendResult = await resendVerificationEmail(client, email);
            if (resendResult.error) {
              setStatus('Email confirmation is still required. Use Resend Verification and confirm the message sent to your inbox.', 'warn');
              return;
            }
            setStatus('Verification email sent. Open the confirmation message in your inbox, confirm the account, then sign in again.', 'warn');
            return;
          }

          setConfirmationAction(false);
          setStatus(getLoginErrorMessage(result.error), 'error');
          return;
        }

        setConfirmationAction(false);
        if (passwordInput) passwordInput.value = '';
        setStatus('Signed in successfully.', 'success');
      });
    }

    if (signOut) {
      signOut.addEventListener('click', async function () {
        stopIdleTracking();
        await client.auth.signOut();
        setStatus('Signed out.', 'neutral');
      });
    }

    if (resendConfirmation) {
      resendConfirmation.addEventListener('click', async function () {
        setStatus('Sending a new verification email...', 'neutral');

        var resendResult = await resendVerificationEmail(client, getWorkspaceEmail());

        if (resendResult.error) {
          setStatus(resendResult.error.message || 'Unable to resend verification email.', 'error');
          return;
        }

        setStatus('A new verification email has been sent. Confirm the email, then sign in again.', 'success');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    boot().catch(function (error) {
      setShellMode('auth');
      setView('setup');
      setStatus(error && error.message ? error.message : 'Workspace failed to load.', 'error');
    });
  });
})();

