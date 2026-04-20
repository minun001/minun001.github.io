(function () {
  function getConfig() {
    return window.WORKSPACE_AUTH_CONFIG || {};
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

  function setIdentity(user) {
    var email = byId('workspace-user-email');
    var role = byId('workspace-user-role');
    if (email) email.textContent = user && user.email ? user.email : '-';
    if (role) role.textContent = resolveRole(user) || '-';
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
    return Boolean(role) && role === requiredRole;
  }

  function setHtml(id, html) {
    var node = byId(id);
    if (!node) return;
    node.innerHTML = html;
  }

  function getLoginErrorMessage(error) {
    var message = error && error.message ? String(error.message) : '';
    if (message === 'Invalid login credentials') {
      return 'Login failed. This usually means the Supabase Auth user does not exist yet or the password does not match.';
    }
    return message || 'Unable to sign in.';
  }

  function renderMetricCards(items) {
    if (!items.length) {
      return '<div class="workspace-empty">No private dashboard metrics yet.</div>';
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
      return '<div class="workspace-empty">No private links yet.</div>';
    }

    return items.map(function (item) {
      return (
        '<article class="workspace-card">' +
          '<h3>' + escapeHtml(item.title || 'Private Link') + '</h3>' +
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
      return '<div class="workspace-empty">No private notes yet.</div>';
    }

    return items.map(function (item) {
      var stamp = formatDate(item.updated_at || item.inserted_at);
      return (
        '<article class="workspace-card">' +
          '<h3>' + escapeHtml(item.title || 'Private Note') + '</h3>' +
          '<p>' + escapeHtml(item.body || '') + '</p>' +
          (stamp ? '<div class="workspace-note-meta">' + escapeHtml(stamp) + '</div>' : '') +
        '</article>'
      );
    }).join('');
  }

  async function loadWorkspaceData(client, config) {
    var tables = config.tables || {};
    var limits = config.limits || {};

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

    var results = await Promise.all([metricsPromise, linksPromise, notesPromise]);
    var metrics = results[0];
    var links = results[1];
    var notes = results[2];

    if (metrics.error || links.error || notes.error) {
      throw new Error('Private content tables are not ready yet.');
    }

    setHtml('workspace-metrics', renderMetricCards(metrics.data || []));
    setHtml('workspace-links', renderLinks(links.data || []));
    setHtml('workspace-notes', renderNotes(notes.data || []));
  }

  async function boot() {
    var config = getConfig();
    var form = byId('workspace-login-form');
    var signOut = byId('workspace-signout');
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
        setIdentity(null);
        setShellMode('auth');
        setView('login');
        setStatus('Sign in with your workspace account.', 'neutral');
        return;
      }

      if (!isAuthorized(user, config)) {
        setIdentity(user);
        setShellMode('auth');
        setView('unauthorized');
        setStatus('This account is signed in but does not have master access.', 'error');
        return;
      }

      setIdentity(user);
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

        var email = emailInput ? emailInput.value.trim() : '';
        var password = passwordInput ? passwordInput.value : '';

        var result = await client.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (result.error) {
          setStatus(getLoginErrorMessage(result.error), 'error');
          return;
        }

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
  }

  document.addEventListener('DOMContentLoaded', function () {
    boot().catch(function (error) {
      setShellMode('auth');
      setView('setup');
      setStatus(error && error.message ? error.message : 'Workspace failed to load.', 'error');
    });
  });
})();
