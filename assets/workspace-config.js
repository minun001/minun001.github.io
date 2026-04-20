window.WORKSPACE_AUTH_CONFIG = {
  provider: 'supabase',
  supabaseUrl: 'https://brwilcezyrtlpmcokmlo.supabase.co',
  supabaseAnonKey: 'sb_publishable_eEjPLgWLIYFIOf7C4HUgxg_LPcFvPKx',
  requiredRole: 'master',
  masterEmail: 'master-account@private.local',
  masterUserId: '75145b9d-eece-4dc5-9d50-f5cf92e0eaf2',
  session: {
    idleMinutes: 15
  },
  analytics: {
    visitsTable: 'site_visits',
    days: 14,
    launchDate: '2025-11-14'
  },
  sectionName: 'Dashboard',
  tables: {
    dashboard: 'workspace_dashboard_metrics',
    links: 'workspace_links',
    notes: 'workspace_notes'
  },
  limits: {
    dashboard: 4,
    links: 6,
    notes: 6
  }
};
