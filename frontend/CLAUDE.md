@AGENTS.md

# Aura Jewels

Premium jewellery e-commerce site. Black-and-gold luxury visual identity. Next.js (App Router) + TypeScript + Tailwind v4. Phase 1 is frontend-only: no Supabase, no auth, no real payments — a shared client-side store (Zustand + localStorage) stands in for the backend until Phase 2, behind a service-layer boundary so the swap doesn't touch components.

Market: Pakistan, prices in PKR (format as `Rs. 45,000`).

## Design tokens — single source of truth

All colors, typography, radius, and shadows are defined **once**, as CSS custom properties in [`src/app/globals.css`](src/app/globals.css), and mapped into Tailwind utilities via `@theme inline`. **To retheme the entire site, edit only the `:root` block in that file** — every component uses the semantic Tailwind classes below, never raw hex codes, so a token change cascades everywhere automatically.

| Token (`:root` var) | Tailwind class | Current value | Role |
|---|---|---|---|
| `--color-ink` | `bg-ink` / `text-ink` | `#0b0b0c` | Primary near-black — text, primary surfaces |
| `--color-ink-soft` | `bg-ink-soft` | `#1f1b16` | Secondary dark surface / hover on ink |
| `--color-gold` | `bg-gold` / `text-gold` / `border-gold` | `#c9a227` | Primary accent — CTAs, borders, highlights (use sparingly) |
| `--color-gold-light` | `bg-gold-light` | `#e0be55` | Gold hover/lighter state |
| `--color-ivory` | `bg-ivory` | `#faf7f0` | Default page background |
| `--color-cream` | `bg-cream` | `#f0ead9` | Secondary light surface (alt sections, table headers) |
| `--muted` | `text-muted` | `#8a8578` (warm gray) | Supporting/secondary text |
| `--color-border` / `--color-border-dark` | `border-border` / `border-border-dark` | hairline rgba(ink/ivory) | 1px dividers |
| `--color-success` / `--color-error` | `text-success` / `text-error` etc. | muted green / brick red | Status feedback — desaturated to stay on-brand |
| `--accent` / `--accent-hover` | `bg-accent` etc. | mirrors gold tokens | Semantic alias for "the brand accent," in case gold is ever swapped |
| `--radius-sm/md/lg` | `rounded-(--radius-sm)` etc. | 2px / 4px / 8px | Deliberately small — sharp corners read more premium than rounded |
| `--shadow-soft` / `--shadow-elevated` | `shadow-(--shadow-soft)` etc. | low-opacity soft shadows | Cards vs. modals/popovers |
| `--font-heading` | `font-heading` (applied globally to `h1`–`h6`) | Cormorant Garamond | Serif, luxury headings |
| `--font-body` | `font-body` (applied to `body`) | Inter | Sans, UI/body text |

Rule for all future components: reach for a semantic class (`bg-ink`, `text-gold`, `border-border`) — never hardcode a hex value or an arbitrary Tailwind color. If a new token is needed, add it to `:root` + the `@theme inline` block in `globals.css` first.

Gold should cover roughly 5–10% of any given screen (CTAs, borders, icons, key accents) — never large fill areas.

## Component library

- `src/components/ui/` — foundational, brand-agnostic primitives (Button, Badge, Card, Input, Modal, Table, EmptyState, Skeleton, Toast, Dropdown). These only know about design tokens, never jewellery-specific concepts.
- `src/components/layout/` — Header, Footer, nav shells (store vs. dashboard).
- `src/components/features/*` — feature-specific composition (product, cart, checkout, account, dashboard).
- `src/app/style-guide/` — internal-only visual reference for every `ui/` component + token. Not a public route; check here first when building new UI to keep it consistent, and extend it whenever a new primitive is added.

## Data architecture

- `src/lib/mock-data/` — static seed data (products, categories, orders, customers).
- `src/lib/services/` — the only layer components are allowed to call for data (`getProducts()`, `createCategory()`, etc.). Today it reads/writes the Zustand+localStorage store; in Phase 2 the same function signatures will call Supabase instead.
- `src/store/` — Zustand stores (shared client-side state acting as the Phase 1 "backend": categories/products/cart/wishlist/account/toasts). Dashboard CRUD on categories/products writes here, and the storefront reads from the same store, which is what makes "add a category in the dashboard → it appears in nav/shop instantly" work without a real backend. Note: state is per-browser (localStorage), not synced across devices until Supabase lands.
- `src/types/` — shared TypeScript interfaces, shaped to map cleanly onto future Supabase tables (string `id`, explicit foreign keys, ISO timestamps).

## Commands

- `npm run dev` — start dev server (port 3000)
- `npm run build` / `npm run start` — production build/serve
- `npm run lint` — ESLint
