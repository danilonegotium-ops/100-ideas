"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./client";

/**
 * Client Component hook for reactive auth state (e.g. a header that shows
 * "logged in as X" / a login link). Runs entirely in `useEffect`, which
 * never executes during server rendering, so it's safe regardless of
 * whether Supabase env vars are configured.
 *
 * For Server Components, prefer `getUser()` from `lib/supabase/server.ts`
 * instead — it's simpler and avoids a client-side loading flash.
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
