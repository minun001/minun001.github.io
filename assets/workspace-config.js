window.WORKSPACE_AUTH_CONFIG = {
  provider: 'supabase',
  supabaseUrl: 'https://brwilcezyrtlpmcokmlo.supabase.co',
  supabaseAnonKey: 'sb_publishable_eEjPLgWLIYFIOf7C4HUgxg_LPcFvPKx',
  requiredRole: 'master',
  masterUserId: '75145b9d-eece-4dc5-9d50-f5cf92e0eaf2',
  session: {
    idleMinutes: 3
  },
  analytics: {
    visitsTable: 'site_visits',
    days: 14,
    launchDate: '2025-11-14'
  },
  sectionName: 'Workspace',
  opsTargets: [
    {
      id: 'profile',
      title: 'Profile',
      summary: 'Intro, email, portrait.',
      previewPath: '/profile/',
      repoPaths: ['profile/index.html', '_config.yml'],
      commonTasks: [
        'Rewrite the opening introduction so it reads cleanly and reflects the current focus.',
        'Adjust how the email is exposed or copied without adding extra action boxes.',
        'Tune the portrait crop and remove small header labels that add visual noise.'
      ],
      verifyChecklist: [
        'Intro copy feels natural on desktop and mobile.',
        'Email copy behavior still works as intended.',
        'Portrait crop and top spacing look correct on the live page.'
      ]
    },
    {
      id: 'publications',
      title: 'Publications',
      summary: 'Cards, Scholar, labels.',
      previewPath: '/publications/',
      repoPaths: ['publications/index.html', 'assets/site.js'],
      commonTasks: [
        'Refine summary card labels, alignment, and short supporting notes.',
        'Move or simplify the Scholar block so it reads as secondary context.',
        'Trim lead text and clarify category wording for first-time visitors.'
      ],
      verifyChecklist: [
        'Summary cards align and wrap cleanly.',
        'Scholar placement feels natural inside the page flow.',
        'Search, counts, and BibTeX interactions still work on the live page.'
      ]
    },
    {
      id: 'news',
      title: 'News',
      summary: 'Featured strip, labels, timeline.',
      previewPath: '/news/',
      repoPaths: ['news/index.html', 'assets/site.js'],
      commonTasks: [
        'Shorten featured strip copy and remove extra helper descriptions.',
        'Clean section labels, anchors, and top-level visual noise.',
        'Keep the timeline readable without making the page feel crowded.'
      ],
      verifyChecklist: [
        'Featured items read cleanly.',
        'Filters and anchors still behave correctly.',
        'Timeline spacing and year flow look stable on the live page.'
      ]
    },
    {
      id: 'shared-shell-deploy',
      title: 'Shared Shell & Deploy',
      summary: 'Footer, nav, deploy check.',
      previewPath: '/',
      repoPaths: ['_includes/footer.html', '_config.yml', '_layouts/default.html'],
      commonTasks: [
        'Update shared footer or navigation wording without drifting across pages.',
        'Bump cache versions when workspace or public assets change.',
        'Verify the public site reflects the newest main-branch deployment.'
      ],
      verifyChecklist: [
        'Footer text is consistent across public pages.',
        'Navigation labels match the current section naming.',
        'Production responds with the expected updated markup on Home and Workspace.'
      ]
    }
  ],
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
