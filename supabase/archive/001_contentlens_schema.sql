-- ============================================================
-- ContentLens — Complete Database Schema
-- Run this in Supabase SQL Editor (once, top to bottom)
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type topic_status      as enum ('pending', 'processing', 'completed', 'failed');
create type priority_level    as enum ('high', 'medium', 'low');
create type topic_source      as enum ('user', 'ai');
create type source_type       as enum ('official', 'review', 'article', 'forum', 'product', 'comparison');
create type confidence_level  as enum ('high', 'medium', 'low');
create type domain_trust      as enum ('trusted', 'blocked', 'neutral');
create type domain_language   as enum ('vi', 'en', 'both');
create type domain_category   as enum ('review', 'forum', 'news', 'official', 'comparison', 'academic');
create type ai_run_status     as enum ('completed', 'failed', 'partial');
create type ai_step_status    as enum ('completed', 'failed', 'skipped');
create type brief_status      as enum ('draft', 'pending_review', 'approved');
create type activity_type     as enum (
  'research_done', 'topic_added', 'brief_created',
  'research_failed', 'research_started', 'ai_discovery'
);
create type user_role         as enum ('admin', 'content');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  role       user_role not null default 'content',
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- TOPICS
-- ============================================================

create table public.topics (
  id                 text primary key,
  title              text not null,
  status             topic_status not null default 'pending',
  source             topic_source not null default 'user',
  opportunity_score  int check (opportunity_score between 0 and 100),
  priority           priority_level,
  research_progress  int default 0 check (research_progress between 0 and 100),
  current_step       text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ============================================================
-- RESEARCH PLANS (1-to-1 with topics)
-- ============================================================

create table public.research_plans (
  id         uuid primary key default uuid_generate_v4(),
  topic_id   text not null unique references public.topics(id) on delete cascade,
  objective  text not null,
  approach   text,
  questions  jsonb not null default '[]',  -- string[]
  created_at timestamptz not null default now()
);

-- ============================================================
-- SEARCH QUERIES
-- ============================================================

create table public.search_queries (
  id            text primary key,
  topic_id      text not null references public.topics(id) on delete cascade,
  query         text not null,
  results_count int default 0,
  status        text not null default 'pending' check (status in ('pending', 'completed')),
  created_at    timestamptz not null default now()
);

-- ============================================================
-- DOMAINS (source registry)
-- ============================================================

create table public.domains (
  domain          text primary key,
  visit_count     int not null default 0,
  avg_relevance   int default 0 check (avg_relevance between 0 and 100),
  source_types    jsonb not null default '[]',  -- string[]
  language        domain_language not null default 'en',
  category        domain_category not null,
  trust           domain_trust not null default 'neutral',
  last_visited_at timestamptz,
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- SOURCES (web pages collected per topic)
-- ============================================================

create table public.sources (
  id             text primary key,
  topic_id       text not null references public.topics(id) on delete cascade,
  url            text not null,
  title          text not null,
  domain         text references public.domains(domain) on delete set null,
  type           source_type not null,
  relevance      int not null default 0 check (relevance between 0 and 100),
  published_date date,
  extracted_info text,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- FINDINGS / CLAIMS
-- ============================================================

create table public.findings (
  id         text primary key,
  topic_id   text not null references public.topics(id) on delete cascade,
  claim      text not null,
  confidence confidence_level not null default 'medium',
  created_at timestamptz not null default now()
);

-- Many-to-many: findings ↔ sources
create table public.finding_sources (
  finding_id text not null references public.findings(id) on delete cascade,
  source_id  text not null references public.sources(id) on delete cascade,
  primary key (finding_id, source_id)
);

-- ============================================================
-- INFORMATION GAPS
-- ============================================================

create table public.information_gaps (
  id          text primary key,
  topic_id    text not null references public.topics(id) on delete cascade,
  title       text not null,
  description text,
  importance  priority_level not null default 'medium',
  evidence    text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- OPPORTUNITIES (1-to-1 with topics)
-- ============================================================

create table public.opportunities (
  id             uuid primary key default uuid_generate_v4(),
  topic_id       text not null unique references public.topics(id) on delete cascade,
  score          int not null check (score between 0 and 100),
  priority       priority_level not null,
  recommendation text,
  angle          text,
  audience       text,
  reasons        jsonb not null default '[]',  -- string[]
  breakdown      jsonb not null default '[]',  -- { label: string; score: number }[]
  created_at     timestamptz not null default now()
);

-- ============================================================
-- CONTENT BRIEFS (1-to-1 with topics)
-- Note: ContentQuality fields merged in to avoid extra join
-- ============================================================

create table public.content_briefs (
  id              uuid primary key default uuid_generate_v4(),
  topic_id        text not null unique references public.topics(id) on delete cascade,
  title           text not null,
  search_intent   text,
  target_audience text,
  objective       text,
  angle           text,
  key_questions   jsonb not null default '[]',  -- string[]
  outline         jsonb not null default '[]',  -- { section, description }[]
  key_facts       jsonb not null default '[]',  -- string[]
  draft           text,
  must_cover      jsonb not null default '[]',  -- string[]
  must_avoid      jsonb not null default '[]',  -- string[]
  evidence_map    jsonb not null default '[]',  -- { section, claimIds[] }[]
  review_status   brief_status not null default 'draft',
  -- quality metrics (flattened from ContentQuality)
  word_count      int default 0,
  sources_used    int default 0,
  total_claims    int default 0,
  cited_claims    int default 0,
  quality_checks  jsonb not null default '[]',  -- { label, ok }[]
  quality_warnings jsonb not null default '[]', -- string[]
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- DISCOVERED TOPICS (AI-suggested, not yet in queue)
-- ============================================================

create table public.discovered_topics (
  id                  text primary key,
  title               text not null,
  opportunity_score   int not null check (opportunity_score between 0 and 100),
  priority            priority_level not null,
  angle               text,
  reasoning           text,
  search_signals      jsonb not null,        -- { score, level, source, evidence }
  content_gap         jsonb not null,
  business_relevance  jsonb not null,
  added_to_queue_at   timestamptz,           -- null = not yet added to queue
  topic_id            text references public.topics(id) on delete set null,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- ACTIVITY EVENTS
-- ============================================================

create table public.activity_events (
  id         uuid primary key default uuid_generate_v4(),
  type       activity_type not null,
  topic_title text not null,
  topic_id   text references public.topics(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- AI RUNS
-- ============================================================

create table public.ai_runs (
  id                text primary key,  -- e.g. R-10294
  topic_id          text references public.topics(id) on delete set null,
  topic_title       text not null,     -- denormalized so display works even if topic deleted
  status            ai_run_status not null,
  started_at        timestamptz not null,
  duration_seconds  numeric(8,2),
  model             text not null,
  prompt_version    text,
  sources_found     int default 0,
  sources_accepted  int default 0,
  claims_extracted  int default 0,
  claims_grounded   int default 0,
  confidence        confidence_level,
  created_at        timestamptz not null default now()
);

create table public.ai_run_steps (
  id             uuid primary key default uuid_generate_v4(),
  run_id         text not null references public.ai_runs(id) on delete cascade,
  step_order     int not null,
  label          text not null,
  status         ai_step_status not null,
  duration_ms    int default 0,
  input_summary  text,
  output_summary text
);

-- ============================================================
-- AI FEEDBACK
-- ============================================================

create table public.ai_feedback (
  id          uuid primary key default uuid_generate_v4(),
  run_id      text references public.ai_runs(id) on delete set null,
  topic_title text not null,
  thumbs      text not null check (thumbs in ('up', 'down')),
  category    text,
  comment     text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index topics_status_idx        on public.topics(status);
create index topics_priority_idx      on public.topics(priority);
create index topics_created_at_idx    on public.topics(created_at desc);

create index sources_topic_id_idx     on public.sources(topic_id);
create index sources_domain_idx       on public.sources(domain);
create index sources_relevance_idx    on public.sources(relevance desc);

create index findings_topic_id_idx    on public.findings(topic_id);
create index gaps_topic_id_idx        on public.information_gaps(topic_id);
create index queries_topic_id_idx     on public.search_queries(topic_id);

create index briefs_review_status_idx on public.content_briefs(review_status);
create index briefs_topic_id_idx      on public.content_briefs(topic_id);

create index ai_runs_topic_id_idx     on public.ai_runs(topic_id);
create index ai_runs_started_at_idx   on public.ai_runs(started_at desc);
create index ai_steps_run_id_idx      on public.ai_run_steps(run_id, step_order);
create index ai_feedback_run_id_idx   on public.ai_feedback(run_id);
create index ai_feedback_thumbs_idx   on public.ai_feedback(thumbs);

create index activity_created_at_idx  on public.activity_events(created_at desc);
create index activity_topic_id_idx    on public.activity_events(topic_id);

create index discovered_score_idx     on public.discovered_topics(opportunity_score desc);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger topics_updated_at
  before update on public.topics
  for each row execute function public.set_updated_at();

create trigger briefs_updated_at
  before update on public.content_briefs
  for each row execute function public.set_updated_at();

create trigger domains_updated_at
  before update on public.domains
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles         enable row level security;
alter table public.topics            enable row level security;
alter table public.research_plans    enable row level security;
alter table public.search_queries    enable row level security;
alter table public.domains           enable row level security;
alter table public.sources           enable row level security;
alter table public.findings          enable row level security;
alter table public.finding_sources   enable row level security;
alter table public.information_gaps  enable row level security;
alter table public.opportunities     enable row level security;
alter table public.content_briefs    enable row level security;
alter table public.discovered_topics enable row level security;
alter table public.activity_events   enable row level security;
alter table public.ai_runs           enable row level security;
alter table public.ai_run_steps      enable row level security;
alter table public.ai_feedback       enable row level security;

-- Helper: get role of current user
create or replace function public.current_role()
returns user_role language sql security definer stable as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Content tables: all authenticated users can read/write
do $$ declare t text; begin
  foreach t in array array[
    'topics', 'research_plans', 'search_queries', 'domains', 'sources',
    'findings', 'finding_sources', 'information_gaps', 'opportunities',
    'content_briefs', 'discovered_topics', 'activity_events'
  ] loop
    execute format('create policy "%s_auth_select" on public.%I for select to authenticated using (true)', t, t);
    execute format('create policy "%s_auth_insert" on public.%I for insert to authenticated with check (true)', t, t);
    execute format('create policy "%s_auth_update" on public.%I for update to authenticated using (true)', t, t);
    execute format('create policy "%s_auth_delete" on public.%I for delete to authenticated using (true)', t, t);
  end loop;
end $$;

-- AI Control tables: admin only
do $$ declare t text; begin
  foreach t in array array['ai_runs', 'ai_run_steps', 'ai_feedback'] loop
    execute format(
      'create policy "%s_admin_select" on public.%I for select to authenticated using (public.current_role() = ''admin'')',
      t, t
    );
    execute format(
      'create policy "%s_admin_insert" on public.%I for insert to authenticated with check (public.current_role() = ''admin'')',
      t, t
    );
  end loop;
end $$;

-- Profiles: users can only read their own, admins read all
create policy "profiles_own"   on public.profiles for select to authenticated
  using (id = auth.uid() or public.current_role() = 'admin');
create policy "profiles_update" on public.profiles for update to authenticated
  using (id = auth.uid());
