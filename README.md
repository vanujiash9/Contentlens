# ContentLens

ContentLens is an AI-assisted content research workspace focused on Vietnamese piano and keyboard content teams.

The repository is organized as a small monorepo: the completed Vite/React frontend lives in `frontend/`, backend scaffolding lives in `backend/`, and Supabase local schema/migrations live in `supabase/`.

## Features

- Overview dashboard for research pipeline status
- Topic queue with search, filters, progress states, and topic detail navigation
- Topic discovery surface for AI-suggested content ideas
- Content brief workspace for reviewing generated research output
- Responsive sidebar and bottom navigation layout
- Supabase local schema for multi-user/workspace persistence
- FastAPI backend scaffold for the upcoming API layer

## Tech stack

### Frontend

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- Recharts
- Supabase JS client for browser auth

### Backend/data

- FastAPI
- Supabase/Postgres
- Supabase CLI local development

## Getting started

Install workspace dependencies from the repository root:

```bash
pnpm install
```

Start the frontend dev server:

```bash
pnpm run dev
```

The frontend dev server runs on port `8443` by default:

```text
http://localhost:8443/
```

Start local Supabase services used by this project:

```bash
pnpm run db:start
```

The local stack intentionally excludes `logflare`, `vector`, and `realtime` because they are not required for the current backend integration phase on this machine.

Reset the local database and apply migrations/seed data:

```bash
pnpm run db:reset
```

Generate frontend database types from the local Supabase schema:

```bash
pnpm run types:db
```

## Build

```bash
pnpm run build
```

## Backend smoke test

```bash
cd backend
PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python3 -m pytest tests/test_health.py -q
```

## Environment files

Copy the relevant template for the app you are running:

```text
frontend/.env.example -> frontend/.env.local
backend/.env.example  -> backend/.env
```

Only put public `VITE_*` values in the frontend env file. Backend service-role/secret keys belong only in `backend/.env`.

## Project structure

```text
ContentLens/
├── frontend/
│   ├── src/             # React app source
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── app/             # FastAPI app scaffold
│   ├── tests/
│   └── pyproject.toml
├── supabase/
│   ├── migrations/      # Local database migrations
│   ├── seed.sql
│   └── config.toml
├── package.json         # Root orchestration scripts
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

## Status

The frontend UI is still mock-driven for most runtime data, while Supabase schema, generated database types, and FastAPI API contract scaffolding are in place for the next backend integration phase.
