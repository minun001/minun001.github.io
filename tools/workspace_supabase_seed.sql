-- Starter bootstrap content for the private workspace.
-- For repo-managed recovery after the first setup, prefer tools/workspace_content.json
-- together with tools/workspace_content_sync.py.

with metric_seed (label, value, context, sort_order) as (
  values
    ('Active Projects', '3', 'Current private research programs', 10),
    ('Draft Papers', '2', 'Internal manuscript lines in progress', 20),
    ('Pending Reviews', '4', 'Private items awaiting follow-up', 30),
    ('Next Deadline', 'Apr 30', 'Nearest internal milestone', 40)
)
insert into public.workspace_dashboard_metrics (label, value, context, sort_order)
select seed.label, seed.value, seed.context, seed.sort_order
from metric_seed as seed
where not exists (
  select 1
  from public.workspace_dashboard_metrics as existing
  where existing.label = seed.label
);

with link_seed (title, description, url, tag, sort_order) as (
  values
    (
      'Research Drive',
      'Drafts, slides, figures, and working files for active projects. Use this as the first stop when a manuscript, presentation, or experiment asset needs a quick update.',
      'https://drive.google.com/',
      'Open Drive',
      10
    ),
    (
      'Reading Queue',
      'Paper shortlist, writing prompts, and the next reading stack. Keep the references here that are worth revisiting before the next publication or presentation pass.',
      'https://www.notion.so/',
      'Open Queue',
      20
    ),
    (
      'Scholar Profile',
      'Citation cross-checks and publication metadata reference. Use it when counts, venue details, or profile-facing updates need a fast verification pass.',
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
)
insert into public.workspace_links (title, description, url, tag, sort_order)
select seed.title, seed.description, seed.url, seed.tag, seed.sort_order
from link_seed as seed
where not exists (
  select 1
  from public.workspace_links as existing
  where existing.title = seed.title
);

with note_seed (title, body, pinned, sort_order) as (
  values
    (
      'Current focus',
      'Keep the private workspace aligned with active writing, short research notes, and the next set of publication follow-ups. Use it as a daily checkpoint for what is active now, what needs revision next, and what should stay off the public site until it is ready.',
      true,
      10
    ),
    (
      'Writing queue',
      'Refresh manuscript notes for the mobility and energy lines, then consolidate the next revision checklist in one place. Keep the missing figures, open questions, and reviewer-facing tasks visible without scattering them across public pages.',
      false,
      20
    ),
    (
      'Research ops',
      'Track slide updates, reading backlog, and small internal reminders here instead of scattering them across public pages. This note should stay lightweight and useful as a running operations log for work that is active but not yet publishable.',
      false,
      30
    ),
    (
      'Next review',
      'Use this workspace as the quick checkpoint before updating publications, news, or analytics-facing content. Review what changed privately first, then move only the stable parts into the public-facing sections.',
      false,
      40
    )
)
insert into public.workspace_notes (title, body, pinned, sort_order)
select seed.title, seed.body, seed.pinned, seed.sort_order
from note_seed as seed
where not exists (
  select 1
  from public.workspace_notes as existing
  where existing.title = seed.title
);
