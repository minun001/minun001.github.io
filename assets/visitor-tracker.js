(function () {
  function getConfig() {
    return window.SITE_ANALYTICS_CONFIG || {};
  }

  function canTrack(config) {
    return Boolean(
      config &&
      config.supabaseUrl &&
      config.supabaseAnonKey &&
      window.supabase &&
      window.supabase.createClient &&
      window.location &&
      /^https?:$/i.test(window.location.protocol)
    );
  }

  function getTodayString(timezone) {
    var formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    var parts = formatter.formatToParts(new Date());
    var values = {};
    parts.forEach(function (part) {
      values[part.type] = part.value;
    });
    return [values.year, values.month, values.day].join('-');
  }

  function normalizePath(pathname) {
    var path = String(pathname || '/').trim();
    if (!path) return '/';
    if (!path.startsWith('/')) path = '/' + path;
    if (path !== '/' && !path.endsWith('/')) path += '/';
    return path;
  }

  function getReferrerHost() {
    if (!document.referrer) return '';
    try {
      return new URL(document.referrer).host || '';
    } catch (_error) {
      return '';
    }
  }

  function getStorageKey(config, dateKey, path) {
    return [
      String(config.storageKeyPrefix || 'hyunsik-min-site'),
      'visit',
      dateKey,
      path
    ].join(':');
  }

  function createVisitorToken() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }

    return 'visitor-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function getVisitorToken(config) {
    var storageKey = String(config.storageKeyPrefix || 'hyunsik-min-site') + ':visitor-token';
    var token = '';

    try {
      token = window.localStorage.getItem(storageKey) || '';
      if (!token) {
        token = createVisitorToken();
        window.localStorage.setItem(storageKey, token);
      }
    } catch (_error) {
      token = createVisitorToken();
    }

    return token;
  }

  async function recordVisit() {
    var config = getConfig();
    if (!canTrack(config)) return;

    var today = getTodayString(config.timezone);
    var pagePath = normalizePath(window.location.pathname);
    var storageKey = getStorageKey(config, today, pagePath);

    try {
      if (window.localStorage.getItem(storageKey)) {
        return;
      }
    } catch (_error) {
      // Continue even when storage is unavailable.
    }

    var client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    var result = await client.rpc(String(config.rpcFunction || 'record_site_visit'), {
      p_visitor_token: getVisitorToken(config),
      p_page_path: pagePath,
      p_page_title: document.title || '',
      p_referrer_host: getReferrerHost()
    });

    if (result.error) return;

    try {
      window.localStorage.setItem(storageKey, new Date().toISOString());
    } catch (_error) {
      // Ignore storage errors after a successful record.
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    recordVisit().catch(function () {
      // Keep tracking failures silent for the public site.
    });
  });
})();
