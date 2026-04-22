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
    'Drafts, slides, figures, and supporting working files for active projects. Use this as the first stop when a manuscript, presentation, or experiment asset needs to be updated quickly.',
    'https://drive.google.com/',
    'Open Drive',
    10
  ),
  (
    'Reading Queue',
    'Paper shortlist, writing prompts, and the next reading stack. This queue should hold the references that are worth revisiting before the next publication or presentation update.',
    'https://www.notion.so/',
    'Open Queue',
    20
  ),
  (
    'Scholar Profile',
    'Citation cross-checks and publication metadata reference. Use it when publication counts, venue details, or profile-facing updates need a quick verification pass.',
    'https://scholar.google.com/citations?user=2AUQlE8AAAAJ&hl=en',
    'Open Scholar',
    30
  ),
  (
    'Research Board',
    'Planning board for active tracks, milestones, and follow-ups. This is the private coordination surface for deciding what to write, revise, or present next.',
    'https://trello.com/',
    'Open Board',
    40
  )
on conflict do nothing;

insert into public.workspace_notes (title, body, pinned, sort_order)
values
  (
    'Current focus',
    'Keep the private workspace aligned with active writing, short research notes, and the next set of publication follow-ups. The goal is to make this page useful as a daily checkpoint rather than a passive archive. Use it to capture what is active now, what needs revision next, and what should stay off the public site until it is ready.',
    true,
    10
  ),
  (
    'Writing queue',
    'Refresh manuscript notes for the mobility and energy lines, then consolidate the next revision checklist in one place. Keep the open questions, missing figures, and reviewer-facing tasks here so the current writing context is visible at a glance.',
    false,
    20
  ),
  (
    'Research ops',
    'Track slide updates, reading backlog, and small internal reminders here instead of scattering them across public pages. This note should work like a lightweight operations log for the parts of research work that are active but not publishable yet.',
    false,
    30
  ),
  (
    'Next review',
    'Use this workspace as the quick checkpoint before updating publications, news, or analytics-facing content. Review what changed privately first, then move only the stable parts into the public-facing sections.',
    false,
    40
  )
on conflict do nothing;
