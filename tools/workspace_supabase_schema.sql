create or replace function public.is_master_workspace_user()
returns boolean
language sql
stable
as $$
  select
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'master', false)
    or lower(coalesce(auth.jwt() ->> 'email', '')) = '<workspace-master-email>'
    or lower(coalesce(auth.jwt() ->> 'sub', '')) = '<workspace-master-user-id>';
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

create table if not exists public.workspace_server_targets (
  alias text primary key,
  label text not null,
  ssh_alias text,
  root_label text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  inserted_at timestamptz not null default now()
);

create table if not exists public.workspace_server_snapshots (
  server_alias text primary key references public.workspace_server_targets(alias) on delete cascade,
  status text not null default 'live',
  error_message text,
  generated_at timestamptz not null default now(),
  host text,
  uptime text,
  cpu_usage_percent numeric,
  cpu_model text,
  logical_cores integer,
  load_average jsonb,
  memory_used_mb numeric,
  memory_total_mb numeric,
  memory_usage_percent numeric,
  disk_used_text text,
  disk_percent numeric,
  gpu_count integer,
  gpu_avg_usage_percent numeric,
  gpu_payload jsonb,
  gpu_processes jsonb,
  top_processes jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_visits (
  id bigint generated always as identity primary key,
  visited_on date not null default (timezone('Asia/Seoul', now()))::date,
  visitor_token text not null,
  page_path text not null,
  page_title text,
  referrer_host text,
  inserted_at timestamptz not null default now(),
  unique (visited_on, visitor_token, page_path)
);

create or replace function public.record_site_visit(
  p_visitor_token text,
  p_page_path text,
  p_page_title text default null,
  p_referrer_host text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_token text := left(trim(coalesce(p_visitor_token, '')), 96);
  normalized_path text := left(trim(coalesce(p_page_path, '/')), 180);
  normalized_title text := left(nullif(trim(coalesce(p_page_title, '')), ''), 240);
  normalized_referrer text := left(nullif(trim(coalesce(p_referrer_host, '')), ''), 160);
begin
  if normalized_token = '' then
    return;
  end if;

  if normalized_path = '' then
    normalized_path := '/';
  end if;

  insert into public.site_visits (
    visited_on,
    visitor_token,
    page_path,
    page_title,
    referrer_host
  )
  values (
    (timezone('Asia/Seoul', now()))::date,
    normalized_token,
    normalized_path,
    normalized_title,
    normalized_referrer
  )
  on conflict (visited_on, visitor_token, page_path) do update
  set
    page_title = coalesce(excluded.page_title, public.site_visits.page_title),
    referrer_host = coalesce(excluded.referrer_host, public.site_visits.referrer_host);
end;
$$;

alter table public.workspace_dashboard_metrics enable row level security;
alter table public.workspace_links enable row level security;
alter table public.workspace_notes enable row level security;
alter table public.workspace_server_targets enable row level security;
alter table public.workspace_server_snapshots enable row level security;
alter table public.site_visits enable row level security;

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

drop policy if exists "master can read workspace server targets" on public.workspace_server_targets;
create policy "master can read workspace server targets"
on public.workspace_server_targets
for select
to authenticated
using (public.is_master_workspace_user());

drop policy if exists "master can manage workspace server targets" on public.workspace_server_targets;
create policy "master can manage workspace server targets"
on public.workspace_server_targets
for all
to authenticated
using (public.is_master_workspace_user())
with check (public.is_master_workspace_user());

drop policy if exists "master can read workspace server snapshots" on public.workspace_server_snapshots;
create policy "master can read workspace server snapshots"
on public.workspace_server_snapshots
for select
to authenticated
using (public.is_master_workspace_user());

drop policy if exists "master can manage workspace server snapshots" on public.workspace_server_snapshots;
create policy "master can manage workspace server snapshots"
on public.workspace_server_snapshots
for all
to authenticated
using (public.is_master_workspace_user())
with check (public.is_master_workspace_user());

drop policy if exists "master can read site visits" on public.site_visits;
create policy "master can read site visits"
on public.site_visits
for select
to authenticated
using (public.is_master_workspace_user());

drop policy if exists "master can manage site visits" on public.site_visits;
create policy "master can manage site visits"
on public.site_visits
for all
to authenticated
using (public.is_master_workspace_user())
with check (public.is_master_workspace_user());

grant execute on function public.record_site_visit(text, text, text, text) to anon;
grant execute on function public.record_site_visit(text, text, text, text) to authenticated;
