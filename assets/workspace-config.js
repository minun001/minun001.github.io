window.WORKSPACE_AUTH_CONFIG = {
  provider: 'supabase',
  supabaseUrl: 'https://brwilcezyrtlpmcokmlo.supabase.co',
  supabaseAnonKey: 'sb_publishable_eEjPLgWLIYFIOf7C4HUgxg_LPcFvPKx',
  requiredRole: 'master',
  masterUserId: '75145b9d-eece-4dc5-9d50-f5cf92e0eaf2',
  sectionName: 'Workspace',
  session: {
    idleMinutes: 3
  },
  analytics: {
    visitsTable: 'site_visits',
    days: 14,
    launchDate: '2025-11-14'
  },
  serverRefresh: {
    endpoint: 'http://127.0.0.1:8765/refresh'
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
