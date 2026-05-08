window.WORKSPACE_AUTH_CONFIG = {
  provider: 'remote-helper',
  sectionName: 'Workspace',
  session: {
    idleMinutes: 180
  },
  analytics: {
    visitsTable: 'site_visits',
    days: 14,
    launchDate: '2025-11-14'
  },
  serverRefresh: {
    endpoint: '/refresh'
  },
  localAuth: {
    helperBaseUrl: '',
    sessionEndpoint: '/local-auth/session',
    loginEndpoint: '/local-auth/login',
    logoutEndpoint: '/local-auth/logout'
  },
  dataFiles: {
    content: '/tools/workspace_content.json',
    serverSignals: '/tools/workspace_server_sync_fallback.json',
    siteSignals: '/tools/workspace_site_signals.json'
  },
  tables: {
    dashboard: 'workspace_dashboard_metrics',
    links: 'workspace_links',
    notes: 'workspace_notes',
    serverTargets: 'workspace_server_targets',
    serverSnapshots: 'workspace_server_snapshots'
  },
  limits: {
    dashboard: 4,
    links: 6,
    notes: 6,
    servers: 12
  }
};
