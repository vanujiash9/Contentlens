alter table public.research_plans
  add column if not exists target_keyword text,
  add column if not exists search_intent text,
  add column if not exists audience text,
  add column if not exists notes jsonb not null default '[]'::jsonb;

create or replace function public.set_research_plan_workspace_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.workspace_id is null then
    select workspace_id into new.workspace_id
    from public.topics
    where id = new.topic_id;
  end if;
  return new;
end;
$$;

drop trigger if exists research_plans_set_workspace_id on public.research_plans;
create trigger research_plans_set_workspace_id
  before insert or update on public.research_plans
  for each row execute function public.set_research_plan_workspace_id();

create table if not exists public.research_search_queries (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  query text not null,
  result_count integer not null default 0 check (result_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.research_sources (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  query_id uuid references public.research_search_queries(id) on delete set null,
  title text not null,
  url text not null check (url ~* '^https?://'),
  domain text,
  rank integer check (rank is null or rank > 0),
  snippet text,
  status text not null default 'pending' check (status in ('pending', 'fetched', 'failed')),
  extracted_text text,
  error_message text,
  created_at timestamptz not null default now(),
  fetched_at timestamptz
);

create table if not exists public.research_findings (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  claim text not null,
  finding_type text not null,
  source_ids uuid[] not null default '{}'::uuid[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.research_information_gaps (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  description text not null,
  recommendation text,
  created_at timestamptz not null default now()
);

create table if not exists public.research_opportunities (
  topic_id uuid primary key references public.topics(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  priority public.priority_level not null,
  recommendation text not null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists research_search_queries_topic_created_idx
  on public.research_search_queries(topic_id, created_at);

create index if not exists research_sources_topic_rank_idx
  on public.research_sources(topic_id, rank);

create index if not exists research_findings_topic_created_idx
  on public.research_findings(topic_id, created_at);

create index if not exists research_information_gaps_topic_created_idx
  on public.research_information_gaps(topic_id, created_at);

alter table public.research_search_queries enable row level security;
alter table public.research_sources enable row level security;
alter table public.research_findings enable row level security;
alter table public.research_information_gaps enable row level security;
alter table public.research_opportunities enable row level security;

create policy research_search_queries_member_all on public.research_search_queries
  for all using (
    exists (
      select 1 from public.topics
      where topics.id = research_search_queries.topic_id
      and public.is_workspace_member(topics.workspace_id)
    )
  ) with check (
    exists (
      select 1 from public.topics
      where topics.id = research_search_queries.topic_id
      and public.is_workspace_member(topics.workspace_id)
    )
  );

create policy research_sources_member_all on public.research_sources
  for all using (
    exists (
      select 1 from public.topics
      where topics.id = research_sources.topic_id
      and public.is_workspace_member(topics.workspace_id)
    )
  ) with check (
    exists (
      select 1 from public.topics
      where topics.id = research_sources.topic_id
      and public.is_workspace_member(topics.workspace_id)
    )
  );

create policy research_findings_member_all on public.research_findings
  for all using (
    exists (
      select 1 from public.topics
      where topics.id = research_findings.topic_id
      and public.is_workspace_member(topics.workspace_id)
    )
  ) with check (
    exists (
      select 1 from public.topics
      where topics.id = research_findings.topic_id
      and public.is_workspace_member(topics.workspace_id)
    )
  );

create policy research_information_gaps_member_all on public.research_information_gaps
  for all using (
    exists (
      select 1 from public.topics
      where topics.id = research_information_gaps.topic_id
      and public.is_workspace_member(topics.workspace_id)
    )
  ) with check (
    exists (
      select 1 from public.topics
      where topics.id = research_information_gaps.topic_id
      and public.is_workspace_member(topics.workspace_id)
    )
  );

create policy research_opportunities_member_all on public.research_opportunities
  for all using (
    exists (
      select 1 from public.topics
      where topics.id = research_opportunities.topic_id
      and public.is_workspace_member(topics.workspace_id)
    )
  ) with check (
    exists (
      select 1 from public.topics
      where topics.id = research_opportunities.topic_id
      and public.is_workspace_member(topics.workspace_id)
    )
  );

grant select, insert, update, delete on public.research_search_queries to authenticated;
grant select, insert, update, delete on public.research_sources to authenticated;
grant select, insert, update, delete on public.research_findings to authenticated;
grant select, insert, update, delete on public.research_information_gaps to authenticated;
grant select, insert, update, delete on public.research_opportunities to authenticated;

grant all on public.research_search_queries to service_role;
grant all on public.research_sources to service_role;
grant all on public.research_findings to service_role;
grant all on public.research_information_gaps to service_role;
grant all on public.research_opportunities to service_role;
