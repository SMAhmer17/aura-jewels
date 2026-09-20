# Aura Jewels API

REST API for the Aura Jewels storefront and admin dashboard. NestJS 11 + TypeScript, Prisma, PostgreSQL.
Postgres is Supabase in production and a plain local Postgres while developing. The API only needs a
Postgres connection string, so both work the same way.

- Cash on delivery only.
- Guests can order without an account. Customer accounts are optional.
- One admin account.
- No emails yet.

## Run it locally

You need Node 20+ and a running PostgreSQL.

```bash
cd backend
cp .env.example .env            # then edit the values (see below)
createdb aura_jewels            # and aura_jewels_test for the tests
npm install                     # also generates the Prisma client
npm run db:deploy               # create the tables
npm run db:seed                 # admin account, settings, home page, and demo catalog
npm run start:dev               # http://localhost:4000
```

- Health check: `GET http://localhost:4000/api/v1/health`
- Interactive API docs (Swagger): `http://localhost:4000/api/docs`. Sign in with `POST /auth/admin/login`, click Authorize,
  and paste the `accessToken` to try the admin endpoints. The raw OpenAPI file is at `/api/docs-json`.
  The docs are on in production too; set `SWAGGER_ENABLED=false` to hide them.

`db:seed` creates the admin from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Running it again updates the admin's
password and never overwrites settings or home page content you have already edited.
Set `SEED_DEMO=false` to seed only the admin, settings, and home page (no demo products).

### Environment variables

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Postgres connection the API uses |
| `DIRECT_URL` | Direct Postgres connection, used only by migrations |
| `JWT_SECRET` | Long random string that signs sign-in tokens. `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | How long a sign-in lasts, e.g. `7d` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | The single admin (password at least 10 characters) |
| `CORS_ORIGINS` | Comma separated list of frontends allowed to call the API |
| `UPLOAD_DIR`, `PUBLIC_BASE_URL` | Local development only: where uploaded images are kept and the public URL they are served from |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Production: uploaded images go to Supabase Storage instead of local disk. Required when `NODE_ENV=production` (set `STORAGE_DRIVER=local` to override). The key is a server secret, never put it in the frontend |
| `SUPABASE_STORAGE_BUCKET` | Bucket name, default `product-images`. Created (public) automatically on the first upload |
| `SWAGGER_ENABLED` | Set to `false` to hide `/api/docs` |
| `PORT` | Defaults to 4000 |

Never commit `.env`. It is git-ignored.

## Scripts

| Command | Does |
|---|---|
| `npm run start:dev` | Run with auto-reload |
| `npm run build` / `npm run start:prod` | Production build, then apply migrations and start |
| `npm test` | Run the end-to-end tests against the `aura_jewels_test` database |
| `npm run typecheck` | TypeScript check |
| `npm run db:migrate` | Create a new migration after changing `prisma/schema.prisma` |
| `npm run db:deploy` | Apply pending migrations (safe for production) |
| `npm run db:seed` | Seed data (see above) |
| `node scripts/generate-seed-data.mjs` | Rebuild `prisma/seed-data.json` from the frontend's mock data |

The tests empty and reload `aura_jewels_test` every run. They refuse to start if `.env.test` does not point at a
database named `aura_jewels_test`.

## API

Base path: `/api/v1`. Send the admin's token as `Authorization: Bearer <token>`.

**Public**

| Method and path | Purpose |
|---|---|
| `GET /categories` | All categories |
| `GET /products`, `GET /products/:slug` | Active products with sizes and stock (sold out ones included, so the storefront can show them as sold) |
| `GET /products/:slug/reviews`, `POST /products/:slug/reviews` | Read reviews, and add one (name, email, rating, optional title, text of at least 10 characters). One review per email per product. Reviewers who have a non-cancelled order for the product are marked verified. The email is never returned publicly |
| `POST /discounts/validate` | Preview a promo code for a subtotal |
| `POST /orders` | Place a cash on delivery order (see below) |
| `GET /orders/:id` | Order confirmation, by the order's unguessable id |
| `GET /orders/track/:orderNumber` | Track an order by its number (e.g. `AJ-2026-1001`): status, timeline and items, never the customer's name, phone, email or address. Rate limited |
| `POST /contact` | Contact form. Saved for the admin to answer; rate limited, with a hidden field that quietly drops bots |
| `GET /settings`, `GET /home-content` | Store settings and the home page content |
| `POST /auth/register`, `POST /auth/login`, `GET /me`, `GET /me/orders` | Optional customer accounts |

**Admin** (all under `/admin`, admin token required)

`overview`, `orders` (list with filters, detail, status, payment and notes), `products` (create, edit sizes and stock,
delete), `categories`, `discounts`, `reviews` (list with the private email, hide or show, delete), `messages` (contact form inbox: filter,
mark read or resolved, delete), `inventory`, `customers`, `analytics`, `uploads` (product images, and videos for home page tiles),
`settings`, `home-content`. Sign in with `POST /auth/admin/login`.

### How an order is placed

The browser sends only which sizes and how many, plus the customer's details:

```json
{
  "customer": { "name": "...", "email": "...", "phone": "...", "address": "...", "city": "..." },
  "items": [{ "variantId": "<uuid>", "quantity": 1 }],
  "discountCode": "WELCOME10",
  "giftBox": true
}
```

The server works out every price, the shipping, the gift box fee, and the discount from the database, takes the
stock, and creates the order in one database transaction. If anything fails, nothing is changed. Two people buying
the last item at the same time cannot both succeed.

## Security notes

- Prices and totals are never taken from the request. Extra fields in a request are rejected.
- Passwords are hashed with bcrypt. Login errors do not reveal whether an email exists. Sign-in, order, review and
  discount-preview endpoints are rate limited.
- Admin routes require an admin token. A customer's token is refused with 403.
- Uploads accept only real JPEG, PNG or WebP files (checked by content, not by name), up to 5 MB.
- Product image links and home page links must be `https://` links or site paths, which blocks `javascript:` links.
- Database rules back this up: no negative stock, ratings 1 to 5, no negative prices, cash on delivery only, and so on.
- Every table has Row Level Security turned on with no policies, so Supabase's own public API cannot read or write
  anything. Only this API can.

