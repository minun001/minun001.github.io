insert into public.workspace_dashboard_metrics (label, value, context, sort_order)
values
  ('Active Projects', '3', 'Current private research programs', 10),
  ('Draft Papers', '2', 'Internal manuscript lines in progress', 20),
  ('Pending Reviews', '4', 'Private items awaiting follow-up', 30),
  ('Next Deadline', 'Apr 30', 'Nearest internal milestone', 40)
on conflict do nothing;

insert into public.workspace_links (title, description, url, tag, sort_order)
values
  (
    'Private Drive',
    'Working files, drafts, and supporting material.',
    'https://example.com/private-drive',
    'Open Drive',
    10
  ),
  (
    'Research Board',
    'Internal planning board for active projects.',
    'https://example.com/research-board',
    'Open Board',
    20
  ),
  (
    'Lab Notes',
    'Private dashboard for meeting notes and checkpoints.',
    'https://example.com/lab-notes',
    'Open Notes',
    30
  )
on conflict do nothing;

insert into public.workspace_notes (title, body, pinned, sort_order)
values
  (
    'This week',
    'Finalize the dashboard auth connection, confirm master-only access, and replace placeholder links with real private URLs.',
    true,
    10
  ),
  (
    'Publication follow-up',
    'Prepare internal notes for the IEEE T-ITS line and gather material for the next presentation update.',
    false,
    20
  ),
  (
    'Safety monitoring',
    'Keep the latest experiment summary and deployment checklist in this private note area instead of the public site.',
    false,
    30
  )
on conflict do nothing;
