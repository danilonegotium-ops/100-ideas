import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { createClient, getUser } from "@/lib/supabase/server";
import { formatDateTime, isCheckedInToday, membershipState, type Checkin, type Member } from "@/lib/types";
import { AddMemberForm } from "@/components/AddMemberForm";
import { CheckInPanel } from "@/components/CheckInPanel";
import { MemberTable } from "@/components/MemberTable";
import { SignOutButton } from "@/components/SignOutButton";
import { StatTile } from "@/components/motion/StatTile";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { EmptyState } from "@/components/motion/EmptyState";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();

  const [{ data: memberRows, error: membersError }, { data: checkinRows }] = await Promise.all([
    supabase.from("micro_saas_gyms_members").select("*").order("full_name", { ascending: true }),
    supabase
      .from("micro_saas_gyms_checkins")
      .select("*")
      .order("checked_in_at", { ascending: false })
      .limit(20),
  ]);

  const members = (memberRows ?? []) as Member[];
  const checkins = (checkinRows ?? []) as Checkin[];
  const memberById = new Map(members.map((member) => [member.id, member]));

  const checkedInTodayIds = Array.from(
    new Set(checkins.filter((checkin) => isCheckedInToday(checkin.checked_in_at)).map((checkin) => checkin.member_id)),
  );

  const activeCount = members.filter((member) => {
    const state = membershipState(member);
    return state === "active" || state === "expiring";
  }).length;
  const expiringCount = members.filter((member) => membershipState(member) === "expiring").length;

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-2xl font-semibold">Gym dashboard</h1>
            <p className="text-sm text-muted">Signed in as {user.email}</p>
          </div>
          <SignOutButton />
        </div>

        {membersError && (
          <Card className="mb-6 border-danger">
            <p className="text-sm text-danger">Couldn&apos;t load members: {membersError.message}</p>
          </Card>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Active members" value={activeCount} />
          <StatTile label="Checked in today" value={checkedInTodayIds.length} />
          <StatTile
            label="Expiring soon"
            value={expiringCount}
            suffix=""
            trend="within 7 days"
            trendTone={expiringCount > 0 ? "negative" : "neutral"}
            className={expiringCount > 0 ? "border-danger" : undefined}
          />
        </div>

        <Card className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Check in a member</h2>
          <CheckInPanel members={members} checkedInTodayIds={checkedInTodayIds} />
        </Card>

        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Recent check-ins</h2>
          {checkins.length === 0 ? (
            <EmptyState
              title="No check-ins yet"
              description="Check in a member above and they'll show up here."
            />
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {checkins.slice(0, 10).map((checkin, i) => (
                <AnimatedCard key={checkin.id} index={i} hoverLift={false} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <span>{memberById.get(checkin.member_id)?.full_name ?? "Unknown member"}</span>
                  <span className="text-muted">{formatDateTime(checkin.checked_in_at)}</span>
                </AnimatedCard>
              ))}
            </div>
          )}
        </div>

        <Card className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Add member</h2>
          <AddMemberForm />
        </Card>

        <h2 className="mb-3 text-lg font-semibold">All members</h2>
        {members.length === 0 ? (
          <EmptyState
            title="No members yet"
            description="Add your first member above to start tracking check-ins and expirations."
          />
        ) : (
          <MemberTable members={members} />
        )}
      </main>
    </>
  );
}
