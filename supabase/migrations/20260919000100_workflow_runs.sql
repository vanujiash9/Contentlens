create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  workflow_name text not null check (char_length(trim(workflow_name)) between 1 and 120),
  subject_type text,
  subject_id uuid,
  status public.job_status not null default 'pending',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  provider text,
  model text,
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  error_code text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger workflow_runs_set_updated_at
  before update on public.workflow_runs
  for each row execute function public.set_updated_at();

create index if not exists workflow_runs_workspace_created_idx
  on public.workflow_runs(workspace_id, created_at desc);

create index if not exists workflow_runs_workspace_name_created_idx
  on public.workflow_runs(workspace_id, workflow_name, created_at desc);

create index if not exists workflow_runs_subject_idx
  on public.workflow_runs(workspace_id, subject_type, subject_id);

alter table public.workflow_runs enable row level security;

create policy workflow_runs_member_all on public.workflow_runs
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
