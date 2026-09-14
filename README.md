# ContentLens

ContentLens is a frontend prototype for an AI-assisted content research workspace focused on Vietnamese piano and keyboard content teams.

The current public repository contains the frontend only. Backend integrations and production data services will be added later.

## Features

- Overview dashboard for research pipeline status
- Topic queue with search, filters, progress states, and topic detail navigation
- Topic discovery surface for AI-suggested content ideas
- Content brief workspace for reviewing generated research output
- Responsive sidebar and bottom navigation layout

## Tech stack

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- Recharts

## Getting started

```bash
npm install
npm run dev
```

The dev server runs on port `8443` by default:

```text
http://localhost:8443/
```

## Build

```bash
npm run build
```

## Project structure

```text
src/
├── components/     # Feature and layout components
├── data/           # Mock frontend data
├── hooks/          # Shared React hooks
├── styles/         # Design tokens
├── App.tsx         # Main app shell
├── index.css       # Global styles
└── main.tsx        # React entrypoint
```

## Status

This is a frontend-first demo. Authentication, database persistence, and AI pipeline execution are currently represented with mock data and will be connected in a later backend phase.
