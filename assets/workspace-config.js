window.WORKSPACE_AUTH_CONFIG = {
  provider: 'supabase',
  supabaseUrl: 'https://brwilcezyrtlpmcokmlo.supabase.co',
  supabaseAnonKey: 'sb_publishable_eEjPLgWLIYFIOf7C4HUgxg_LPcFvPKx',
  requiredRole: 'master',
  masterEmail: 'master-account@private.local',
  sectionName: 'Workspace',
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
