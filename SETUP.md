# Setup guide — zero to production

This guide takes you from a fresh clone to a live store, deployed entirely on managed cloud
infrastructure. **Once deployed, your computer does not need to stay on** — Vercel, your managed
Postgres, and your managed Redis all run independently of your machine.

## 1. Requirements

- Node.js 20+
- A GitHub account (to push this repo and connect it to Vercel)
- A [Vercel](https://vercel.com) account (free tier is enough to start)
- A [Cloudflare](https://cloudflare.com) account (R2 storage + optional DNS/CDN)
- A managed PostgreSQL database — [Neon](https://neon.tech) or [Supabase](https://supabase.com)
  both have a free tier and work well with serverless Vercel deployments
- A managed Redis — [Upstash](https://upstash.com) has a serverless-friendly free tier
- A [Safepay](https://getsafepay.com) merchant account (Pakistan payment gateway)
- A [Resend](https://resend.com) account for transactional email
- A domain name (optional for local dev, required for production)

## 2. Project installation

```bash
git clone <your-repo-url>
cd ecommerce
npm install
cp .env.example .env
```

## 3. Environment variables

Every variable is listed in `.env.example`. Summary:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (use a **pooled** connection string for serverless) |
| `BETTER_AUTH_SECRET` | Random 32+ character string signing session tokens — generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Your site's base URL (e.g. `https://yourdomain.com`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials (optional — leave blank to disable Google sign-in) |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_PUBLIC_URL` | Cloudflare R2 for product images |
| `SAFEPAY_ENVIRONMENT` | `sandbox` or `production` |
| `SAFEPAY_API_KEY` / `SAFEPAY_V1_SECRET` / `SAFEPAY_WEBHOOK_SECRET` | From your Safepay dashboard |
| `SAFEPAY_SIGNATURE_HEADER` | Confirm against your Safepay dashboard's webhook docs — defaults to `x-sfpy-signature` |
| `REDIS_URL` | Managed Redis connection string, for rate limiting |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email |
| `NEXT_PUBLIC_SITE_URL` | Public site URL — the only `NEXT_PUBLIC_*` variable; everything else stays server-only |

Never commit `.env` — it's already in `.gitignore`.

## 4. Database setup

Create a Postgres database with your chosen provider (Neon/Supabase). Copy its connection string
(the **pooled** one, if offered — e.g. Neon's "Pooled connection") into `DATABASE_URL`.

## 5. Drizzle setup — migrations

```bash
npm run db:generate   # generates SQL migration files from db/schema/tables.ts into db/migrations
npm run db:migrate    # applies pending migrations to DATABASE_URL
```

Commit the generated `db/migrations/` folder — it's your schema history and must never be edited
by hand once applied. To change the schema, edit `db/schema/tables.ts`, then re-run
`db:generate`.

**Never** run `db:generate`/`db:migrate` against production with unreviewed schema changes — treat
migrations like code, review them in a pull request first.

## 6. Authentication setup (Better Auth)

Already wired in `lib/auth/index.ts`. You only need to:
1. Set `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`.
2. Optionally configure Google OAuth (step 7).

## 7. Google OAuth setup (optional)

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials →
   Create OAuth client ID → Web application.
2. Authorized redirect URI: `https://yourdomain.com/api/auth/callback/google` (and
   `http://localhost:3000/api/auth/callback/google` for local dev).
3. Copy the client ID/secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

## 8. Cloudflare R2 setup

1. Cloudflare dashboard → R2 → Create bucket. Name it (e.g. `shop-products`).
2. R2 → Manage API tokens → create a token with **Object Read & Write** scoped to that bucket.
   Copy the Access Key ID / Secret Access Key into `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`.
3. Your account ID (found on the R2 overview page) goes in `R2_ACCOUNT_ID`.
4. Enable public access for the bucket (R2 → your bucket → Settings → Public access) or attach a
   custom domain to it — either way, put the resulting base URL in `R2_PUBLIC_URL`.
5. `R2_BUCKET_NAME` is the bucket name from step 1.

Uploads always go through presigned URLs generated server-side (`lib/r2/upload.ts`) — the R2
credentials themselves never reach the browser.

## 9. Payment setup — Safepay

1. Sign up at the [Safepay dashboard](https://dashboard.getsafepay.com), start in **sandbox**
   mode.
2. Dashboard → API keys → copy your API key and v1 secret into `SAFEPAY_API_KEY` /
   `SAFEPAY_V1_SECRET`.
3. Dashboard → Webhooks → add an endpoint pointing at
   `https://yourdomain.com/api/webhooks/safepay`. Copy the signing secret into
   `SAFEPAY_WEBHOOK_SECRET`, and **confirm the exact header name Safepay sends the signature in**
   — set `SAFEPAY_SIGNATURE_HEADER` to match if it differs from the default.
4. Test with a sandbox checkout end-to-end: place an order, complete the hosted checkout,
   confirm the webhook fires and the order flips to `paid` in `/admin/orders`.
5. When ready for real transactions, complete Safepay's merchant verification, switch
   `SAFEPAY_ENVIRONMENT=production`, and swap in your production API key/secrets. Never mix
   sandbox and production keys.

Never mark an order "paid" from anywhere except the webhook handler — see SECURITY.md.

## 10. Email setup

1. [Resend](https://resend.com) → API Keys → create one → `RESEND_API_KEY`.
2. Verify your sending domain in Resend, then set `EMAIL_FROM` to an address on that domain
   (e.g. `no-reply@yourdomain.com`).

## 11. Redis setup

1. [Upstash](https://upstash.com) → create a Redis database (choose a region close to your
   Vercel deployment region).
2. Copy the `rediss://` connection string into `REDIS_URL`.

Rate limiting fails open (allows requests) if `REDIS_URL` is unset — fine for local dev, but set
it in production or sensitive endpoints go unprotected.

## 12. Local development

```bash
npm run dev
```

Visit `http://localhost:3000`. Run `npm run db:seed` first if you want demo products and a demo
admin login (credentials are printed to the console — rotate the password immediately).

## 13. Production deployment — without a local server

1. **Push to GitHub**: `git push` this repository to a GitHub repo.
2. **Connect to Vercel**: [vercel.com/new](https://vercel.com/new) → import the GitHub repo.
3. **Configure environment variables**: in the Vercel project → Settings → Environment
   Variables, add every variable from `.env.example` with your production values (production
   `DATABASE_URL`, production Safepay keys with `SAFEPAY_ENVIRONMENT=production`, etc). Set them
   for the "Production" environment; use separate (sandbox/dev) values for "Preview".
4. **Configure the database**: run migrations against your production database before or
   immediately after first deploy: `DATABASE_URL=<production-url> npm run db:migrate` from your
   machine, or wire it as a Vercel deploy step.
5. **Configure Cloudflare**: point your domain's DNS at Vercel (step 14), and set up R2 as in
   step 8 if you haven't.
6. **Configure R2**: already done in step 8 — just make sure the production values are the ones
   entered in Vercel.
7. **Configure the payment webhook**: in Safepay's dashboard, set the webhook URL to
   `https://yourdomain.com/api/webhooks/safepay` (your real production domain, not the
   `vercel.app` preview URL, once your custom domain is attached).
8. **Deploy**: Vercel deploys automatically on push to `main`. Trigger the first deploy from the
   dashboard's "Deploy" button if it doesn't happen automatically.
9. **Test production**: place a real (or sandbox, if Safepay is still in sandbox mode) order
   through the live URL, confirm the webhook fires and the order confirms.

**After this, your laptop can be off** — Vercel serves the app, your managed Postgres/Redis run
independently, and R2 serves images directly. Nothing depends on a machine you control staying
on.

## 14. Domain setup

1. Vercel project → Settings → Domains → add your domain.
2. Vercel shows the DNS records to add. If your domain's nameservers point at Cloudflare, add
   those records in Cloudflare's DNS tab (set proxy status per Vercel's recommendation — usually
   DNS-only for the record Vercel needs to issue its certificate).
3. HTTPS is issued and renewed automatically by Vercel once DNS resolves.

## 15. Google Search Console

1. [search.google.com/search-console](https://search.google.com/search-console) → Add property
   → your domain.
2. Verify via the DNS TXT record method (add it in Cloudflare) or the HTML file method.
3. Sitemaps → submit `https://yourdomain.com/sitemap.xml` (generated dynamically by
   `app/sitemap.ts`).
4. Use "Request indexing" on key pages (home, top categories) to speed up initial crawling.
5. Monitor Coverage and Core Web Vitals reports over the following weeks — new sites take time to
   fully index.

## 16. SEO

- Site-wide title/description: `app/layout.tsx` → `metadata` export.
- Per-product SEO title/description: editable per product in `/admin/products/[id]/edit`
  (`seoTitle`, `seoDescription` fields) — falls back to the product name/short description if
  left blank.
- Sitemap: regenerates automatically from published products/categories (`app/sitemap.ts`) — no
  manual step needed.
- Canonical URLs: set per-page via each page's `generateMetadata`/`metadata` export.
- Structured data: Product JSON-LD is emitted on every product page
  (`app/product/[slug]/page.tsx`).

## 17. Admin setup — creating the first production admin

The seed script's demo admin is for local/staging only. For production:

1. Register a normal account through `/register` on your live site with the email you want to
   use as admin.
2. Verify the email (check your inbox).
3. Promote that account to `super_admin` directly in the database, once, via your DB provider's
   SQL console:
   ```sql
   UPDATE users SET role = 'super_admin' WHERE email = 'you@yourdomain.com';
   ```
4. From then on, manage every other admin/staff role through `/admin/users` — only a
   `super_admin` can change roles, and this is the one time you'll need direct DB access for it.

## 18. Security checklist

- [ ] `BETTER_AUTH_SECRET` is a unique, random 32+ character value in production (not the CI
      placeholder)
- [ ] `SAFEPAY_ENVIRONMENT=production` with production keys before accepting real payments
- [ ] `SAFEPAY_SIGNATURE_HEADER` confirmed against Safepay's current docs
- [ ] `REDIS_URL` is set (rate limiting active)
- [ ] Production `DATABASE_URL` is never used in local development or CI
- [ ] R2 bucket credentials are scoped to that bucket only, not account-wide
- [ ] First production admin created via the procedure in section 17, demo seed data removed
      or never seeded against production
- [ ] `.env` is not committed (`git status` shows it ignored)
- [ ] Dependabot/`npm audit` reviewed before each deploy
- [ ] See SECURITY.md for the full architecture review

## 19. Backup strategy

- Managed Postgres providers (Neon, Supabase) offer automatic point-in-time backups — enable and
  verify retention meets your needs in their dashboard.
- Export a manual `pg_dump` before any major schema migration as an extra safety net:
  ```bash
  pg_dump "$DATABASE_URL" > backup-$(date +%F).sql
  ```
- R2 objects (product images) are immutable once uploaded (new uploads get new random keys) —
  the practical risk is accidental deletion, not corruption; consider enabling R2 bucket
  versioning if your plan supports it.

## 20. Monitoring

- Vercel's dashboard gives you deploy status, function logs, and basic analytics out of the box.
- For error tracking, wire a service like Sentry into `app/global-error.tsx` and `app/error.tsx`
  (both already centralize error handling — add your Sentry `captureException` call in the
  existing `useEffect`).
- Watch `/admin/dashboard` regularly for pending orders and low stock — it's the fastest
  operational signal.

## 21. Updates

```bash
npm outdated          # see what's behind
npm update             # patch/minor updates
npm audit fix          # security patches
```

For major version bumps of `better-auth`, `drizzle-orm`, or `@sfpy/node-sdk`, read the changelog
first — these three touch authentication, data access, and payments. Test in a preview deployment
before merging to `main`.

## 22. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `DATABASE_URL is not set` at build | Env var missing in Vercel project settings for that environment (Production/Preview) |
| Webhook never fires, order stuck "pending" | Webhook URL in Safepay dashboard doesn't match your real domain, or `SAFEPAY_WEBHOOK_SECRET` mismatch |
| Uploaded image 403s | R2 bucket public access not enabled, or `R2_PUBLIC_URL` doesn't match the actual public bucket URL |
| Can't sign in with Google | Redirect URI in Google Cloud Console doesn't exactly match `BETTER_AUTH_URL` + `/api/auth/callback/google` |
| Rate limit errors on every request in dev | `REDIS_URL` pointing at an unreachable Redis — unset it locally to fail open, or fix connectivity |
| `npm run db:migrate` says nothing to do | You forgot `npm run db:generate` after editing `db/schema/tables.ts` |
