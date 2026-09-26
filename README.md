# Shop — full-stack e-commerce platform

A production-oriented e-commerce application: customer storefront, admin dashboard,
authentication, RBAC, payments (Safepay — Pakistan), inventory, coupons, reviews, and SEO, built
on Next.js.

## Features

- **Storefront**: home, shop with filters/sort/pagination, category & search pages, product
  detail with variants/gallery/reviews, cart, checkout, order confirmation
- **Accounts**: register/login (email+password and Google), email verification, forgot/reset
  password, order history, addresses, wishlist, password change
- **Admin dashboard**: revenue/order/inventory stats, product CRUD with image upload, categories
  & brands, order management (status, tracking, refunds), inventory adjustment, coupons, review
  moderation, customers, users & roles, audit log, analytics, settings reference
- **Payments**: provider-agnostic architecture (`lib/payments`); active implementation is
  Safepay (cards, JazzCash, EasyPaisa) with signed, idempotent webhook handling — see
  [SECURITY.md](./SECURITY.md)
- **SEO**: per-page metadata, canonical URLs, Open Graph, Product/Breadcrumb JSON-LD, dynamic
  `sitemap.xml` and `robots.txt`
- **Security**: server-side RBAC on every privileged action, Zod validation everywhere,
  Redis-backed rate limiting on sensitive endpoints, presigned direct-to-R2 uploads, full audit
  log — details in [SECURITY.md](./SECURITY.md)

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + React + TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Better Auth |
| Payments | Safepay (swappable — see `lib/payments`) |
| File storage | Cloudflare R2 |
| Cache / rate limiting | Redis |
| Email | Resend |
| Testing | Vitest (unit) + Playwright (E2E) |
| Hosting | Vercel + Cloudflare (DNS/CDN) |

## Architecture overview

```
app/            Routes (customer + /admin), Route Handlers (auth, webhooks, contact)
components/     UI components (components/admin/* for admin-only)
actions/        Server Actions — every write path, RBAC-gated where relevant
services/       Read-only query functions used by pages
schemas/        Zod validation shared by actions and (where relevant) client forms
lib/            auth, payments, r2, email, rate-limit, shipping, format — cross-cutting code
db/             Drizzle schema, relations, migrations, seed/migrate scripts
tests/          Vitest unit tests, Playwright E2E tests
```

Business logic lives in `actions/` and `services/`, not inside components — components stay
focused on rendering and calling those functions.

## Local development

```bash
npm install
cp .env.example .env   # fill in the values — see SETUP.md
npm run db:generate
npm run db:migrate
npm run db:seed        # optional demo data
npm run dev
```

Visit `http://localhost:3000`. Demo admin credentials are printed by `db:seed` — rotate that
password immediately, it's a placeholder.

## Testing

```bash
npm run test        # Vitest unit tests
npm run test:e2e     # Playwright E2E (starts its own build+server)
```

## Deployment

Full step-by-step instructions — including the "your computer does not need to stay on" cloud
deployment path via Vercel + Cloudflare + managed Postgres/Redis — are in
**[SETUP.md](./SETUP.md)**.

## Documentation

- [SETUP.md](./SETUP.md) — zero-to-production setup guide
- [SECURITY.md](./SECURITY.md) — security architecture and responsible disclosure
- [.env.example](./.env.example) — every environment variable, explained inline
