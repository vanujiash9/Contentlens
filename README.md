# ContentLens

ContentLens is an AI-assisted SEO/AIO content research workspace for Vietnamese piano and keyboard content teams.

The repository is a small monorepo: the Vite/React frontend lives in `frontend/`, the FastAPI backend lives in `backend/`, and Supabase local schema/migrations live in `supabase/`.

## Features

- Overview dashboard for research pipeline status
- Topic discovery for AI-suggested content ideas
- Topic queue with search, filters, progress states, and research actions
- Competitor research workflow for SERP/source analysis
- Content gap, weak explanation, unanswered question, and information gain insights
- Content brief generation and brief history
- Responsive sidebar and bottom navigation layout
- Supabase/Postgres persistence for users, workspaces, topics, research, and briefs
- FastAPI backend API for frontend workflows and AI integrations

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
- Uvicorn
- OpenAI-compatible AI provider configuration

## Getting started

Install workspace dependencies from the repository root:

```bash
pnpm install
```

Copy the relevant environment template for the app you are running:

```text
frontend/.env.example -> frontend/.env.local
backend/.env.example  -> backend/.env
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

Start the frontend dev server:

```bash
pnpm run dev
```

The frontend dev server runs on port `8443` by default:

```text
http://localhost:8443/
```

Start the backend dev server:

```bash
pnpm run dev:backend
```

The backend dev server runs on port `8000` by default:

```text
http://localhost:8000/
```

## Environment variables

### Frontend (`frontend/.env.local`)

Only put public `VITE_*` values in the frontend env file.

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=replace-with-local-publishable-key
VITE_API_BASE_URL=http://localhost:8000
```

For production on Vercel, `VITE_API_BASE_URL` should point to the Railway backend URL:

```env
VITE_API_BASE_URL=https://your-backend.up.railway.app
```

### Backend (`backend/.env`)

Backend service-role and AI/search secrets belong only in the backend environment.

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=replace-with-local-publishable-key
SUPABASE_SERVICE_ROLE_KEY=replace-with-local-secret-key
SUPABASE_JWKS_URL=http://127.0.0.1:54321/auth/v1/.well-known/jwks.json
SUPABASE_JWT_AUDIENCE=authenticated
CORS_ORIGINS=["http://localhost:8443"]
OPENAI__API_KEY=replace-with-backend-only-openai-key
OPENAI__BASE_URL=https://your-openai-compatible-provider.example/v1
OPENAI__MODEL=your-model-name
OPENAI__TIMEOUT_SECONDS=30
OPENAI__MAX_RETRIES=2
OPENAI__MAX_OUTPUT_TOKENS=4000
AI_DISCOVERY_ENABLED=true
```

Do **not** put these backend-only values in Vercel/frontend env vars:

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI__API_KEY`
- Provider/search API keys
- Any other secret key that does not start with `VITE_`

## Production deployment

Recommended production split:

```text
Frontend React/Vite -> Vercel
Backend FastAPI     -> Railway
Supabase            -> database/auth
```

### Deploy frontend to Vercel

Use these Vercel settings:

```text
Root Directory: frontend
Framework Preset: Vite
Install Command: pnpm install
Build Command: pnpm build
Output Directory: dist
```

Set frontend environment variables in Vercel:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=https://your-backend.up.railway.app
```

Only use public browser-safe keys in Vercel.

### Deploy backend to Railway

Use these Railway settings for the FastAPI service:

```text
Root Directory: backend
Start Command: uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Set backend environment variables in Railway using the backend env list above. For production, point Supabase variables at the production Supabase project and set CORS to the Vercel URL:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-backend-only-service-role-key
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_JWT_AUDIENCE=authenticated
CORS_ORIGINS=["https://your-app.vercel.app"]
OPENAI__API_KEY=your-backend-only-openai-key
OPENAI__BASE_URL=https://your-openai-compatible-provider.example/v1
OPENAI__MODEL=your-model-name
OPENAI__TIMEOUT_SECONDS=30
OPENAI__MAX_RETRIES=2
OPENAI__MAX_OUTPUT_TOKENS=4000
AI_DISCOVERY_ENABLED=true
```

After the first deploy:

1. Copy the Railway backend URL into Vercel as `VITE_API_BASE_URL`.
2. Copy the Vercel frontend URL into Railway as `CORS_ORIGINS`.
3. Redeploy both services so the final URLs are active in runtime env vars.

## Build

```bash
pnpm run build
```

## Backend smoke test

```bash
cd backend
PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python3 -m pytest tests/test_health.py -q
```

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
│   ├── app/             # FastAPI app source
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

The current app connects the React frontend, FastAPI backend, and Supabase data layer for the core topic discovery, research queue, competitor research, and content brief workflows. Production deployment requires configuring the Vercel frontend, Railway backend, and Supabase environment variables described above.
