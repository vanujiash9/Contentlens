create extension if not exists "pgcrypto";

create type public.workspace_role as enum ('owner', 'admin', 'member');
create type public.topic_status as enum ('pending', 'processing', 'completed', 'failed');
create type public.topic_source as enum ('user', 'ai');
create type public.priority_level as enum ('high', 'medium', 'low');
create type public.confidence_level as enum ('high', 'medium', 'low');
create type public.source_type as enum ('official', 'review', 'article', 'forum', 'product', 'comparison');
create type public.brief_status as enum ('draft', 'pending_review', 'approved', 'revision_requested');
create type public.job_status as enum ('pending', 'processing', 'completed', 'failed');
create type public.activity_type as enum ('topic_created', 'research_started', 'research_completed', 'brief_created', 'brief_approved', 'discovery_completed');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 240),
  status public.topic_status not null default 'pending',
  source public.topic_source not null default 'user',
  opportunity_score integer check (opportunity_score between 0 and 100),
  priority public.priority_level,
  research_progress integer not null default 0 check (research_progress between 0 and 100),
  current_step text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  version integer not null default 1,
  unique (id, workspace_id),
  check ((status = 'completed' and completed_at is not null) or status <> 'completed')
);

create table public.research_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  topic_id uuid not null,
  objective text not null,
  approach text,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (topic_id),
  foreign key (topic_id, workspace_id) references public.topics(id, workspace_id) on delete cascade
);

create table public.search_queries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  topic_id uuid not null,
  query text not null,
  results_count integer not null default 0 check (results_count >= 0),
  status public.job_status not null default 'pending',
  created_at timestamptz not null default now(),
  foreign key (topic_id, workspace_id) references public.topics(id, workspace_id) on delete cascade
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  topic_id uuid not null,
  url text not null check (url ~* '^https?://'),
  title text not null,
  domain text,
  type public.source_type not null,
  relevance integer not null default 0 check (relevance between 0 and 100),
  published_date date,
  extracted_info text,
  created_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (topic_id, workspace_id) references public.topics(id, workspace_id) on delete cascade
);

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  topic_id uuid not null,
  claim text not null,
  confidence public.confidence_level not null default 'medium',
  created_at timestamptz not null default now(),
  foreign key (topic_id, workspace_id) references public.topics(id, workspace_id) on delete cascade,
  unique (id, workspace_id)
);

create table public.finding_sources (
  workspace_id uuid not null,
  finding_id uuid not null,
  source_id uuid not null,
  primary key (finding_id, source_id),
  foreign key (finding_id, workspace_id) references public.findings(id, workspace_id) on delete cascade,
  foreign key (source_id, workspace_id) references public.sources(id, workspace_id) on delete cascade
);

create table public.information_gaps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  topic_id uuid not null,
  title text not null,
  description text,
  importance public.priority_level not null default 'medium',
  evidence text,
  created_at timestamptz not null default now(),
  foreign key (topic_id, workspace_id) references public.topics(id, workspace_id) on delete cascade
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  topic_id uuid not null,
  score integer not null check (score between 0 and 100),
  priority public.priority_level not null,
  recommendation text,
  angle text,
  audience text,
  reasons jsonb not null default '[]'::jsonb,
  breakdown jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (topic_id),
  foreign key (topic_id, workspace_id) references public.topics(id, workspace_id) on delete cascade
);

create table public.content_briefs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  topic_id uuid not null,
  title text not null,
  search_intent text,
  target_audience text,
  objective text,
  angle text,
  key_questions jsonb not null default '[]'::jsonb,
  outline jsonb not null default '[]'::jsonb,
  key_facts jsonb not null default '[]'::jsonb,
  draft text,
  must_cover jsonb not null default '[]'::jsonb,
  must_avoid jsonb not null default '[]'::jsonb,
  evidence_map jsonb not null default '[]'::jsonb,
  review_status public.brief_status not null default 'draft',
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  word_count integer not null default 0 check (word_count >= 0),
  sources_used integer not null default 0 check (sources_used >= 0),
  total_claims integer not null default 0 check (total_claims >= 0),
  cited_claims integer not null default 0 check (cited_claims >= 0 and cited_claims <= total_claims),
  quality_checks jsonb not null default '[]'::jsonb,
  quality_warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  unique (topic_id),
  foreign key (topic_id, workspace_id) references public.topics(id, workspace_id) on delete cascade,
  check ((review_status = 'approved' and approved_at is not null) or review_status <> 'approved')
);

