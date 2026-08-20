import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { EmptyState } from "@/components/motion/EmptyState";
import { SwapActions } from "@/components/SwapActions";
import { createClient, getUser } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type Swap = {
  id: string;
  requester_user_id: string;
  target_profile_id: string;
  offered_skill: string;
  requested_skill: string;
  message: string | null;
  status: "pending" | "accepted" | "declined" | "cancelled";
  created_at: string;
};

/**
 * "My swaps" — everything where I'm either the requester or the owner of
 * the target profile. Deliberately avoids Supabase's foreign-table embed
 * syntax (`select('*, other(...)')`) for the "other party" lookup, since
 * `skill_swap_platform_swaps` only has one FK into
 * `skill_swap_platform_profiles` (target_profile_id) but the *requester*
 * side has no FK into profiles at all (it's keyed by auth user id) — two
 * plain follow-up queries plus a manual JS join are simpler to reason
 * about correctly than guessing at embed/alias syntax.
 */
export default async function SwapsPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/swaps");
  }

  const supabase = createClient();

  const { data: myProfile } = await supabase
    .from("skill_swap_platform_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  let orFilter = `requester_user_id.eq.${user.id}`;
  if (myProfile) {
    orFilter += `,target_profile_id.eq.${myProfile.id}`;
  }

  const { data: swaps, error } = await supabase
    .from("skill_swap_platform_swaps")
    .select(
      "id, requester_user_id, target_profile_id, offered_skill, requested_skill, message, status, created_at",
    )
    .or(orFilter)
    .order("created_at", { ascending: false });

  const rows: Swap[] = swaps ?? [];

  const targetProfileIds = Array.from(
    new Set(
      rows
        .filter((s) => s.requester_user_id === user.id)
        .map((s) => s.target_profile_id),
    ),
  );
  const requesterUserIds = Array.from(
    new Set(
      rows
        .filter((s) => s.requester_user_id !== user.id)
        .map((s) => s.requester_user_id),
    ),
  );

  const [targetNames, requesterNames] = await Promise.all([
    targetProfileIds.length > 0
      ? supabase
          .from("skill_swap_platform_profiles")
          .select("id, display_name")
          .in("id", targetProfileIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string }[] }),
    requesterUserIds.length > 0
      ? supabase
          .from("skill_swap_platform_profiles")
          .select("user_id, display_name")
          .in("user_id", requesterUserIds)
      : Promise.resolve({
          data: [] as { user_id: string | null; display_name: string }[],
        }),
  ]);

  const targetNameById = new Map(
    (targetNames.data ?? []).map((p) => [p.id, p.display_name]),
  );
  const requesterNameByUserId = new Map(
    (requesterNames.data ?? []).map((p) => [p.user_id, p.display_name]),
  );

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">My swaps</h1>
        <p className="mb-6 text-muted">
          Proposals you&apos;ve sent and proposals sent to you.
        </p>

        {error && (
          <Card className="mb-4">
            <p className="text-sm text-danger">
              Couldn&apos;t load your swaps right now (
              {error.message || "Supabase isn't configured yet"}
              ). This page needs a live Supabase project — see SPEC.md.
            </p>
          </Card>
        )}

        {!error && rows.length === 0 && (
          <EmptyState
            title="No swaps yet"
            description="Browse members to propose one."
            action={
              <a href="/profiles" className="text-sm text-accent underline">
                Browse members
              </a>
            }
          />
        )}

        <div className="flex flex-col gap-3">
          {rows.map((swap, i) => {
            const iAmRequester = swap.requester_user_id === user.id;
            const otherName = iAmRequester
              ? targetNameById.get(swap.target_profile_id) ?? "them"
              : requesterNameByUserId.get(swap.requester_user_id) ?? "them";
            const isMatch = swap.status === "accepted";

            return (
              <AnimatedCard key={swap.id} index={i} hoverLift={false}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-fg">
                    {iAmRequester ? `You → ${otherName}` : `${otherName} → you`}
                  </h2>
                  <span
                    className={cn(
                      "whitespace-nowrap rounded-brand border px-2 py-0.5 text-xs capitalize",
                      isMatch
                        ? "animate-glow-pulse border-accent text-accent-strong"
                        : "border-border text-muted",
                    )}
                  >
                    {isMatch ? "🤝 matched" : swap.status}
                  </span>
                </div>
                <p className="text-sm text-muted">
                  {iAmRequester ? "You teach" : "They teach"}{" "}
                  <span className="text-fg">{swap.offered_skill}</span> ·{" "}
                  {iAmRequester ? "they teach" : "you teach"}{" "}
                  <span className="text-fg">{swap.requested_skill}</span>
                </p>
                {swap.message && (
                  <p className="mt-1 text-sm text-muted">
                    &quot;{swap.message}&quot;
                  </p>
                )}
                <SwapActions
                  swapId={swap.id}
                  role={iAmRequester ? "requester" : "target"}
                  status={swap.status}
                />
              </AnimatedCard>
            );
          })}
        </div>
      </main>
    </>
  );
}
