(function () {
  function getConfig() {
    return window.WORKSPACE_AUTH_CONFIG || {};
  }

  function getWorkspaceEmail() {
    var emailInput = byId('workspace-email');
    return emailInput && emailInput.value ? String(emailInput.value).trim() : '';
  }

  function getMasterEmail(config) {
    return String((config && config.masterEmail) || 'master-account@private.local').trim().toLowerCase();
  }

  function getMasterUserId(config) {
    return String((config && config.masterUserId) || '').trim().toLowerCase();
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
    if (email) email.textContent = user && user.email ? user.email : '-';
    if (role) role.textContent = getAccessLabel(user, config);
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
    var email = user && user.email ? String(user.email).trim().toLowerCase() : '';
    var userId = user && user.id ? String(user.id).trim().toLowerCase() : '';
    var masterEmail = getMasterEmail(config);
    var masterUserId = getMasterUserId(config);
    return (Boolean(role) && role === requiredRole) || (Boolean(email) && email === masterEmail) || (Boolean(userId) && userId === masterUserId);
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

  function renderMetricCards(items) {
    if (!items.length) {
      return '<div class="workspace-empty">Workspace metrics will appear here once your data is connected.</div>';
    }

    return items.map(function (item) {
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
      return '<div class="workspace-empty">Saved links will appear here once they are added.</div>';
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
      return '<div class="workspace-empty">Notes will appear here once they are added.</div>';
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

  function formatAnalyticsDate(dateKey) {
    if (!dateKey) return '-';
    var date = new Date(dateKey + 'T12:00:00Z');
    if (Number.isNaN(date.getTime())) return dateKey;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getPathLabel(path) {
    var value = String(path || '/');
    if (value === '/') return 'Home';
    if (value === '/profile/') return 'Profile';
    if (value === '/publications/') return 'Publications';
    if (value === '/news/') return 'News';
    if (value === '/workspace/') return 'Workspace';
    return value.replace(/^\//, '').replace(/\/$/, '') || 'Page';
  }

  function buildZeroAnalyticsState() {
    var recentDays = [];
    for (var index = 6; index >= 0; index -= 1) {
      recentDays.push({
        dateKey: getAnalyticsDateOffset(index),
        visitors: 0,
        hits: 0
      });
    }

    return {
      todayVisitors: 0,
      yesterdayVisitors: 0,
      weeklyVisitors: 0,
      trackedPages: 0,
      recentDays: recentDays,
      topPages: [
        {
          path: '/',
          hits: 0
        }
      ]
    };
  }

  function renderAnalyticsEmpty() {
    var emptyState = buildZeroAnalyticsState();
    setHtml('workspace-analytics-summary', renderAnalyticsSummary(emptyState));
    setHtml('workspace-analytics-days', renderAnalyticsDays(emptyState.recentDays));
    setHtml('workspace-analytics-pages', renderAnalyticsPages(emptyState.topPages));
  }

  function aggregateVisitAnalytics(items) {
    var days = {};
    var pages = {};
    var todayKey = getAnalyticsDateOffset(0);
    var yesterdayKey = getAnalyticsDateOffset(1);
    var weeklyCutoff = getAnalyticsDateOffset(6);
    var weeklyTokens = {};
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

      if (dateKey >= weeklyCutoff) {
        weeklyTokens[token] = true;
      }
    });

    var dayKeys = Object.keys(days).sort().reverse();
    var recentDays = dayKeys.slice(0, 7).map(function (dateKey) {
      return {
        dateKey: dateKey,
        visitors: Object.keys(days[dateKey].tokenMap).length,
        hits: days[dateKey].hits
      };
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
      yesterdayVisitors: days[yesterdayKey] ? Object.keys(days[yesterdayKey].tokenMap).length : 0,
      weeklyVisitors: Object.keys(weeklyTokens).length,
      trackedPages: Object.keys(distinctPages).length,
      recentDays: recentDays,
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
        label: 'Yesterday',
        value: summary.yesterdayVisitors,
        detail: 'Unique visitors yesterday'
      },
      {
        label: 'Last 7 Days',
        value: summary.weeklyVisitors,
        detail: 'Unique visitors in the recent week'
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

  function renderAnalyticsDays(items) {
    if (!items.length) {
      return renderAnalyticsDays(buildZeroAnalyticsState().recentDays);
    }

    var maxVisitors = items.reduce(function (maxValue, item) {
      return Math.max(maxValue, Number(item.visitors || 0));
    }, 0) || 1;

    return (
      '<div class="workspace-chart">' +
        '<div class="workspace-chart-grid">' +
          items.slice().reverse().map(function (item) {
            var visitors = Number(item.visitors || 0);
            var height = Math.max(12, Math.round((visitors / maxVisitors) * 100));
            return (
              '<div class="workspace-chart-col">' +
                '<div class="workspace-chart-bar-wrap">' +
                  '<div class="workspace-chart-bar" style="height:' + escapeHtml(height + '%') + '" title="' + escapeHtml(item.dateKey + ': ' + visitors + ' visitors') + '">' +
                    '<span>' + escapeHtml(visitors) + '</span>' +
                  '</div>' +
                '</div>' +
                '<div class="workspace-chart-label">' + escapeHtml(formatAnalyticsDate(item.dateKey)) + '</div>' +
              '</div>'
            );
          }).join('') +
        '</div>' +
        '<div class="workspace-chart-note">Unique visitors by day across the recent tracking window.</div>' +
      '</div>'
    );
  }

  function renderAnalyticsPages(items) {
    if (!items.length) {
      return renderAnalyticsPages(buildZeroAnalyticsState().topPages);
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
      renderAnalyticsEmpty();
      return;
    }

    var summary = aggregateVisitAnalytics(items);
    setHtml('workspace-analytics-summary', renderAnalyticsSummary(summary));
    setHtml('workspace-analytics-days', renderAnalyticsDays(summary.recentDays));
    setHtml('workspace-analytics-pages', renderAnalyticsPages(summary.topPages));
  }

  async function loadWorkspaceData(client, config) {
    var tables = config.tables || {};
    var limits = config.limits || {};
    var analytics = config.analytics || {};
    var analyticsDays = Number(analytics.days || 14);
    var analyticsStart = getAnalyticsDateOffset(Math.max(analyticsDays - 1, 0));

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
      .limit(500);

    var results = await Promise.all([metricsPromise, linksPromise, notesPromise, visitsPromise]);
    var metrics = results[0];
    var links = results[1];
    var notes = results[2];
    var visits = results[3];

    if (metrics.error || links.error || notes.error) {
      throw new Error('Private content tables are not ready yet.');
    }

    setHtml('workspace-metrics', renderMetricCards(metrics.data || []));
    setHtml('workspace-links', renderLinks(links.data || []));
    setHtml('workspace-notes', renderNotes(notes.data || []));

    if (visits.error) {
      renderAnalyticsEmpty();
      return;
    }

    renderVisitorAnalytics(visits.data || []);
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

    async function applySession(session) {
      var user = session && session.user ? session.user : null;
      if (!user) {
        setIdentity(null, config);
        setShellMode('auth');
        setView('login');
        setConfirmationAction(false);
        setStatus('Sign in with your workspace account.', 'neutral');
        return;
      }

      if (!isAuthorized(user, config)) {
        setIdentity(user, config);
        setShellMode('auth');
        setView('unauthorized');
        setStatus('This account is signed in but does not have master access.', 'error');
        return;
      }

      setIdentity(user, config);
      setShellMode('private');
      setView('dashboard');
      setStatus('Master workspace unlocked.', 'success');
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
            setStatus('Verification email sent. Open the message sent to master-account@private.local, confirm the account, then sign in again.', 'warn');
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
