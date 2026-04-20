create or replace function public.is_master_workspace_user()
returns boolean
language sql
stable
as $$
  select
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'master', false)
    or lower(coalesce(auth.jwt() ->> 'email', '')) = 'master-account@private.local';
$$;

create table if not exists public.workspace_dashboard_metrics (
  id bigint generated always as identity primary key,
  label text not null,
  value text not null,
  context text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  inserted_at timestamptz not null default now()
);

create table if not exists public.workspace_links (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  url text not null,
  tag text default 'Open',
  sort_order integer not null default 100,
  is_active boolean not null default true,
  inserted_at timestamptz not null default now()
);

create table if not exists public.workspace_notes (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null,
  pinned boolean not null default false,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workspace_dashboard_metrics enable row level security;
alter table public.workspace_links enable row level security;
alter table public.workspace_notes enable row level security;

drop policy if exists "master can read workspace dashboard metrics" on public.workspace_dashboard_metrics;
create policy "master can read workspace dashboard metrics"
on public.workspace_dashboard_metrics
for select
to authenticated
using (public.is_master_workspace_user());

drop policy if exists "master can manage workspace dashboard metrics" on public.workspace_dashboard_metrics;
create policy "master can manage workspace dashboard metrics"
on public.workspace_dashboard_metrics
for all
to authenticated
using (public.is_master_workspace_user())
with check (public.is_master_workspace_user());

drop policy if exists "master can read workspace links" on public.workspace_links;
create policy "master can read workspace links"
on public.workspace_links
for select
to authenticated
using (public.is_master_workspace_user());

drop policy if exists "master can manage workspace links" on public.workspace_links;
create policy "master can manage workspace links"
on public.workspace_links
for all
to authenticated
using (public.is_master_workspace_user())
with check (public.is_master_workspace_user());

drop policy if exists "master can read workspace notes" on public.workspace_notes;
create policy "master can read workspace notes"
on public.workspace_notes
for select
to authenticated
using (public.is_master_workspace_user());

drop policy if exists "master can manage workspace notes" on public.workspace_notes;
create policy "master can manage workspace notes"
on public.workspace_notes
for all
to authenticated
using (public.is_master_workspace_user())
with check (public.is_master_workspace_user());
