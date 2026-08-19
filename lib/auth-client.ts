import { createAuthClient } from "better-auth/react";

/**
 * In the browser the auth endpoints are always on the page's own origin, so
 * that is what the client must call. Pointing it at a fixed URL breaks the
 * moment the app is reached over another hostname — the apex domain, a Vercel
 * preview, or the *.vercel.app URL — because the request then leaves the origin
 * and the browser blocks it on CORS.
 *
 * The env var is only the fallback for server-side rendering, where there is no
 * current origin to read.
 */
const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000");

export const authClient = createAuthClient({ baseURL });

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