create table public.brief_revision_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  brief_id uuid not null references public.content_briefs(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  request text not null check (char_length(trim(request)) between 1 and 4000),
  status public.job_status not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.discovery_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  industry text,
  market text,
  period text,
  result_count integer not null default 10 check (result_count between 1 and 100),
  auto_add boolean not null default false,
  status public.job_status not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.discovered_topics (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  discovery_run_id uuid references public.discovery_runs(id) on delete set null,
  title text not null,
  opportunity_score integer not null check (opportunity_score between 0 and 100),
  priority public.priority_level not null,
  angle text,
  reasoning text,
  search_signals jsonb not null default '{}'::jsonb,
  content_gap jsonb not null default '{}'::jsonb,
  business_relevance jsonb not null default '{}'::jsonb,
  added_to_queue_at timestamptz,
  topic_id uuid,
  created_at timestamptz not null default now(),
  foreign key (topic_id, workspace_id) references public.topics(id, workspace_id) on delete set null (topic_id)
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  type public.activity_type not null,
  topic_id uuid,
  topic_title text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (topic_id, workspace_id) references public.topics(id, workspace_id) on delete set null (topic_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if tg_table_name in ('topics', 'content_briefs') then
    new.version = old.version + 1;
  end if;
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger workspaces_set_updated_at before update on public.workspaces for each row execute function public.set_updated_at();
create trigger topics_set_updated_at before update on public.topics for each row execute function public.set_updated_at();
create trigger content_briefs_set_updated_at before update on public.content_briefs for each row execute function public.set_updated_at();

create index topics_workspace_status_idx on public.topics(workspace_id, status);
create index topics_workspace_updated_idx on public.topics(workspace_id, updated_at desc);
create index sources_topic_idx on public.sources(workspace_id, topic_id);
create index findings_topic_idx on public.findings(workspace_id, topic_id);
create index content_briefs_workspace_status_idx on public.content_briefs(workspace_id, review_status);
create index activity_events_workspace_created_idx on public.activity_events(workspace_id, created_at desc);
create index discovered_topics_workspace_created_idx on public.discovered_topics(workspace_id, created_at desc);

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(target_workspace_id uuid, allowed_roles public.workspace_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role = any(allowed_roles)
  );
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.topics enable row level security;
alter table public.research_plans enable row level security;
alter table public.search_queries enable row level security;
alter table public.sources enable row level security;
alter table public.findings enable row level security;
alter table public.finding_sources enable row level security;
alter table public.information_gaps enable row level security;
alter table public.opportunities enable row level security;
alter table public.content_briefs enable row level security;
alter table public.brief_revision_requests enable row level security;
alter table public.discovery_runs enable row level security;
alter table public.discovered_topics enable row level security;
alter table public.activity_events enable row level security;

create policy profiles_select_self on public.profiles for select using (user_id = auth.uid());
create policy profiles_update_self on public.profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy workspaces_select_member on public.workspaces for select using (public.is_workspace_member(id));
create policy workspaces_insert_authenticated on public.workspaces for insert with check (created_by = auth.uid());
create policy workspaces_update_admin on public.workspaces for update using (public.has_workspace_role(id, array['owner','admin']::public.workspace_role[]));

create policy workspace_members_select_member on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy workspace_members_manage_owner on public.workspace_members for all using (public.has_workspace_role(workspace_id, array['owner']::public.workspace_role[]));

create policy topics_member_all on public.topics for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy research_plans_member_all on public.research_plans for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy search_queries_member_all on public.search_queries for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy sources_member_all on public.sources for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy findings_member_all on public.findings for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy finding_sources_member_all on public.finding_sources for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy information_gaps_member_all on public.information_gaps for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy opportunities_member_all on public.opportunities for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy content_briefs_member_all on public.content_briefs for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy brief_revision_requests_member_all on public.brief_revision_requests for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy discovery_runs_member_all on public.discovery_runs for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy discovered_topics_member_all on public.discovered_topics for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy activity_events_member_all on public.activity_events for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
