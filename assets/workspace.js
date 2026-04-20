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

  function buildFallbackMetricCards(summary, linkCount, noteCount) {
    return [
      {
        label: 'Saved Links',
        value: String(linkCount || 0),
        context: 'Private reference links'
      },
      {
        label: 'Notes',
        value: String(noteCount || 0),
        context: 'Private notes in this dashboard'
      },
      {
        label: 'Visitors',
        value: String((summary && summary.lifetimeVisitors) || 0),
        context: 'Unique visitors since launch'
      },
      {
        label: 'Tracked Pages',
        value: String((summary && summary.trackedPages) || 0),
        context: 'Public pages with traffic data'
      }
    ];
  }

  function renderMetricCards(items, summary, linkCount, noteCount) {
    var safeItems = Array.isArray(items) ? items : [];
    if (!safeItems.length) {
      safeItems = buildFallbackMetricCards(summary, linkCount, noteCount);
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

  function renderLinks(items) {
    if (!items.length) {
      return '<div class="workspace-empty">No saved links yet.</div>';
    }

    return items.map(function (item) {
      return (
        '<article class="workspace-card">' +
          '<h3>' + escapeHtml(item.title || 'Saved Link') + '</h3>' +
          '<p>' + escapeHtml(item.description || '') + '</p>' +
          (item.url ? '<a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener">' + escapeHtml(item.tag || 'Open link') + '</a>' : '') +
        '</article>'
      );
    }).join('');
  }

  function formatDate(value) {
    if (!value) return '';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function renderNotes(items) {
    if (!items.length) {
      return '<div class="workspace-empty">No notes yet.</div>';
    }

    return items.map(function (item) {
      var stamp = formatDate(item.updated_at || item.inserted_at);
      return (
        '<article class="workspace-card">' +
          '<h3>' + escapeHtml(item.title || 'Note') + '</h3>' +
          '<p>' + escapeHtml(item.body || '') + '</p>' +
          (stamp ? '<div class="workspace-note-meta">' + escapeHtml(stamp) + '</div>' : '') +
        '</article>'
      );
    }).join('');
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
    var value = String(path || '/');
    if (value === '/') return 'Home';
    if (value === '/profile/') return 'Profile';
    if (value === '/publications/') return 'Publications';
    if (value === '/news/') return 'News';
    if (value === '/workspace/') return 'Dashboard';
    return value.replace(/^\//, '').replace(/\/$/, '') || 'Page';
  }

  function buildZeroAnalyticsState(config) {
    var launchDateKey = getAnalyticsLaunchDate(config);

    return {
      todayVisitors: 0,
      last30Visitors: 0,
      lifetimeVisitors: 0,
      trackedPages: 0,
      launchDateKey: launchDateKey,
      monthlySeries: buildMonthlySeries(launchDateKey, {}),
      topPages: [
        {
          path: '/',
          hits: 0
        },
        {
          path: '/profile/',
          hits: 0
        },
        {
          path: '/publications/',
          hits: 0
        },
        {
          path: '/news/',
          hits: 0
        }
      ]
    };
  }

  function renderAnalyticsEmpty(config) {
    var emptyState = buildZeroAnalyticsState(config);
    setHtml('workspace-analytics-summary', renderAnalyticsSummary(emptyState));
    setHtml('workspace-analytics-days', renderAnalyticsDays(emptyState.monthlySeries, emptyState.launchDateKey));
    setHtml('workspace-analytics-pages', renderAnalyticsPages(emptyState.topPages));
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
    var chartHeight = 220;
    var innerLeft = 20;
    var innerRight = 620;
    var lineFloor = 176;
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
        '<div class="workspace-chart-note">Monthly unique visitors from the site launch on ' + escapeHtml(launchLabel) + ' through today.</div>' +
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
        '<div class="workspace-chart-note">Most-visited public pages in the current dataset.</div>' +
      '</div>'
    );
  }

  function renderVisitorAnalytics(items) {
    if (!items.length) {
      renderAnalyticsEmpty(getConfig());
      return;
    }

    var summary = aggregateVisitAnalytics(items, getConfig());
    setHtml('workspace-analytics-summary', renderAnalyticsSummary(summary));
    setHtml('workspace-analytics-days', renderAnalyticsDays(summary.monthlySeries, summary.launchDateKey));
    setHtml('workspace-analytics-pages', renderAnalyticsPages(summary.topPages));
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

    var linksPromise = client
      .from(tables.links || 'workspace_links')
      .select('title,description,url,tag,sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limits.links || 6);

    var notesPromise = client
      .from(tables.notes || 'workspace_notes')
      .select('title,body,updated_at,inserted_at,pinned,sort_order')
      .eq('is_active', true)
      .order('pinned', { ascending: false })
      .order('sort_order', { ascending: true })
      .limit(limits.notes || 6);

    var visitsPromise = client
      .from(analytics.visitsTable || 'site_visits')
      .select('visited_on,visitor_token,page_path')
      .gte('visited_on', analyticsStart)
      .order('visited_on', { ascending: false })
      .limit(5000);

    var results = await Promise.all([metricsPromise, linksPromise, notesPromise, visitsPromise]);
    var metrics = results[0];
    var links = results[1];
    var notes = results[2];
    var visits = results[3];

    var metricsItems = metrics.error ? [] : (metrics.data || []);
    var linkItems = links.error ? [] : (links.data || []);
    var noteItems = notes.error ? [] : (notes.data || []);
    var analyticsSummary = visits.error ? buildZeroAnalyticsState(config) : aggregateVisitAnalytics(visits.data || [], config);

    setHtml('workspace-metrics', renderMetricCards(metricsItems, analyticsSummary, linkItems.length, noteItems.length));
    setHtml('workspace-links', renderLinks(linkItems));
    setHtml('workspace-notes', renderNotes(noteItems));

    if (visits.error) {
      renderAnalyticsEmpty(config);
      return;
    }

    setHtml('workspace-analytics-summary', renderAnalyticsSummary(analyticsSummary));
    setHtml('workspace-analytics-days', renderAnalyticsDays(analyticsSummary.monthlySeries, analyticsSummary.launchDateKey));
    setHtml('workspace-analytics-pages', renderAnalyticsPages(analyticsSummary.topPages));
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
      setStatus('Dashboard auth is not configured yet.', 'warn');
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
          setStatus('Sign in with your dashboard account.', 'neutral');
        }
        return;
      }

      if (!isAuthorized(user, config)) {
        stopIdleTracking();
        setIdentity(user, config);
        setShellMode('auth');
        setView('unauthorized');
        setStatus('This account is signed in but does not have master access.', 'error');
        return;
      }

      setIdentity(user, config);
      setShellMode('private');
      setView('dashboard');
      setStatus('Master dashboard unlocked.', 'success');
      startIdleTracking();
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
      setStatus(error && error.message ? error.message : 'Dashboard failed to load.', 'error');
    });
  });
})();
