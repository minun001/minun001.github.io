window.WORKSPACE_AUTH_CONFIG = {
  provider: 'supabase',
  supabaseUrl: '',
  supabaseAnonKey: '',
  requiredRole: 'master',
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
