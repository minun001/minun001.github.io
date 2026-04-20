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

  async function boot() {
    var config = getConfig();
    var form = byId('workspace-login-form');
    var signOut = byId('workspace-signout');
    var emailInput = byId('workspace-email');
    var passwordInput = byId('workspace-password');

    if (!hasSupabaseConfig(config)) {
      setView('setup');
      setStatus('Workspace auth is not configured yet.', 'warn');
      return;
    }

    if (!window.supabase || !window.supabase.createClient) {
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
        setView('login');
        setStatus('Sign in with your workspace account.', 'neutral');
        return;
      }

      if (!isAuthorized(user, config)) {
        setIdentity(user);
        setView('unauthorized');
        setStatus('This account is signed in but does not have master access.', 'error');
        return;
      }

      setIdentity(user);
      setView('dashboard');
      setStatus('Master workspace unlocked.', 'success');
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
          setStatus(result.error.message || 'Unable to sign in.', 'error');
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
      setView('setup');
      setStatus(error && error.message ? error.message : 'Workspace failed to load.', 'error');
    });
  });
})();
