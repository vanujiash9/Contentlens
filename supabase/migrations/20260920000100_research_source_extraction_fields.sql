alter table public.research_sources
  add column if not exists headings jsonb not null default '[]'::jsonb,
  add column if not exists word_count integer not null default 0 check (word_count >= 0),
  add column if not exists questions jsonb not null default '[]'::jsonb,
  add column if not exists examples jsonb not null default '[]'::jsonb,
  add column if not exists tables_count integer not null default 0 check (tables_count >= 0),
  add column if not exists images_count integer not null default 0 check (images_count >= 0),
  add column if not exists videos_count integer not null default 0 check (videos_count >= 0);
