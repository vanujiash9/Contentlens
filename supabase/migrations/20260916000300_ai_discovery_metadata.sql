alter table public.discovery_runs
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists started_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists error_code text,
  add column if not exists error_message text,
  add column if not exists provider text,
  add column if not exists model text,
  add column if not exists input_tokens integer check (input_tokens is null or input_tokens >= 0),
  add column if not exists output_tokens integer check (output_tokens is null or output_tokens >= 0),
  add column if not exists latency_ms integer check (latency_ms is null or latency_ms >= 0),
  add column if not exists idempotency_key text;

alter table public.discovered_topics
  add column if not exists rank integer check (rank is null or rank > 0);

create trigger discovery_runs_set_updated_at
  before update on public.discovery_runs
  for each row execute function public.set_updated_at();

create index if not exists discovery_runs_workspace_created_idx
  on public.discovery_runs(workspace_id, created_at desc);

create unique index if not exists discovery_runs_idempotency_idx
  on public.discovery_runs(workspace_id, created_by, idempotency_key)
  where idempotency_key is not null;

create index if not exists discovered_topics_run_idx
  on public.discovered_topics(workspace_id, discovery_run_id);

create unique index if not exists discovered_topics_run_rank_idx
  on public.discovered_topics(discovery_run_id, rank)
  where rank is not null;

create index if not exists discovered_topics_topic_idx
  on public.discovered_topics(workspace_id, topic_id);
