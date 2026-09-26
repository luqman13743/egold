import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret && process.env.NODE_ENV === "production") {
  throw new Error("BETTER_AUTH_SECRET is not set");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    // Better Auth hashes with scrypt internally — never handle raw
    // passwords or write custom hashing here.
    minPasswordLength: 10,
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      const { sendTransactionalEmail } = await import("@/lib/email");
      await sendTransactionalEmail({
        to: user.email,
        subject: "Verify your email",
        template: "verify-email",
        data: { url, name: user.name },
      });
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once per day of activity
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  advanced: {
    // Secure, httpOnly, sameSite cookies — never readable from client JS.
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubDomainCookies: { enabled: false },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "customer",
        // Role is server-set only — never accept it from client input,
        // even on this field's own update path.
        input: false,
      },
    },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 10, // per IP per window on auth endpoints (login/register/reset)
  },
});

export type Session = typeof auth.$Infer.Session;
