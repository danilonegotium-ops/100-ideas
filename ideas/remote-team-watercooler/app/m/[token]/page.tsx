import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { resolveMemberByToken } from "@/lib/watercooler/resolveMemberByToken";
import { LinkEditor } from "./LinkEditor";

/**
 * Public page — no login required. A member reaches this via the personal
 * link their team admin shares with them (`/m/<share_token>`). Route
 * Handlers/dynamic pages that read no cookies still run per-request (not
 * prerendered) here because `resolveMemberByToken` uses the service-role
 * client, which has nothing to do with build-time static generation
 * either way — this page has no params known at build time (dynamic
 * route segment), so Next.js renders it on demand regardless.
 */
export default async function MemberPairingPage({
  params,
}: {
  params: { token: string };
}) {
  const resolved = await resolveMemberByToken(params.token);

  if (!resolved) {
    notFound();
  }

  const { member, pairing, partnerNames } = resolved;

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-headline text-fg">Hi {member.name}</h1>
        <p className="mb-6 text-muted">Your watercooler pairing this week</p>

        <GlassPanel glow>
          {!pairing ? (
            <p className="text-sm text-muted">
              No pairing yet — check back after your team admin runs this
              week&apos;s pairing.
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-fg">
                {partnerNames.length === 0
                  ? "You don't have a partner this week."
                  : partnerNames.length === 1
                    ? `You're paired with ${partnerNames[0]}.`
                    : `You're grouped with ${partnerNames.join(" and ")}.`}
              </p>
              <LinkEditor token={params.token} initialLink={pairing.meeting_link} />
            </>
          )}
        </GlassPanel>
      </main>
    </>
  );
}
