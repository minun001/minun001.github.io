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
  serverFallback: {
    targets: [
      { alias: 'sch-gpu-9', label: 'GPU Server 9', ssh_alias: '', root_label: '', sort_order: 10, is_active: true },
      { alias: 'sch-gpu-15', label: 'GPU Server 15', ssh_alias: '', root_label: '', sort_order: 20, is_active: true },
      { alias: 'sch-gpu-30', label: 'GPU Server 30', ssh_alias: '', root_label: '', sort_order: 30, is_active: true },
      { alias: 'sch-user-71', label: 'Server 71', ssh_alias: '', root_label: '', sort_order: 40, is_active: true },
      { alias: 'sch-user-72', label: 'Server 72', ssh_alias: '', root_label: '', sort_order: 50, is_active: true },
      { alias: 'sch-gpu-sail', label: 'GPU Server SAIL', ssh_alias: '', root_label: '', sort_order: 60, is_active: true },
      { alias: 'sch-min-hs-74', label: 'GPU Server 74', ssh_alias: '', root_label: '', sort_order: 70, is_active: true },
      { alias: 'sch-user-135', label: 'GPU Server 135', ssh_alias: '', root_label: '', sort_order: 80, is_active: true }
    ],
    snapshots: [
      {
        server_alias: 'sch-gpu-9',
        status: 'live',
        error_message: null,
        generated_at: '2026-04-23T15:54:21.027292Z',
        host: '',
        uptime: 'up 17 weeks, 3 days, 6 hours, 45 minutes',
        cpu_usage_percent: 0.5,
        cpu_model: '12th Gen Intel(R) Core(TM) i7-12700F',
        logical_cores: 20,
        load_average: { one: 0.05, five: 0.03, fifteen: 0.0 },
        memory_used_mb: 4791.6,
        memory_total_mb: 31930.9,
        memory_usage_percent: 15.0,
        disk_used_text: '143G used of 457G (33%)',
        disk_percent: 33.0,
        gpu_count: 1,
        gpu_avg_usage_percent: 0.0,
        gpu_payload: [
          {
            name: 'NVIDIA GeForce RTX 4070',
            temperature_c: '44',
            utilization_percent: 0.0,
            memory_total_mb: 12282.0,
            memory_used_mb: 112.0,
            memory_percent: 0.9
          }
        ],
        gpu_processes: [],
        top_processes: [],
        updated_at: '2026-04-23T15:54:20.965066Z'
      },
      {
        server_alias: 'sch-gpu-15',
        status: 'live',
        error_message: null,
        generated_at: '2026-04-23T15:54:21.512049Z',
        host: '',
        uptime: 'up 20 weeks, 1 day, 9 hours, 29 minutes',
        cpu_usage_percent: 46.6,
        cpu_model: '12th Gen Intel(R) Core(TM) i7-12700F',
        logical_cores: 20,
        load_average: { one: 9.67, five: 8.44, fifteen: 8.63 },
        memory_used_mb: 22279.5,
        memory_total_mb: 31930.9,
        memory_usage_percent: 69.8,
        disk_used_text: '149G used of 457G (35%)',
        disk_percent: 35.0,
        gpu_count: 1,
        gpu_avg_usage_percent: 0.0,
        gpu_payload: [
          {
            name: 'NVIDIA GeForce RTX 4070',
            temperature_c: '44',
            utilization_percent: 0.0,
            memory_total_mb: 12282.0,
            memory_used_mb: 12.0,
            memory_percent: 0.1
          }
        ],
        gpu_processes: [],
        top_processes: [],
        updated_at: '2026-04-23T15:54:21.436116Z'
      },
      {
        server_alias: 'sch-gpu-30',
        status: 'live',
        error_message: null,
        generated_at: '2026-04-23T15:54:22.103231Z',
        host: '',
        uptime: 'up 13 weeks, 8 hours, 34 minutes',
        cpu_usage_percent: 0.0,
        cpu_model: '12th Gen Intel(R) Core(TM) i7-12700F',
        logical_cores: 20,
        load_average: { one: 0.01, five: 0.01, fifteen: 0.0 },
        memory_used_mb: 2181.5,
        memory_total_mb: 31930.9,
        memory_usage_percent: 6.8,
        disk_used_text: '52G used of 457G (12%)',
        disk_percent: 12.0,
        gpu_count: 1,
        gpu_avg_usage_percent: 0.0,
        gpu_payload: [
          {
            name: 'NVIDIA GeForce RTX 4070',
            temperature_c: '39',
            utilization_percent: 0.0,
            memory_total_mb: 12282.0,
            memory_used_mb: 63.0,
            memory_percent: 0.5
          }
        ],
        gpu_processes: [],
        top_processes: [],
        updated_at: '2026-04-23T15:54:22.019347Z'
      },
      {
        server_alias: 'sch-user-71',
        status: 'live',
        error_message: null,
        generated_at: '2026-04-23T15:54:22.625882Z',
        host: '',
        uptime: 'up 2 weeks, 3 days, 9 hours, 52 minutes',
        cpu_usage_percent: 0.0,
        cpu_model: 'AMD Ryzen Threadripper PRO 5995WX 64-Cores',
        logical_cores: 128,
        load_average: { one: 0.04, five: 0.04, fifteen: 0.0 },
        memory_used_mb: 8175.1,
        memory_total_mb: 515579.7,
        memory_usage_percent: 1.6,
        disk_used_text: '1.6T used of 1.8T (91%)',
        disk_percent: 91.0,
        gpu_count: 1,
        gpu_avg_usage_percent: 0.0,
        gpu_payload: [
          {
            name: 'NVIDIA GeForce RTX 4090',
            temperature_c: '27',
            utilization_percent: 0.0,
            memory_total_mb: 24564.0,
            memory_used_mb: 115.0,
            memory_percent: 0.5
          }
        ],
        gpu_processes: [],
        top_processes: [],
        updated_at: '2026-04-23T15:54:22.566401Z'
      },
      {
        server_alias: 'sch-user-72',
        status: 'live',
        error_message: null,
        generated_at: '2026-04-23T15:54:23.128694Z',
        host: '',
        uptime: 'up 4 weeks, 1 hour, 50 minutes',
        cpu_usage_percent: 0.4,
        cpu_model: 'AMD Ryzen Threadripper PRO 5965WX 24-Cores',
        logical_cores: 48,
        load_average: { one: 0.03, five: 0.01, fifteen: 0.0 },
        memory_used_mb: 7210.8,
        memory_total_mb: 257573.7,
        memory_usage_percent: 2.8,
        disk_used_text: '1.3T used of 1.8T (72%)',
        disk_percent: 72.0,
        gpu_count: 1,
        gpu_avg_usage_percent: 0.0,
        gpu_payload: [
          {
            name: 'NVIDIA GeForce RTX 4090',
            temperature_c: '30',
            utilization_percent: 0.0,
            memory_total_mb: 24564.0,
            memory_used_mb: 164.0,
            memory_percent: 0.7
          }
        ],
        gpu_processes: [],
        top_processes: [],
        updated_at: '2026-04-23T15:54:23.063748Z'
      },
      {
        server_alias: 'sch-gpu-sail',
        status: 'live',
        error_message: null,
        generated_at: '2026-04-23T15:54:23.740990Z',
        host: '',
        uptime: 'up 1 day, 2 hours',
        cpu_usage_percent: 4.5,
        cpu_model: 'AMD Ryzen Threadripper PRO 5955WX 16-Cores',
        logical_cores: 32,
        load_average: { one: 1.26, five: 1.16, fifteen: 1.1 },
        memory_used_mb: 10717.3,
        memory_total_mb: 64090.7,
        memory_usage_percent: 16.7,
        disk_used_text: '856G used of 938G (97%)',
        disk_percent: 97.0,
        gpu_count: 1,
        gpu_avg_usage_percent: 90.0,
        gpu_payload: [
          {
            name: 'NVIDIA GeForce RTX 4090',
            temperature_c: '61',
            utilization_percent: 90.0,
            memory_total_mb: 24564.0,
            memory_used_mb: 19172.0,
            memory_percent: 78.0
          }
        ],
        gpu_processes: [],
        top_processes: [],
        updated_at: '2026-04-23T15:54:23.655046Z'
      },
      {
        server_alias: 'sch-min-hs-74',
        status: 'live',
        error_message: null,
        generated_at: '2026-04-23T16:10:14.193841Z',
        host: '',
        uptime: 'up 3 weeks, 3 days, 5 hours, 1 minute',
        cpu_usage_percent: 0.8,
        cpu_model: 'AMD Ryzen Threadripper PRO 7985WX 64-Cores',
        logical_cores: 128,
        load_average: { one: 1.0, five: 1.0, fifteen: 1.0 },
        memory_used_mb: 26748.4,
        memory_total_mb: 257182.1,
        memory_usage_percent: 10.4,
        disk_used_text: '1.7T used of 1.8T (100%)',
        disk_percent: 100.0,
        gpu_count: 1,
        gpu_avg_usage_percent: 100.0,
        gpu_payload: [
          {
            name: 'NVIDIA H200 NVL',
            temperature_c: '49',
            utilization_percent: 100.0,
            memory_total_mb: 143771.0,
            memory_used_mb: 54139.0,
            memory_percent: 37.7
          }
        ],
        gpu_processes: [],
        top_processes: [],
        updated_at: '2026-04-23T16:10:14.121516Z'
      },
      {
        server_alias: 'sch-user-135',
        status: 'live',
        error_message: null,
        generated_at: '2026-04-23T16:15:41.673247Z',
        host: '',
        uptime: 'up 22 weeks, 2 days, 11 hours, 26 minutes',
        cpu_usage_percent: 0.5,
        cpu_model: 'Intel(R) Xeon(R) Gold 6230 CPU @ 2.10GHz',
        logical_cores: 80,
        load_average: { one: 0.36, five: 0.21, fifteen: 0.18 },
        memory_used_mb: 15842.7,
        memory_total_mb: 772641.2,
        memory_usage_percent: 2.1,
        disk_used_text: '831G used of 879G (100%)',
        disk_percent: 100.0,
        gpu_count: 4,
        gpu_avg_usage_percent: 0.0,
        gpu_payload: [
          {
            index: '0',
            name: 'NVIDIA A100-PCIE-40GB',
            temperature_c: '28',
            utilization_percent: 0.0,
            memory_total_mb: 40960.0,
            memory_used_mb: 13.0,
            memory_percent: 0.0,
            power_draw_w: '32.60',
            power_limit_w: '250.00'
          },
          {
            index: '1',
            name: 'NVIDIA A100-PCIE-40GB',
            temperature_c: '28',
            utilization_percent: 0.0,
            memory_total_mb: 40960.0,
            memory_used_mb: 13.0,
            memory_percent: 0.0,
            power_draw_w: '32.92',
            power_limit_w: '250.00'
          },
          {
            index: '2',
            name: 'NVIDIA A100-PCIE-40GB',
            temperature_c: '28',
            utilization_percent: 0.0,
            memory_total_mb: 40960.0,
            memory_used_mb: 13.0,
            memory_percent: 0.0,
            power_draw_w: '32.13',
            power_limit_w: '250.00'
          },
          {
            index: '3',
            name: 'NVIDIA A100-PCIE-40GB',
            temperature_c: '31',
            utilization_percent: 0.0,
            memory_total_mb: 40960.0,
            memory_used_mb: 13.0,
            memory_percent: 0.0,
            power_draw_w: '36.86',
            power_limit_w: '250.00'
          }
        ],
        gpu_processes: [],
        top_processes: [],
        updated_at: '2026-04-23T16:15:41.561471Z'
      }
    ]
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