## Going live: Supabase and Railway

How the pieces fit: the storefront and dashboard (Vercel) call this API (Railway). The API is the only thing that
talks to Supabase: Postgres for data and Storage for product images. The frontend never uses Supabase directly, and
sign-in is handled by this API (not Supabase Auth).

1. **Supabase:** create a project. Under Project Settings, Database, copy two connection strings:
   - `DATABASE_URL`: the **Transaction pooler** string (port 6543). Add `?pgbouncer=true&connection_limit=1`.
   - `DIRECT_URL`: the **Session pooler** string (port 5432 on the pooler host). Railway can reach this one over IPv4.

   Under Project Settings, API, copy the **Project URL** (`SUPABASE_URL`) and the **service_role** key
   (`SUPABASE_SERVICE_ROLE_KEY`). Treat the service role key like a password.
2. **Create the tables and first data** from your computer, pointing at Supabase:
   ```bash
   DATABASE_URL="<pooler string>" DIRECT_URL="<session string>" \
   ADMIN_EMAIL="you@yourdomain.com" ADMIN_PASSWORD="<a strong password>" \
   SEED_DEMO=false npx prisma migrate deploy && npx prisma db seed
   ```
3. **Railway:** create a service from this repo and set the root directory to `backend`. `railway.json` already sets the
   start command (`npm run start:prod`, which applies any new migrations and then starts the API) and the health check.
   Add these variables:

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL`, `DIRECT_URL` | the two Supabase strings from step 1 |
   | `JWT_SECRET` | a fresh random value (`openssl rand -base64 48`) |
   | `CORS_ORIGINS` | your Vercel site address, e.g. `https://aurajewels.vercel.app` (comma separate to allow more) |
   | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | from step 1 |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | only needed if you run the seed from Railway |

   Generate a public domain for the service in Railway. Then open `https://<your-api>/api/docs` for the live Swagger docs
   and `https://<your-api>/api/v1/health` to confirm it is up (`{"status":"ok","database":"up"}`).
4. **Frontend (Vercel):** set `NEXT_PUBLIC_API_URL` to `https://<your-api>/api/v1` and redeploy. Add the Vercel address
   to `CORS_ORIGINS` on Railway, or the browser will block the calls.

Not built yet: emails, payment gateways, and password reset (they need email).
