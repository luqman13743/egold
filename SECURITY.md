# Security

This document describes the security architecture of this application and how to report a
vulnerability.

## Reporting a vulnerability

Please report security issues privately rather than opening a public GitHub issue. Email the
address configured in `SUPPORT_EMAIL` (see `.env.example`) with a description and, if possible,
reproduction steps. We'll acknowledge within a few business days.

## Authentication

- Handled entirely by [Better Auth](https://better-auth.com) (`lib/auth/index.ts`) — no custom
  password hashing or session logic exists in this codebase.
- Passwords are hashed with scrypt by Better Auth; raw passwords are never logged or stored.
- Email verification is required before a credential account can sign in.
- Sessions are httpOnly, secure (in production), sameSite cookies — never readable from
  client-side JavaScript.
- Login/register/forgot-password endpoints are rate-limited (10 requests/minute/IP by default,
  configured in `lib/auth/index.ts`).

## Authorization (RBAC)

- Five roles: `super_admin`, `admin`, `manager`, `staff`, `customer`, ranked in that order.
- **The only real authorization boundary is `requireRole()` in `lib/auth/rbac.ts`**, called at the
  top of every admin Server Action and the `/admin` layout. It reads the session from the request
  cookie server-side and throws if the role is insufficient.
- `middleware.ts` only checks "is there a session cookie" for fast redirects of logged-out
  visitors — it does **not** check roles, because Edge middleware cannot safely hit the database on
  every request. Never treat a passing middleware check as proof of admin access.
- Role changes require `super_admin` specifically (`actions/admin-users.ts`) — no other role can
  escalate itself or anyone else.
- Every Server Action that touches another user's data (addresses, orders, wishlist) scopes its
  query by the session's `userId` in the `WHERE` clause itself, not just in application logic — see
  `services/account.ts` for the pattern that prevents insecure direct object references.

## Secrets management

- All secrets live in environment variables (`.env`, never committed — see `.gitignore`) and are
  read only in server-only modules (`lib/payments/*`, `lib/r2/*`, `lib/auth/index.ts`).
- `NEXT_PUBLIC_*` is the only prefix exposed to the browser by Next.js; no secret is ever given
  that prefix.
- R2 credentials, Safepay keys, and the database connection string are never passed to a Client
  Component or embedded in any HTML/JS shipped to the browser.
- `/admin/settings` is a **read-only reference** to which environment variables exist — it cannot
  edit or reveal their values, by design (see the comment in `app/admin/settings/page.tsx`).

## Payment security

- All payment logic goes through the `PaymentProvider` interface (`lib/payments/types.ts`); the
  active implementation is Safepay (`lib/payments/safepay-provider.ts`).
- **An order's `paymentStatus` is only ever set to `paid` by the signed webhook handler**
  (`app/api/webhooks/safepay/route.ts`), never by a client-side redirect or the checkout action
  itself. `actions/checkout.ts` creates the order with `paymentStatus: "pending"` and hands back a
  redirect URL — nothing more.
- Webhook signatures are verified (HMAC-SHA256 against `SAFEPAY_WEBHOOK_SECRET`) before any data
  from the payload is trusted; an invalid signature returns HTTP 400 and touches no database row.
- Webhook processing is idempotent: each event's provider ID is recorded in
  `processed_webhook_events`, so a redelivered webhook is a no-op on the second delivery.
- No card number, CVV, or other sensitive payment credential is ever stored in this database —
  only the gateway's payment/token ID (`payments.providerPaymentId`).
- Checkout always recomputes price, stock, coupon discount, shipping, and total **server-side**
  from the database at the moment of order creation (`actions/checkout.ts`) — nothing from the
  cart page or client state is trusted for money math.

## File upload security

- Product images upload directly to Cloudflare R2 via short-lived (5-minute) presigned URLs
  (`lib/r2/upload.ts`) — the browser never receives R2 credentials, and files never pass through
  our server.
- MIME type and file size are validated **before** a presigned URL is issued, against a fixed
  allowlist (`image/jpeg`, `image/png`, `image/webp`, `image/avif`, ≤8MB).
- The stored object key is always server-generated (`randomUUID()`) — the original filename is
  never used as or embedded in the storage path, which rules out path traversal via a crafted
  filename.
- Only `manager` role or above can request an upload URL (`actions/uploads.ts`).

## Database security

- All queries go through Drizzle ORM with parameterized queries — no raw string-concatenated SQL
  exists in the codebase, which rules out classic SQL injection.
- Foreign keys, unique constraints, and indexes are defined on every relevant column
  (`db/schema/tables.ts`).
- Soft deletion (`deletedAt`) is used for products so order history referencing a since-deleted
  product remains intact; storefront queries always filter `deletedAt IS NULL`.
- Stock changes during checkout happen inside a database transaction with row reservation
  (`actions/checkout.ts`), preventing two simultaneous checkouts from overselling the same unit.

## Rate limiting

- `lib/rate-limit.ts` implements a Redis-backed fixed-window limiter. Applied to: the contact
  form (5/10min/IP), review submission (5/hour/user), and Better Auth's own auth endpoints
  (10/min/IP, configured separately in `lib/auth/index.ts`).
- If `REDIS_URL` is not configured, rate limiting is skipped (fails open) rather than blocking all
  traffic — appropriate for local development, but **`REDIS_URL` must be set in production**.

## Webhook security

- See "Payment security" above — signature verification and idempotency are the two controls that
  matter here. Never remove either when modifying `app/api/webhooks/safepay/route.ts`.

## Security headers

Configure the following at your CDN/edge layer (Cloudflare) or in `next.config.js`:
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy` scoped to the domains this app actually calls (Safepay, R2 public
  URL, your Resend/email provider)

## Dependency updates

- Run `npm audit` regularly and subscribe to GitHub's Dependabot alerts for this repository.
- Review the changelog of `better-auth`, `drizzle-orm`, and `@sfpy/node-sdk` before upgrading —
  these three touch authentication, data access, and payments respectively.

## Incident response (basics)

1. **Contain** — rotate the affected secret(s) immediately (Safepay keys, R2 keys,
   `BETTER_AUTH_SECRET`, `DATABASE_URL` password) via each provider's dashboard, then redeploy.
2. **Assess** — check `audit_logs` for the affected time window; every admin write in this app is
   logged there with actor, action, target, and metadata.
3. **Notify** — if customer payment or personal data may have been exposed, follow applicable
   local breach-notification requirements.
4. **Review** — once resolved, add a regression test under `tests/` covering the failure mode.
