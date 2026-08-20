import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { AcceptInviteButton } from "@/components/AcceptInviteButton";
import { InviteForm } from "@/components/InviteForm";
import { ClubSettingsForm } from "@/components/ClubSettingsForm";
import { ProposalForm } from "@/components/ProposalForm";
import { VoteButton } from "@/components/VoteButton";
import { PromoteBookButton } from "@/components/PromoteBookButton";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { StatTile } from "@/components/motion/StatTile";
import { createClient, getUser } from "@/lib/supabase/server";

export default async function ClubPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUser();
  if (!user) {
    redirect(`/login?next=/clubs/${params.id}`);
  }

  const supabase = createClient();

  // RLS already restricts this to members and pending invitees — a null
  // result here means "not found, or you don't have access", and we
  // intentionally show the same generic message either way rather than
  // distinguishing (so we don't leak whether a given club id exists to
  // someone who isn't invited).
  const { data: club } = await supabase
    .from("virtual_book_club_clubs")
    .select(
      "id, name, current_book_title, current_book_author, next_meeting_at, meeting_link",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!club) {
    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
          <Card>
            <p className="text-sm text-muted">
              This club doesn&apos;t exist, or you don&apos;t have access to
              it.
            </p>
          </Card>
        </main>
      </>
    );
  }

  const { data: membership } = await supabase
    .from("virtual_book_club_members")
    .select("id")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isMember = Boolean(membership);

  if (!isMember) {
    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
          <h1 className="mb-4 text-2xl font-semibold">{club.name}</h1>
          <Card>
            <p className="mb-3 text-sm text-muted">
              You&apos;ve been invited to join this club.
            </p>
            <AcceptInviteButton clubId={club.id} />
          </Card>
        </main>
      </>
    );
  }

  const [{ data: members }, { data: proposals }] = await Promise.all([
    supabase
      .from("virtual_book_club_members")
      .select("id, user_id, member_label")
      .eq("club_id", club.id)
      .order("joined_at", { ascending: true }),
    supabase
      .from("virtual_book_club_proposals")
      .select("id, title, author, proposed_by_label, created_at")
      .eq("club_id", club.id)
      .order("created_at", { ascending: false }),
  ]);

  const proposalIds = (proposals ?? []).map((p) => p.id);
  // Supabase's `.in()` with an empty array is worth avoiding (behavior
  // varies by version) — fall back to an impossible id instead of
  // skipping the query, so the shape stays uniform.
  const { data: votes } = await supabase
    .from("virtual_book_club_votes")
    .select("id, proposal_id, user_id")
    .in(
      "proposal_id",
      proposalIds.length > 0 ? proposalIds : ["00000000-0000-0000-0000-000000000000"],
    );

  const votesByProposal = new Map<string, { id: string; user_id: string | null }[]>();
  for (const vote of votes ?? []) {
    const list = votesByProposal.get(vote.proposal_id) ?? [];
    list.push({ id: vote.id, user_id: vote.user_id });
    votesByProposal.set(vote.proposal_id, list);
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-6 text-2xl font-semibold">{club.name}</h1>

        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile label="Members" value={members?.length ?? 0} />
          <StatTile label="Open proposals" value={proposals?.length ?? 0} />
          <StatTile
            label="Total votes cast"
            value={votes?.length ?? 0}
            className="col-span-2 sm:col-span-1"
          />
        </section>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <AnimatedCard index={0}>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted">
              Currently reading
            </p>
            <p className="text-sm text-fg">
              {club.current_book_title
                ? `${club.current_book_title}${club.current_book_author ? ` by ${club.current_book_author}` : ""}`
                : "Nothing set yet"}
            </p>
          </AnimatedCard>
          <AnimatedCard index={1}>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted">
              Next meeting
            </p>
            <p className="text-sm text-fg">
              {club.next_meeting_at
                ? new Date(club.next_meeting_at).toLocaleString()
                : "Not scheduled"}
            </p>
            {club.meeting_link && (
              <a
                href={club.meeting_link}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-accent underline"
              >
                Join link
              </a>
            )}
          </AnimatedCard>
        </div>

        <AnimatedCard index={2} className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-fg">
            Update current book / meeting
          </h2>
          <ClubSettingsForm
            clubId={club.id}
            initial={{
              current_book_title: club.current_book_title ?? "",
              current_book_author: club.current_book_author ?? "",
              next_meeting_at: club.next_meeting_at ?? "",
              meeting_link: club.meeting_link ?? "",
            }}
          />
        </AnimatedCard>

        <AnimatedCard index={3} className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-fg">
            Propose the next book
          </h2>
          <ProposalForm clubId={club.id} />
          <div className="mt-4 flex flex-col gap-2">
            {(proposals ?? []).length === 0 && (
              <p className="text-sm text-muted">No proposals yet.</p>
            )}
            {(proposals ?? []).map((proposal) => {
              const proposalVotes = votesByProposal.get(proposal.id) ?? [];
              const hasVoted = proposalVotes.some((v) => v.user_id === user.id);
              return (
                <div
                  key={proposal.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-brand border border-border p-3"
                >
                  <div>
                    <p className="text-sm text-fg">
                      {proposal.title}
                      {proposal.author ? ` — ${proposal.author}` : ""}
                    </p>
                    <p className="text-xs text-muted">
                      proposed by {proposal.proposed_by_label ?? "a member"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <VoteButton
                      proposalId={proposal.id}
                      hasVoted={hasVoted}
                      voteCount={proposalVotes.length}
                    />
                    <PromoteBookButton
                      clubId={club.id}
                      title={proposal.title}
                      author={proposal.author}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </AnimatedCard>

        <AnimatedCard index={4} className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-fg">Members</h2>
          <ul className="flex flex-col gap-1">
            {(members ?? []).map((member) => (
              <li key={member.id} className="text-sm text-muted">
                {member.member_label ?? "A member"}
                {member.user_id === user.id ? " (you)" : ""}
              </li>
            ))}
          </ul>
        </AnimatedCard>

        <AnimatedCard index={5}>
          <h2 className="mb-3 text-sm font-semibold text-fg">
            Invite someone by email
          </h2>
          <InviteForm clubId={club.id} />
        </AnimatedCard>
      </main>
    </>
  );
}
