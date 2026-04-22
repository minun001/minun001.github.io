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
    'Research Drive',
    'Drafts, slides, figures, and supporting working files.',
    'https://drive.google.com/',
    'Open Drive',
    10
  ),
  (
    'Reading Queue',
    'Paper shortlist, writing prompts, and the next reading stack.',
    'https://www.notion.so/',
    'Open Queue',
    20
  ),
  (
    'Scholar Profile',
    'Citation cross-checks and publication metadata reference.',
    'https://scholar.google.com/citations?user=2AUQlE8AAAAJ&hl=en',
    'Open Scholar',
    30
  ),
  (
    'Research Board',
    'Planning board for active tracks, milestones, and follow-ups.',
    'https://trello.com/',
    'Open Board',
    40
  )
on conflict do nothing;

insert into public.workspace_notes (title, body, pinned, sort_order)
values
  (
    'Current focus',
    'Keep the private workspace aligned with active writing, short research notes, and the next set of publication follow-ups.',
    true,
    10
  ),
  (
    'Writing queue',
    'Refresh manuscript notes for the mobility and energy lines, then consolidate the next revision checklist in one place.',
    false,
    20
  ),
  (
    'Research ops',
    'Track slide updates, reading backlog, and small internal reminders here instead of scattering them across public pages.',
    false,
    30
  ),
  (
    'Next review',
    'Use this pinned workspace as the quick checkpoint before updating publications, news, or analytics-facing content.',
    false,
    40
  )
on conflict do nothing;
