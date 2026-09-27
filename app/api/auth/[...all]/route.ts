import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Mounts every Better Auth endpoint (sign-up, sign-in, sign-out, verify,
// forgot/reset password, Google OAuth callback, session) under /api/auth/*.
export const { GET, POST } = toNextJsHandler(auth);
