import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for use in Server Components, Server Actions, and Route
 * Handlers. Create a new instance per request — never cache/share across
 * requests.
 *
 * Reading cookies via `next/headers` marks the calling route as dynamic, so
 * Next.js renders it on demand at request time instead of trying to
 * statically prerender it at build time. That's what keeps `next build`
 * from needing real Supabase credentials: a Server Component that calls
 * this function is automatically excluded from static generation.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `cookieStore.set` throws when called from a Server Component
            // (Server Components can't write cookies). That's fine as long
            // as `middleware.ts` is refreshing the session on every
            // request — this catch just no-ops the write here.
          }
        },
      },
    },
  );
}

/**
 * Convenience helper for Server Components / Server Actions / Route
 * Handlers that just need to know who's logged in.
 *
 * Usage in a Server Component:
 *   const user = await getUser();
 *   if (!user) redirect("/login");
 */
export async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
