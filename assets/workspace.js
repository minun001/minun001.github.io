(function () {
  var WORKSPACE_CONTENT_VERSION = '20260424j';
  var WORKSPACE_AUTO_REFRESH_MS = 30 * 1000;
  var WORKSPACE_REALTIME_DEBOUNCE_MS = 1200;
  var workspaceContentFallbackCache = null;
  var workspaceServerFallbackCache = null;
  var workspaceSignalsFallbackCache = null;

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

  function isLocalMode(config) {
    return String((config && config.provider) || '').trim().toLowerCase() === 'local';
  }

  function getDataFiles(config) {
    var files = (config && config.dataFiles) || {};
    return {
      content: String(files.content || '/tools/workspace_content.json').trim() || '/tools/workspace_content.json',
      serverSignals: String(files.serverSignals || '/tools/workspace_server_sync_fallback.json').trim() || '/tools/workspace_server_sync_fallback.json',
      siteSignals: String(files.siteSignals || '/tools/workspace_site_signals.json').trim() || '/tools/workspace_site_signals.json'
    };
  }

  var workspaceState = {
    notesItems: [],
    linksItems: [],
    opsTargets: [],
    serverItems: [],
    serverActionMode: 'sync',
    analyticsSummary: null,
    selectedNoteId: null,
    selectedLinkId: null,
    selectedOpsId: null,
    selectedServerAlias: null,
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
        context: ''
      },
      {
        label: 'Since Launch',
        value: String((summary && summary.lifetimeVisitors) || 0),
        context: ''
      },
      {
        label: 'Tracked Pages',
        value: String((summary && summary.trackedPages) || 0),
        context: ''
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

  function renderCardCopy(value, maxLength) {
    var text = truncateText(value, maxLength || 120);
    if (!text) return '';
    return '<p class="workspace-select-card-copy">' + escapeHtml(text) + '</p>';
  }

  function createFallbackId(prefix, index) {
    return prefix + '-' + String(index + 1);
  }

  function normalizeContentFallback(raw) {
    var safeRaw = raw && typeof raw === 'object' ? raw : {};
    return {
      metrics: safeArray(safeRaw.workspace_dashboard_metrics).map(function (item, index) {
        return {
          id: createFallbackId('fallback-metric', index),
          label: String((item && item.label) || '').trim(),
          value: String((item && item.value) || '').trim(),
          context: String((item && item.context) || '').trim(),
          sort_order: Number((item && item.sort_order) || ((index + 1) * 10))
        };
      }).filter(function (item) {
        return Boolean(item.label && item.value);
      }),
      links: safeArray(safeRaw.workspace_links).map(function (item, index) {
        return {
          id: createFallbackId('fallback-link', index),
          title: String((item && item.title) || '').trim(),
          description: String((item && item.description) || '').trim(),
          url: String((item && item.url) || '').trim(),
          tag: String((item && item.tag) || 'Open').trim() || 'Open',
          sort_order: Number((item && item.sort_order) || ((index + 1) * 10))
        };
      }).filter(function (item) {
        return Boolean(item.title && item.url);
      }),
      notes: safeArray(safeRaw.workspace_notes).map(function (item, index) {
        return {
          id: createFallbackId('fallback-note', index),
          title: String((item && item.title) || '').trim(),
          body: String((item && item.body) || '').trim(),
          pinned: Boolean(item && item.pinned),
          sort_order: Number((item && item.sort_order) || ((index + 1) * 10)),
          updated_at: ''
        };
      }).filter(function (item) {
        return Boolean(item.title && item.body);
      })
    };
  }

  async function loadWorkspaceContentFallback(config) {
    if (workspaceContentFallbackCache) return workspaceContentFallbackCache;
    if (!window.fetch) {
      workspaceContentFallbackCache = { metrics: [], links: [], notes: [] };
      return workspaceContentFallbackCache;
    }

    try {
      var response = await window.fetch(getDataFiles(config).content + '?v=' + WORKSPACE_CONTENT_VERSION, {
        credentials: 'same-origin',
        cache: 'no-store'
      });
      if (!response.ok) {
        workspaceContentFallbackCache = { metrics: [], links: [], notes: [] };
        return workspaceContentFallbackCache;
      }
      var payload = await response.json();
      workspaceContentFallbackCache = normalizeContentFallback(payload);
      return workspaceContentFallbackCache;
    } catch (_error) {
      workspaceContentFallbackCache = { metrics: [], links: [], notes: [] };
      return workspaceContentFallbackCache;
    }
  }

  function normalizeServerFallback(raw) {
    var safeRaw = raw && typeof raw === 'object' ? raw : {};
    return {
      targets: safeArray(safeRaw.targets),
      snapshots: safeArray(safeRaw.snapshots)
    };
  }

  async function loadServerFallback(config) {
    if (workspaceServerFallbackCache) return workspaceServerFallbackCache;
    if (!window.fetch) {
      workspaceServerFallbackCache = getServerFallback(config);
      return workspaceServerFallbackCache;
    }

    try {
      var response = await window.fetch(getDataFiles(config).serverSignals + '?v=' + WORKSPACE_CONTENT_VERSION, {
        credentials: 'same-origin',
        cache: 'no-store'
      });
      if (!response.ok) {
        workspaceServerFallbackCache = getServerFallback(config);
        return workspaceServerFallbackCache;
      }
      var payload = await response.json();
      workspaceServerFallbackCache = normalizeServerFallback(payload);
      return workspaceServerFallbackCache;
    } catch (_error) {
      workspaceServerFallbackCache = getServerFallback(config);
      return workspaceServerFallbackCache;
    }
  }

  function normalizeSignalsFallback(raw, config) {
    var safeRaw = raw && typeof raw === 'object' ? raw : {};
    var launchDateKey = /^\d{4}-\d{2}-\d{2}$/.test(String(safeRaw.launchDateKey || '').trim())
      ? String(safeRaw.launchDateKey).trim()
      : getAnalyticsLaunchDate(config);
    var monthlySeries = safeArray(safeRaw.monthlySeries).map(function (item) {
      return {
        monthKey: String((item && item.monthKey) || '').trim(),
        visitors: Math.max(0, Math.round(toFiniteNumber(item && item.visitors, 0))),
        hits: Math.max(0, Math.round(toFiniteNumber(item && item.hits, 0)))
      };
    }).filter(function (item) {
      return /^\d{4}-\d{2}$/.test(item.monthKey);
    });
    var topPages = safeArray(safeRaw.topPages).map(function (item) {
      return {
        path: normalizePath(item && item.path),
        hits: Math.max(0, Math.round(toFiniteNumber(item && item.hits, 0)))
      };
    }).filter(function (item) {
      return Boolean(item.path);
    });

    return {
      todayVisitors: Math.max(0, Math.round(toFiniteNumber(safeRaw.todayVisitors, 0))),
      last30Visitors: Math.max(0, Math.round(toFiniteNumber(safeRaw.last30Visitors, 0))),
      lifetimeVisitors: Math.max(0, Math.round(toFiniteNumber(safeRaw.lifetimeVisitors, 0))),
      trackedPages: Math.max(0, Math.round(toFiniteNumber(safeRaw.trackedPages, topPages.length))),
      launchDateKey: launchDateKey,
      monthlySeries: monthlySeries.length ? monthlySeries : buildZeroAnalyticsState(config).monthlySeries,
      topPages: topPages.length ? topPages : buildZeroAnalyticsState(config).topPages,
      updatedAt: String((safeRaw.updated_at || safeRaw.updatedAt) || '').trim()
    };
  }

  async function loadWorkspaceSignalsFallback(config) {
    if (workspaceSignalsFallbackCache) return workspaceSignalsFallbackCache;
    if (!window.fetch) {
      workspaceSignalsFallbackCache = buildZeroAnalyticsState(config);
      return workspaceSignalsFallbackCache;
    }

    try {
      var response = await window.fetch(getDataFiles(config).siteSignals + '?v=' + WORKSPACE_CONTENT_VERSION, {
        credentials: 'same-origin',
        cache: 'no-store'
      });
      if (!response.ok) {
        workspaceSignalsFallbackCache = buildZeroAnalyticsState(config);
        return workspaceSignalsFallbackCache;
      }
      var payload = await response.json();
      workspaceSignalsFallbackCache = normalizeSignalsFallback(payload, config);
      return workspaceSignalsFallbackCache;
    } catch (_error) {
      workspaceSignalsFallbackCache = buildZeroAnalyticsState(config);
      return workspaceSignalsFallbackCache;
    }
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

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function getServerFallback(config) {
    var fallback = config && config.serverFallback;
    if (!fallback || typeof fallback !== 'object') {
      return { targets: [], snapshots: [] };
    }
    return {
      targets: safeArray(fallback.targets),
      snapshots: safeArray(fallback.snapshots)
    };
  }

  function toFiniteNumber(value, fallback) {
    var number = Number(value);
    if (Number.isFinite(number)) return number;
    return Number.isFinite(Number(fallback)) ? Number(fallback) : 0;
  }

  function clampPercent(value) {
    return Math.max(0, Math.min(100, Math.round(toFiniteNumber(value, 0))));
  }

  function renderCardMeta(parts) {
    var safeParts = safeArray(parts).filter(function (part) {
      return Boolean(String(part || '').trim());
    });
    if (!safeParts.length) return '';
    return (
      '<div class="workspace-select-card-meta">' +
        safeParts.map(function (part) {
          return '<span>' + escapeHtml(part) + '</span>';
        }).join('') +
      '</div>'
    );
  }

  function getLinkHost(url) {
    try {
      var parsed = new URL(String(url || ''), window.location.origin);
      return parsed.host || normalizePath(parsed.pathname);
    } catch (_error) {
      return 'External link';
    }
  }

  function renderDetailListBlock(title, items, useCode) {
    var safeItems = safeArray(items).filter(function (item) {
      return Boolean(String(item || '').trim());
    });
    if (!safeItems.length) return '';
    return (
      '<div class="workspace-detail-block">' +
        '<h5>' + escapeHtml(title) + '</h5>' +
        '<ul class="workspace-detail-list">' +
          safeItems.map(function (item) {
            var content = useCode ? '<code>' + escapeHtml(item) + '</code>' : escapeHtml(item);
            return '<li>' + content + '</li>';
          }).join('') +
        '</ul>' +
      '</div>'
    );
  }

  function getLinkActionItems() {
    return [
      {
        id: 'restore-private-links',
        title: 'Restore workspace files',
        badge: 'Action',
        summary: 'Check the repo JSON that powers the workspace file list.',
        detailSummary: 'The local workspace link list is missing or empty.',
        checklist: [
          'Confirm the canonical rows in tools/workspace_content.json.',
          'Reload the workspace after updating the file.'
        ]
      }
    ];
  }

  function getServerActionItems(mode) {
    return [
      {
        id: 'sync-server-targets',
        title: 'Restore server targets',
        badge: 'Action',
        summary: 'Check the repo server snapshot file and target list.',
        detailSummary: 'No repo-backed server target rows are available yet.',
        checklist: [
          'Confirm tools/workspace_server_sync_fallback.json exists in the repo.',
          'Check aliases, labels, and root labels in that snapshot file.'
        ]
      },
      {
        id: 'run-first-snapshot',
        title: 'Refresh server snapshot',
        badge: 'Action',
        summary: 'Generate a new repo snapshot from the trusted machine.',
        detailSummary: 'The workspace cannot find a repo-backed server snapshot yet.',
        checklist: [
          'Run python tools/workspace_server_sync.py --dry-run from the trusted machine.',
          'Write the updated payload back into tools/workspace_server_sync_fallback.json and push the repo.'
        ]
      }
    ];
  }

  function isMissingTableError(error, tableName) {
    if (!error || typeof error !== 'object') return false;
    var code = String(error.code || '').trim();
    var message = String(error.message || '').trim().toLowerCase();
    var hint = String(error.hint || '').trim().toLowerCase();
    var target = String(tableName || '').trim().toLowerCase();
    return (
      code === 'PGRST205' ||
      message.indexOf('schema cache') !== -1 ||
      (Boolean(target) && message.indexOf(target) !== -1) ||
      (Boolean(target) && hint.indexOf(target) !== -1)
    );
  }

  function getUsageTone(value) {
    var percent = toFiniteNumber(value, 0);
    if (percent >= 85) return 'danger';
    if (percent >= 60) return 'warn';
    return 'ok';
  }

  function getRelativeAgeMinutes(value) {
    if (!value) return null;
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  }

  function formatRelativeAge(value) {
    var minutes = getRelativeAgeMinutes(value);
    if (minutes === null) return 'No snapshot';
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return minutes + 'm ago';
    var hours = Math.round(minutes / 60);
    if (hours < 24) return hours + 'h ago';
    var days = Math.round(hours / 24);
    return days + 'd ago';
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
        safeItems.map(function (item) {
          var itemId = toSelectionId(item.id);
          var isActive = itemId === activeId;
          return (
            '<button type="button" class="workspace-select-card' + (isActive ? ' is-active' : '') + '" data-workspace-note-trigger="' + escapeHtml(itemId) + '" aria-expanded="' + (isActive ? 'true' : 'false') + '" aria-controls="workspace-note-detail">' +
              '<div class="workspace-select-card-head">' +
                '<div>' +
                  '<h4>' + escapeHtml(item.title || 'Untitled note') + '</h4>' +
                '</div>' +
                (item.pinned ? '<span class="workspace-note-badge">Pinned</span>' : '<span class="workspace-card-microtag">Log</span>') +
              '</div>' +
              renderCardCopy(item.body, 112) +
              renderCardMeta([
                'Updated ' + (formatDate(item.updated_at) || 'recently')
              ]) +
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
      return '<div class="workspace-empty">No workspace files yet.</div>';
    }

    return (
      '<div class="workspace-summary-grid">' +
        safeItems.map(function (item) {
          var label = String(item.tag || 'Open').trim() || 'Open';
          return (
            '<a class="workspace-select-card workspace-link-card" href="' + escapeHtml(item.url || '#') + '" target="_blank" rel="noreferrer">' +
              '<div class="workspace-select-card-head">' +
                '<div>' +
                  '<h4>' + escapeHtml(item.title || 'Resource') + '</h4>' +
                '</div>' +
                '<span class="workspace-link-tag">' + escapeHtml(label) + '</span>' +
              '</div>' +
              renderCardCopy(item.description, 108) +
            '</a>'
          );
        }).join('') +
      '</div>'
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
    var activePathCount = activeItem ? activeItem.repoPaths.length : 0;

    return (
      '<div class="workspace-summary-grid">' +
        safeItems.map(function (item) {
          var itemId = toSelectionId(item.id);
          var isActive = itemId === activeId;
          var badge = getOpsBadge(item);
          return (
            '<button type="button" class="workspace-select-card' + (isActive ? ' is-active' : '') + '" data-workspace-op-trigger="' + escapeHtml(itemId) + '" aria-expanded="' + (isActive ? 'true' : 'false') + '" aria-controls="workspace-op-detail">' +
              '<div class="workspace-select-card-head">' +
                '<div>' +
                  '<h4>' + escapeHtml(item.title || 'Website Ops') + '</h4>' +
                '</div>' +
                '<span class="workspace-card-microtag">' + escapeHtml(badge) + '</span>' +
              '</div>' +
              renderCardCopy(item.summary, 112) +
            '</button>'
          );
        }).join('') +
      '</div>' +
      '<section class="workspace-detail-panel" id="workspace-op-detail" role="region" aria-labelledby="workspace-op-detail-title"' + (activeItem ? '' : ' hidden') + '>' +
        (activeItem ? (
          '<div class="workspace-detail-head">' +
            '<div>' +
              '<h4 id="workspace-op-detail-title">' + escapeHtml(activeItem.title || 'Website Ops') + '</h4>' +
            '</div>' +
            '<button type="button" class="workspace-detail-close" data-workspace-op-close>Close</button>' +
          '</div>' +
          '<div class="workspace-detail-meta">' +
            '<span>' + escapeHtml(getOpsBadge(activeItem)) + '</span>' +
            '<span>' + escapeHtml(String(activePathCount) + ' edit surface' + (activePathCount === 1 ? '' : 's')) + '</span>' +
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

  function normalizeLoadAverage(value) {
    var safeValue = value && typeof value === 'object' ? value : {};
    return {
      one: toFiniteNumber(safeValue.one, 0),
      five: toFiniteNumber(safeValue.five, 0),
      fifteen: toFiniteNumber(safeValue.fifteen, 0)
    };
  }

  function getServerRootLabel(target) {
    var explicitLabel = String((target && target.root_label) || '').trim();
    if (explicitLabel) return explicitLabel;
    var label = String((target && target.label) || '').trim();
    return label ? label + ' root' : 'Workspace root';
  }

  function getServerItemTimestamp(item) {
    var raw = item && item.generatedAt ? Date.parse(item.generatedAt) : NaN;
    return Number.isFinite(raw) ? raw : 0;
  }

  function buildServerItems(targets, snapshots) {
    var snapshotMap = {};
    safeArray(snapshots).forEach(function (snapshot) {
      var alias = String((snapshot && snapshot.server_alias) || '').trim();
      if (alias) snapshotMap[alias] = snapshot;
    });

    return safeArray(targets)
      .map(function (target, index) {
        var alias = String((target && target.alias) || '').trim();
        if (!alias) return null;
        var snapshot = snapshotMap[alias] || {};
        var gpuPayload = safeArray(snapshot.gpu_payload);
        var gpuProcesses = safeArray(snapshot.gpu_processes);
        var topProcesses = safeArray(snapshot.top_processes);
        var gpuCount = Math.max(0, Math.round(toFiniteNumber(snapshot.gpu_count, gpuPayload.length)));
        var gpuAverage = toFiniteNumber(snapshot.gpu_avg_usage_percent, 0);
        if (!gpuAverage && gpuPayload.length) {
          gpuAverage = gpuPayload.reduce(function (sum, device) {
            return sum + toFiniteNumber(device && device.utilization_percent, 0);
          }, 0) / gpuPayload.length;
        }

        return {
          alias: alias,
          label: String((target && target.label) || alias).trim() || alias,
          sshAlias: String((target && target.ssh_alias) || '').trim(),
          rootLabel: getServerRootLabel(target),
          sortOrder: toFiniteNumber(target && target.sort_order, (index + 1) * 10),
          status: String((snapshot && snapshot.status) || '').trim().toLowerCase(),
          errorMessage: String((snapshot && snapshot.error_message) || '').trim(),
          generatedAt: String((snapshot && (snapshot.generated_at || snapshot.updated_at)) || '').trim(),
          host: String((snapshot && snapshot.host) || '').trim(),
          uptime: String((snapshot && snapshot.uptime) || '').trim(),
          cpuUsagePercent: toFiniteNumber(snapshot && snapshot.cpu_usage_percent, 0),
          cpuModel: String((snapshot && snapshot.cpu_model) || '').trim(),
          logicalCores: Math.max(0, Math.round(toFiniteNumber(snapshot && snapshot.logical_cores, 0))),
          loadAverage: normalizeLoadAverage(snapshot && snapshot.load_average),
          memoryUsedMb: toFiniteNumber(snapshot && snapshot.memory_used_mb, 0),
          memoryTotalMb: toFiniteNumber(snapshot && snapshot.memory_total_mb, 0),
          memoryUsagePercent: toFiniteNumber(snapshot && snapshot.memory_usage_percent, 0),
          diskUsedText: String((snapshot && snapshot.disk_used_text) || '').trim(),
          diskPercent: toFiniteNumber(snapshot && snapshot.disk_percent, 0),
          gpuCount: gpuCount,
          gpuAvgUsagePercent: gpuAverage,
          gpuPayload: gpuPayload,
          gpuProcesses: gpuProcesses,
          topProcesses: topProcesses
        };
      })
      .filter(Boolean)
      .sort(function (left, right) {
        if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
        return left.label.localeCompare(right.label);
      });
  }

  function mergeServerItems(primaryItems, secondaryItems) {
    var merged = {};

    safeArray(secondaryItems).forEach(function (item) {
      if (!item || !item.alias) return;
      merged[item.alias] = item;
    });

    safeArray(primaryItems).forEach(function (item) {
      if (!item || !item.alias) return;
      var existing = merged[item.alias];
      if (!existing || getServerItemTimestamp(item) >= getServerItemTimestamp(existing)) {
        merged[item.alias] = item;
      }
    });

    return Object.keys(merged)
      .map(function (alias) { return merged[alias]; })
      .sort(function (left, right) {
        if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
        return left.label.localeCompare(right.label);
      });
  }

  function getServerStatusInfo(item) {
    var rawStatus = String((item && item.status) || '').toLowerCase();
    var ageMinutes = getRelativeAgeMinutes(item && item.generatedAt);
    if (rawStatus === 'error' || (item && item.errorMessage)) {
      return { key: 'error', label: 'Error' };
    }
    if (rawStatus === 'stale' || ageMinutes === null || ageMinutes > 1440) {
      return { key: 'stale', label: 'Stale' };
    }
    return { key: 'live', label: 'Live' };
  }

  function formatPercent(value, decimals) {
    var precision = Number.isFinite(Number(decimals)) ? Number(decimals) : 0;
    return toFiniteNumber(value, 0).toFixed(precision) + '%';
  }

  function formatLoadAverage(value) {
    var load = normalizeLoadAverage(value);
    return [load.one, load.five, load.fifteen].map(function (item) {
      return item.toFixed(2);
    }).join(' / ');
  }

  function formatStorageValue(megabytes) {
    var safeMegabytes = toFiniteNumber(megabytes, 0);
    if (!safeMegabytes) return '0 GB';
    if (safeMegabytes >= 1024 * 1024) {
      return (safeMegabytes / (1024 * 1024)).toFixed(1) + ' TB';
    }
    if (safeMegabytes >= 1024) {
      return (safeMegabytes / 1024).toFixed(1) + ' GB';
    }
    return Math.round(safeMegabytes) + ' MB';
  }

  function formatMemoryPair(usedMb, totalMb) {
    var used = Math.round(toFiniteNumber(usedMb, 0));
    var total = Math.round(toFiniteNumber(totalMb, 0));
    if (!total) return 'No memory snapshot';
    return used + ' / ' + total + ' MB';
  }

  function formatStoragePairCompact(usedMb, totalMb) {
    var total = toFiniteNumber(totalMb, 0);
    if (!total) return 'No memory snapshot';
    return formatStorageValue(usedMb) + ' / ' + formatStorageValue(totalMb);
  }

  function formatDiskDetail(item) {
    if (item && item.diskUsedText) return item.diskUsedText;
    return 'No disk snapshot';
  }

  function getTopCpuProcess(item) {
    return safeArray(item && item.topProcesses)[0] || null;
  }

  function getTopGpuProcess(item) {
    var processes = safeArray(item && item.gpuProcesses).slice();
    if (!processes.length) return null;
    processes.sort(function (left, right) {
      return toFiniteNumber(right && right.used_memory_mb, 0) - toFiniteNumber(left && left.used_memory_mb, 0);
    });
    return processes[0] || null;
  }

  function renderServerMeter(label, percent, detail, toneOverride) {
    var tone = toneOverride || getUsageTone(percent);
    var width = tone === 'muted' ? 0 : clampPercent(percent);
    return (
      '<div class="workspace-server-meter">' +
        '<div class="workspace-server-meter-head">' +
          '<strong>' + escapeHtml(label) + '</strong>' +
          '<span>' + escapeHtml(detail) + '</span>' +
        '</div>' +
        '<div class="workspace-server-meter-track" aria-hidden="true">' +
          '<div class="workspace-server-meter-fill" data-tone="' + escapeHtml(tone) + '" style="width:' + escapeHtml(width + '%') + '"></div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderServerStatCard(label, value, subtitle, percent, toneOverride) {
    var tone = toneOverride || getUsageTone(percent);
    var width = tone === 'muted' ? 0 : clampPercent(percent);
    return (
      '<div class="workspace-server-stat-card">' +
        '<span class="workspace-server-stat-label">' + escapeHtml(label) + '</span>' +
        '<strong class="workspace-server-stat-value">' + escapeHtml(value) + '</strong>' +
        '<span class="workspace-server-stat-subtitle">' + escapeHtml(subtitle) + '</span>' +
        '<div class="workspace-server-stat-track" aria-hidden="true">' +
          '<div class="workspace-server-stat-fill" data-tone="' + escapeHtml(tone) + '" style="width:' + escapeHtml(width + '%') + '"></div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderServerFactPill(label, value) {
    return (
      '<div class="workspace-server-fact-pill">' +
        '<strong>' + escapeHtml(label) + '</strong>' +
        '<span>' + escapeHtml(value) + '</span>' +
      '</div>'
    );
  }

  function getPrimaryGpuLabel(item) {
    var firstDevice = safeArray(item && item.gpuPayload)[0] || null;
    return (firstDevice && firstDevice.name) || 'No GPU';
  }

  function renderServerDevices(item) {
    var devices = safeArray(item && item.gpuPayload);
    if (!devices.length) {
      return '<div class="workspace-empty">No GPU for this server.</div>';
    }

    return (
      '<div class="workspace-server-device-list">' +
        devices.map(function (device, index) {
          var utilizationPercent = toFiniteNumber(device && device.utilization_percent, 0);
          var memoryUsedMb = toFiniteNumber(device && device.memory_used_mb, 0);
          var memoryTotalMb = toFiniteNumber(device && device.memory_total_mb, 0);
          var memoryPercent = memoryTotalMb ? (memoryUsedMb / memoryTotalMb) * 100 : 0;
          var temperature = device && device.temperature_c ? device.temperature_c + 'C' : 'Temp unavailable';
          return (
            '<div class="workspace-server-device">' +
              '<div class="workspace-server-device-head">' +
                '<strong>' + escapeHtml((device && device.name) || ('GPU ' + index)) + '</strong>' +
                '<span class="workspace-server-chip">' + escapeHtml(temperature) + '</span>' +
              '</div>' +
              '<div class="workspace-server-device-meters">' +
                renderServerMeter('Utilization', utilizationPercent, formatPercent(utilizationPercent, 0), null) +
                renderServerMeter('Memory', memoryPercent, formatStoragePairCompact(memoryUsedMb, memoryTotalMb), memoryTotalMb ? null : 'muted') +
              '</div>' +
            '</div>'
          );
        }).join('') +
      '</div>'
    );
  }

  function renderServerProcessBlock(title, process, emptyText, builder) {
    return (
      '<div class="workspace-detail-block">' +
        '<h5>' + escapeHtml(title) + '</h5>' +
        (process ? builder(process) : '<p>' + escapeHtml(emptyText) + '</p>') +
      '</div>'
    );
  }

  function renderServerSignals(items, selectedAlias, actionMode) {
    var safeItems = safeArray(items);
    if (!safeItems.length) {
      var serverActions = getServerActionItems(actionMode);
      var activeActionId = String(selectedAlias || '');
      var activeAction = serverActions.find(function (item) {
        return item.id === activeActionId;
      }) || null;

      return (
        '<div class="workspace-summary-grid">' +
          serverActions.map(function (item) {
            var isActive = item.id === activeActionId;
            return (
              '<button type="button" class="workspace-select-card' + (isActive ? ' is-active' : '') + '" data-workspace-server-trigger="' + escapeHtml(item.id) + '" aria-expanded="' + (isActive ? 'true' : 'false') + '" aria-controls="workspace-server-detail">' +
                '<div class="workspace-select-card-head">' +
                  '<div>' +
                    '<h4>' + escapeHtml(item.title) + '</h4>' +
                  '</div>' +
                  '<span class="workspace-server-status" data-state="stale">' +
                    '<span class="workspace-server-status-dot" aria-hidden="true"></span>' +
                    'Action' +
                  '</span>' +
                '</div>' +
                renderCardCopy(item.summary, 120) +
              '</button>'
            );
          }).join('') +
        '</div>' +
        '<section class="workspace-detail-panel" id="workspace-server-detail" role="region" aria-labelledby="workspace-server-detail-title"' + (activeAction ? '' : ' hidden') + '>' +
          (activeAction ? (
            '<div class="workspace-detail-head">' +
              '<div>' +
                '<h4 id="workspace-server-detail-title">' + escapeHtml(activeAction.title) + '</h4>' +
              '</div>' +
              '<button type="button" class="workspace-detail-close" data-workspace-server-close>Close</button>' +
            '</div>' +
            '<div class="workspace-detail-meta">' +
              '<span>Server sync required</span>' +
            '</div>' +
            '<div class="workspace-detail-copy">' +
              '<p>' + escapeHtml(activeAction.detailSummary) + '</p>' +
            '</div>' +
            renderDetailListBlock('Next steps', activeAction.checklist, false)
          ) : '') +
        '</section>'
      );
    }

    var activeAlias = String(selectedAlias || '');
    var activeItem = safeItems.find(function (item) {
      return item.alias === activeAlias;
    }) || null;

    return (
      '<div class="workspace-summary-grid">' +
        safeItems.map(function (item) {
          var status = getServerStatusInfo(item);
          var isActive = item.alias === activeAlias;
          var hasSnapshot = Boolean(item.generatedAt);
          var cpuDetail = hasSnapshot ? formatPercent(item.cpuUsagePercent, 0) : 'No snapshot';
          var memoryDetail = hasSnapshot ? formatPercent(item.memoryUsagePercent, 0) : 'No snapshot';
          var gpuDetail = !hasSnapshot ? 'No snapshot' : (item.gpuCount ? formatPercent(item.gpuAvgUsagePercent, 0) : 'No GPU');
          return (
            '<button type="button" class="workspace-select-card' + (isActive ? ' is-active' : '') + '" data-workspace-server-trigger="' + escapeHtml(item.alias) + '" aria-expanded="' + (isActive ? 'true' : 'false') + '" aria-controls="workspace-server-detail">' +
              '<div class="workspace-select-card-head">' +
                '<div>' +
                  '<h4>' + escapeHtml(item.label) + '</h4>' +
                '</div>' +
                '<span class="workspace-server-status" data-state="' + escapeHtml(status.key) + '">' +
                  '<span class="workspace-server-status-dot" aria-hidden="true"></span>' +
                  escapeHtml(status.label) +
                '</span>' +
              '</div>' +
              renderCardMeta([
                'Updated ' + formatRelativeAge(item.generatedAt),
                item.gpuCount ? ((item.gpuPayload[0] && item.gpuPayload[0].name) || 'GPU') : 'No GPU'
              ]) +
              '<div class="workspace-server-meters">' +
                renderServerMeter('CPU', item.cpuUsagePercent, cpuDetail, (!hasSnapshot || status.key === 'error') ? 'muted' : null) +
                renderServerMeter('Memory', item.memoryUsagePercent, memoryDetail, (!hasSnapshot || status.key === 'error') ? 'muted' : null) +
                renderServerMeter('GPU', item.gpuAvgUsagePercent, gpuDetail, (!hasSnapshot || status.key === 'error') ? 'muted' : (item.gpuCount ? null : 'muted')) +
              '</div>' +
              (status.key === 'error' && item.errorMessage ? '<div class="workspace-server-error">' + escapeHtml(truncateText(item.errorMessage, 120)) + '</div>' : '') +
            '</button>'
          );
        }).join('') +
      '</div>' +
      '<section class="workspace-detail-panel" id="workspace-server-detail" role="region" aria-labelledby="workspace-server-detail-title"' + (activeItem ? '' : ' hidden') + '>' +
        (activeItem ? (
          '<div class="workspace-detail-head">' +
            '<div>' +
              '<h4 id="workspace-server-detail-title">' + escapeHtml(activeItem.label) + '</h4>' +
            '</div>' +
            '<button type="button" class="workspace-detail-close" data-workspace-server-close>Close</button>' +
          '</div>' +
          '<div class="workspace-detail-meta">' +
            '<span>' + escapeHtml(getServerStatusInfo(activeItem).label) + '</span>' +
            '<span>' + escapeHtml('Updated ' + formatRelativeAge(activeItem.generatedAt)) + '</span>' +
          '</div>' +
          (activeItem.errorMessage ? '<div class="workspace-server-error">' + escapeHtml(activeItem.errorMessage) + '</div>' : '') +
          (!activeItem.generatedAt && !activeItem.errorMessage ? '<div class="workspace-empty">No server snapshot yet for this target.</div>' : '') +
          (activeItem.generatedAt ? '<div class="workspace-server-hero-grid">' +
            renderServerStatCard('CPU', formatPercent(activeItem.cpuUsagePercent, 1), (activeItem.logicalCores || 0) + ' cores', activeItem.cpuUsagePercent, null) +
            renderServerStatCard('Memory', formatPercent(activeItem.memoryUsagePercent, 1), formatStoragePairCompact(activeItem.memoryUsedMb, activeItem.memoryTotalMb), activeItem.memoryUsagePercent, null) +
            renderServerStatCard('Disk', formatPercent(activeItem.diskPercent, 0), formatDiskDetail(activeItem), activeItem.diskPercent, null) +
            renderServerStatCard('GPU', activeItem.gpuCount ? formatPercent(activeItem.gpuAvgUsagePercent, 0) : 'No GPU', activeItem.gpuCount ? (activeItem.gpuCount + (activeItem.gpuCount === 1 ? ' device' : ' devices')) : 'No device attached', activeItem.gpuCount ? activeItem.gpuAvgUsagePercent : 0, activeItem.gpuCount ? null : 'muted') +
          '</div>' +
          '<div class="workspace-server-fact-row">' +
            renderServerFactPill('Uptime', activeItem.uptime || 'Unavailable') +
            renderServerFactPill('Refresh', formatRelativeAge(activeItem.generatedAt)) +
            renderServerFactPill('CPU', activeItem.cpuModel || 'CPU unavailable') +
            renderServerFactPill('GPU', getPrimaryGpuLabel(activeItem)) +
          '</div>' +
          '<div class="workspace-server-detail-grid workspace-server-detail-grid--visual">' +
            '<div class="workspace-detail-block workspace-server-detail-block">' +
              '<h5>CPU Load</h5>' +
              renderServerMeter('Usage', activeItem.cpuUsagePercent, formatPercent(activeItem.cpuUsagePercent, 1), null) +
              '<div class="workspace-server-chip-row">' +
                '<span class="workspace-server-chip">' + escapeHtml('Load ' + formatLoadAverage(activeItem.loadAverage)) + '</span>' +
                '<span class="workspace-server-chip">' + escapeHtml((activeItem.logicalCores || 0) + ' cores') + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="workspace-detail-block workspace-server-detail-block">' +
              '<h5>Memory & Disk</h5>' +
              renderServerMeter('Memory', activeItem.memoryUsagePercent, formatStoragePairCompact(activeItem.memoryUsedMb, activeItem.memoryTotalMb), null) +
              renderServerMeter('Disk', activeItem.diskPercent, formatDiskDetail(activeItem), null) +
            '</div>' +
            '<div class="workspace-detail-block workspace-server-detail-block">' +
              '<h5>GPU</h5>' +
              (activeItem.gpuCount ? renderServerMeter('Average', activeItem.gpuAvgUsagePercent, formatPercent(activeItem.gpuAvgUsagePercent, 0), null) : '<div class="workspace-empty">No GPU for this server.</div>') +
              '<div class="workspace-server-chip-row">' +
                '<span class="workspace-server-chip">' + escapeHtml(activeItem.gpuCount ? (activeItem.gpuCount + (activeItem.gpuCount === 1 ? ' device' : ' devices')) : 'No GPU') + '</span>' +
                (activeItem.gpuCount ? '<span class="workspace-server-chip">' + escapeHtml(getPrimaryGpuLabel(activeItem)) + '</span>' : '') +
              '</div>' +
            '</div>' +
            '<div class="workspace-detail-block workspace-server-detail-block workspace-server-detail-block--full">' +
              '<h5>GPU Devices</h5>' +
              renderServerDevices(activeItem) +
            '</div>' +
          '</div>' : '')
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
        body: renderSignalSparkline(safeSummary.monthlySeries)
      },
      {
        key: 'pages',
        title: 'Top Pages',
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
              '</div>' +
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
    var availableLinkIds = (workspaceState.linksItems.length ? workspaceState.linksItems : getLinkActionItems()).map(function (item) {
      return toSelectionId(item.id);
    });
    if (availableLinkIds.indexOf(String(workspaceState.selectedLinkId || '')) === -1) {
      workspaceState.selectedLinkId = null;
    }
    if (!workspaceState.opsTargets.some(function (item) { return toSelectionId(item.id) === String(workspaceState.selectedOpsId || ''); })) {
      workspaceState.selectedOpsId = null;
    }
    var availableServerIds = (workspaceState.serverItems.length ? workspaceState.serverItems : getServerActionItems(workspaceState.serverActionMode)).map(function (item) {
      return String(item.alias || item.id || '');
    });
    if (availableServerIds.indexOf(String(workspaceState.selectedServerAlias || '')) === -1) {
      workspaceState.selectedServerAlias = null;
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

  function renderWorkspaceServers() {
    setHtml('workspace-servers', renderServerSignals(workspaceState.serverItems, workspaceState.selectedServerAlias, workspaceState.serverActionMode));
  }

  function renderWorkspaceSignals() {
    setHtml('workspace-signals', renderSignals(workspaceState.analyticsSummary || buildZeroAnalyticsState(getConfig()), workspaceState.selectedSignalKey));
  }

  function applyLocalWorkspaceIdentity() {
    var refreshNode = byId('workspace-session-timeout');
    if (refreshNode) refreshNode.textContent = '30s + focus refresh';
  }

  async function loadWorkspaceLocalData(config) {
    var contentFallback = await loadWorkspaceContentFallback(config);
    var serverFallback = await loadServerFallback(config);
    var analyticsSummary = await loadWorkspaceSignalsFallback(config);
    var metricsItems = contentFallback.metrics.slice();
    var linksItems = contentFallback.links.slice();
    var serverItems = buildServerItems(serverFallback.targets, serverFallback.snapshots);

    workspaceState.notesItems = [];
    workspaceState.linksItems = linksItems;
    workspaceState.opsTargets = getOpsTargets(config);
    workspaceState.serverItems = serverItems;
    workspaceState.serverActionMode = serverItems.length ? 'live' : 'sync';
    workspaceState.analyticsSummary = analyticsSummary;
    syncInteractiveSelections();

    setHtml('workspace-metrics', renderMetricCards(metricsItems, analyticsSummary));
    renderWorkspaceLinks();
    renderWorkspaceServers();
    renderWorkspaceSignals();
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

    var serversRoot = byId('workspace-servers');
    if (serversRoot && !serversRoot.dataset.bound) {
      serversRoot.dataset.bound = 'true';
      serversRoot.addEventListener('click', function (event) {
        var closeButton = event.target.closest('[data-workspace-server-close]');
        if (closeButton) {
          workspaceState.selectedServerAlias = null;
          renderWorkspaceServers();
          return;
        }
        var trigger = event.target.closest('[data-workspace-server-trigger]');
        if (!trigger) return;
        var serverAlias = String(trigger.getAttribute('data-workspace-server-trigger') || '');
        var nextAlias = workspaceState.selectedServerAlias === serverAlias ? null : serverAlias;
        workspaceState.selectedServerAlias = nextAlias;
        renderWorkspaceServers();
        if (nextAlias) revealSectionDetail('workspace-server-detail');
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
    var contentFallback = await loadWorkspaceContentFallback(config);
    var serverFallback = await loadServerFallback(config);
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

    var serverTargetsPromise = client
      .from(tables.serverTargets || 'workspace_server_targets')
      .select('alias,label,ssh_alias,root_label,sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limits.servers || 12);

    var serverSnapshotsPromise = client
      .from(tables.serverSnapshots || 'workspace_server_snapshots')
      .select('server_alias,status,error_message,generated_at,host,uptime,cpu_usage_percent,cpu_model,logical_cores,load_average,memory_used_mb,memory_total_mb,memory_usage_percent,disk_used_text,disk_percent,gpu_count,gpu_avg_usage_percent,gpu_payload,gpu_processes,top_processes,updated_at');

    var results = await Promise.all([metricsPromise, visitsPromise, notesPromise, linksPromise, serverTargetsPromise, serverSnapshotsPromise]);
    var metrics = results[0];
    var visits = results[1];
    var notes = results[2];
    var links = results[3];
    var serverTargets = results[4];
    var serverSnapshots = results[5];

    var metricsItems = metrics.error ? [] : (metrics.data || []);
    var analyticsSummary = visits.error ? buildZeroAnalyticsState(config) : aggregateVisitAnalytics(visits.data || [], config);
    var notesItems = notes.error ? [] : (notes.data || []);
    var liveLinksItems = links.error ? [] : (links.data || []).filter(function (item) {
      var url = String((item && item.url) || '').trim().toLowerCase();
      return !/example\.com/.test(url);
    });
    var linksItems = contentFallback.links.length ? contentFallback.links.slice() : liveLinksItems;
    if (!metricsItems.length && contentFallback.metrics.length) {
      metricsItems = contentFallback.metrics;
    }
    if (!notesItems.length && contentFallback.notes.length) {
      notesItems = contentFallback.notes;
    }
    var liveServerItems = buildServerItems(
      serverTargets.error ? [] : (serverTargets.data || []),
      serverSnapshots.error ? [] : (serverSnapshots.data || [])
    );
    var fallbackServerItems = buildServerItems(serverFallback.targets, serverFallback.snapshots);
    var serverItems = mergeServerItems(liveServerItems, fallbackServerItems);
    var serverActionMode = (
      isMissingTableError(serverTargets.error, 'workspace_server_targets') ||
      isMissingTableError(serverSnapshots.error, 'workspace_server_snapshots')
    ) ? 'schema_missing' : 'sync';

    workspaceState.notesItems = notesItems;
    workspaceState.linksItems = linksItems;
    workspaceState.serverItems = serverItems;
    workspaceState.serverActionMode = serverActionMode;
    workspaceState.analyticsSummary = analyticsSummary;
    syncInteractiveSelections();

    setHtml('workspace-metrics', renderMetricCards(metricsItems, analyticsSummary));
    renderWorkspaceNotes();
    renderWorkspaceLinks();
    renderWorkspaceOps();
    renderWorkspaceServers();
    renderWorkspaceSignals();
  }

  async function boot() {
    var config = getConfig();
    var form = byId('workspace-login-form');
    var signOut = byId('workspace-signout');
    var resendConfirmation = byId('workspace-resend-confirmation');
    var emailInput = byId('workspace-email');
    var passwordInput = byId('workspace-password');

    if (isLocalMode(config)) {
      workspaceState.opsTargets = [];
      syncInteractiveSelections();
      bindInteractiveSections();
      setShellMode('private');
      setView('dashboard');
      applyLocalWorkspaceIdentity();
      await loadWorkspaceLocalData(config);

      var localRefreshInFlight = false;
      var localRefreshTimerId = null;

      async function refreshLocalWorkspace(options) {
        var settings = options || {};
        if (document.hidden && !settings.force) return;
        if (localRefreshInFlight) return;
        localRefreshInFlight = true;
        try {
          workspaceContentFallbackCache = null;
          workspaceServerFallbackCache = null;
          workspaceSignalsFallbackCache = null;
          await loadWorkspaceLocalData(config);
        } finally {
          localRefreshInFlight = false;
        }
      }

      localRefreshTimerId = window.setInterval(function () {
        refreshLocalWorkspace({ force: false }).catch(function () {});
      }, WORKSPACE_AUTO_REFRESH_MS);

      document.addEventListener('visibilitychange', function () {
        if (document.hidden) return;
        refreshLocalWorkspace({ force: true }).catch(function () {});
      });
      window.addEventListener('focus', function () {
        refreshLocalWorkspace({ force: true }).catch(function () {});
      });
      window.addEventListener('beforeunload', function () {
        if (localRefreshTimerId) {
          window.clearInterval(localRefreshTimerId);
        }
      });
      return;
    }

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
    renderWorkspaceServers();
    var pendingSignedOutMessage = '';
    var idleTimeoutMinutes = getIdleTimeoutMinutes(config);
    var idleTimerId = null;
    var idleListenersReady = false;
    var idleTrackingActive = false;
    var refreshTimerId = null;
    var refreshInFlight = false;
    var privateSessionActive = false;
    var realtimeChannels = [];
    var realtimeDebounceId = null;

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

    function clearRefreshTimer() {
      if (refreshTimerId) {
        window.clearInterval(refreshTimerId);
        refreshTimerId = null;
      }
    }

    function clearRealtimeDebounce() {
      if (realtimeDebounceId) {
        window.clearTimeout(realtimeDebounceId);
        realtimeDebounceId = null;
      }
    }

    async function refreshWorkspaceData(options) {
      var settings = options || {};
      if (!privateSessionActive) return;
      if (document.hidden && !settings.force) return;
      if (refreshInFlight) return;

      refreshInFlight = true;
      try {
        await loadWorkspaceData(client, config);
      } catch (error) {
        if (settings.surfaceError !== false) {
          setStatus(error && error.message ? error.message : 'Private content failed to refresh.', 'warn');
        }
      } finally {
        refreshInFlight = false;
      }
    }

    function startWorkspaceRefresh() {
      clearRefreshTimer();
      refreshTimerId = window.setInterval(function () {
        refreshWorkspaceData({ surfaceError: false }).catch(function () {});
      }, WORKSPACE_AUTO_REFRESH_MS);
    }

    function stopWorkspaceRefresh() {
      clearRefreshTimer();
      refreshInFlight = false;
    }

    function stopRealtimeSubscriptions() {
      clearRealtimeDebounce();
      if (!realtimeChannels.length) return;
      realtimeChannels.forEach(function (channel) {
        try {
          client.removeChannel(channel);
        } catch (_error) {}
      });
      realtimeChannels = [];
    }

    function scheduleRealtimeRefresh() {
      clearRealtimeDebounce();
      realtimeDebounceId = window.setTimeout(function () {
        refreshWorkspaceData({ force: true, surfaceError: false }).catch(function () {});
      }, WORKSPACE_REALTIME_DEBOUNCE_MS);
    }

    function startRealtimeSubscriptions() {
      stopRealtimeSubscriptions();
      if (!client.channel) return;

      var tables = config.tables || {};
      var realtimeTargets = [
        tables.serverTargets || 'workspace_server_targets',
        tables.serverSnapshots || 'workspace_server_snapshots'
      ];

      realtimeTargets.forEach(function (tableName) {
        try {
          var channel = client
            .channel('workspace-realtime-' + tableName)
            .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, function () {
              if (!privateSessionActive) return;
              scheduleRealtimeRefresh();
            })
            .subscribe();
          realtimeChannels.push(channel);
        } catch (_error) {}
      });
    }

    async function applySession(session) {
      var user = session && session.user ? session.user : null;
      if (!user) {
        privateSessionActive = false;
        stopIdleTracking();
        stopWorkspaceRefresh();
        stopRealtimeSubscriptions();
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
        privateSessionActive = false;
        stopIdleTracking();
        stopWorkspaceRefresh();
        stopRealtimeSubscriptions();
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
      privateSessionActive = true;
      startWorkspaceRefresh();
      startRealtimeSubscriptions();
      renderWorkspaceOps();
      await refreshWorkspaceData({ force: true, surfaceError: true });
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
        privateSessionActive = false;
        stopIdleTracking();
        stopWorkspaceRefresh();
        stopRealtimeSubscriptions();
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

    document.addEventListener('visibilitychange', function () {
      if (!privateSessionActive || document.hidden) return;
      refreshWorkspaceData({ force: true, surfaceError: false }).catch(function () {});
    });
    window.addEventListener('focus', function () {
      if (!privateSessionActive) return;
      refreshWorkspaceData({ force: true, surfaceError: false }).catch(function () {});
    });
    window.addEventListener('beforeunload', function () {
      stopRealtimeSubscriptions();
      stopWorkspaceRefresh();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    boot().catch(function (error) {
      setShellMode('auth');
      setView('setup');
      setStatus(error && error.message ? error.message : 'Workspace failed to load.', 'error');
    });
  });
})();

