# Aura Jewels — Monorepo

This repo is split by concern so a future backend can sit alongside the frontend without reorganizing anything:

- `frontend/` — the Next.js + TypeScript storefront and admin dashboard. See `frontend/CLAUDE.md` for its design system, architecture, and conventions.
- `backend/` — not created yet. Reserved for the Supabase-backed API/service layer in Phase 2.

## Commands

Run from the repo root:

```bash
npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run lint
```

Or `cd frontend` first and drop the `--prefix frontend` from each command.
