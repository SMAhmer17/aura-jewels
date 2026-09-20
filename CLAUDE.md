# Aura Jewels — Monorepo

This repo is split by concern: the frontend and the API live side by side and talk only over HTTP.

- `frontend/` — the Next.js + TypeScript storefront and admin dashboard. See `frontend/CLAUDE.md` for its design system, architecture, and conventions.
- `backend/` — the NestJS + Prisma REST API (Postgres, Supabase in production). Cash on delivery only, guest checkout with optional customer accounts, one admin. See `backend/README.md` for setup, the API, and the Supabase and Railway deployment steps.

## Commands

Run from the repo root:

```bash
npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run lint
```

Or `cd frontend` first and drop the `--prefix frontend` from each command. The API has its own commands:

```bash
npm --prefix backend run start:dev
npm --prefix backend test
```

How it fits together: the frontend (Vercel) calls the API (Railway) using `NEXT_PUBLIC_API_URL`. Only the API talks to Supabase (Postgres, and Storage for images). The frontend never uses Supabase directly, and sign-in is the API's own (not Supabase Auth). Live API docs are at `/api/docs` on the API.

To run everything locally: start the API (`npm --prefix backend run start:dev`, port 4000), then the frontend (port 3000). The frontend reads `frontend/.env.local` (see `frontend/.env.example`).

Status: backend built and tested (59 tests). Frontend is connected to the API. Not yet done: real Supabase project and Railway deploy (needs the owner's accounts), emails, and other payment methods.
