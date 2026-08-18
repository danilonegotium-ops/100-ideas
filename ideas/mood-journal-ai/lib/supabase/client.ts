import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components ("use client").
 *
 * Create this INSIDE an event handler or `useEffect` — never at module
 * scope and never directly in a component's render body. `createBrowserClient`
 * throws if the env vars are missing, and Next.js still server-renders
 * Client Components once (during build for static pages, or on first
 * request for dynamic ones) to produce their initial HTML. Calling this at
 * render time would make the build/request depend on real Supabase
 * credentials existing, which defeats the point of this being a template.
 *
 * Good:  `async function onSubmit() { const supabase = createClient(); ... }`
 * Bad:   `export default function Page() { const supabase = createClient(); ... }`
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
