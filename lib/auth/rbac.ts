import { headers } from "next/headers";
import { auth } from "./index";

export type Role = "super_admin" | "admin" | "manager" | "staff" | "customer";

// Roles ranked so "at least manager" checks are a single comparison.
const ROLE_RANK: Record<Role, number> = {
  customer: 0,
  staff: 1,
  manager: 2,
  admin: 3,
  super_admin: 4,
};

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Reads the session from cookies server-side. This is the ONLY source of
 * truth for identity — never trust a role, user id, or email sent in a
 * request body or client state.
 */
export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Throws UnauthorizedError if there is no signed-in user. Returns the session. */
export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

/**
 * Throws unless the current user's role is at or above `minimum`.
 * Call this at the top of every admin Server Action / Route Handler —
 * hiding a button in the UI is never sufficient authorization.
 */
export async function requireRole(minimum: Role) {
  const session = await requireSession();
  const role = (session.user as { role?: Role }).role ?? "customer";
  if (ROLE_RANK[role] < ROLE_RANK[minimum]) {
    throw new ForbiddenError(`Requires role >= ${minimum}, got ${role}`);
  }
  return session;
}

/** True/false version for conditional UI rendering — never for the actual guard. */
export async function hasRole(minimum: Role): Promise<boolean> {
  try {
    await requireRole(minimum);
    return true;
  } catch {
    return false;
  }
}
