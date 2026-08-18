import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request that passes through
 * `middleware.ts`. This is what keeps users logged in across page loads —
 * without it, expired access tokens never get refreshed server-side and
 * users get randomly signed out.
 *
 * If Supabase env vars aren't configured yet (e.g. a fresh copy of this
 * template before real credentials exist), this no-ops instead of
 * throwing, so `npm run dev` still works for building non-auth pages.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        // Auth cookie responses must never be cached by a CDN/reverse proxy
        // (Vercel Edge included) — otherwise one user's session could be
        // served to another user.
        Object.entries(headers).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value),
        );
      },
    },
  });

  // IMPORTANT: don't add logic between createServerClient and
  // auth.getUser(). A dropped call here is a very hard to debug way to
  // randomly log users out.
  await supabase.auth.getUser();

  return supabaseResponse;
}
