import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient, getUser } from "@/lib/supabase/server";

export default async function Home() {
  const user = await getUser();

  if (!user) {
    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
          <h1 className="mb-2 text-2xl font-semibold">Virtual Book Club</h1>
          <p className="mb-6 text-muted">
            Run a private book club online: propose books, vote on what to
            read next, and keep track of your current book and next
            meeting.
          </p>
          <Card className="mb-6">
            <p className="text-sm text-muted">
              Clubs are private — you need to create one or be invited by
              email to see anything inside it.
            </p>
          </Card>
          <Link href="/login?next=/">
            <Button variant="primary">Log in to get started</Button>
          </Link>
        </main>
      </>
    );
  }

  const supabase = createClient();

  const { data: memberships } = await supabase
    .from("virtual_book_club_members")
    .select("club_id")
    .eq("user_id", user.id);

  const myClubIds = (memberships ?? []).map((m) => m.club_id);

  const { data: myClubs } = myClubIds.length
    ? await supabase
        .from("virtual_book_club_clubs")
        .select("id, name, current_book_title, current_book_author, next_meeting_at")
        .in("id", myClubIds)
    : { data: [] as never[] };

  const { data: myInvites } = await supabase
    .from("virtual_book_club_invites")
    .select("id, club_id")
    .ilike("email", user.email ?? "");

  const pendingInviteClubIds = (myInvites ?? [])
    .map((i) => i.club_id)
    .filter((id) => !myClubIds.includes(id));

  const { data: invitedClubs } = pendingInviteClubIds.length
    ? await supabase
        .from("virtual_book_club_clubs")
        .select("id, name")
        .in("id", pendingInviteClubIds)
    : { data: [] as never[] };

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Your clubs</h1>
          <Link href="/clubs/new">
            <Button variant="primary">Create a club</Button>
          </Link>
        </div>

        {invitedClubs && invitedClubs.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-fg">
              Invitations
            </h2>
            <div className="flex flex-col gap-2">
              {invitedClubs.map((club) => (
                <Link key={club.id} href={`/clubs/${club.id}`} className="no-underline">
                  <Card className="transition-colors hover:border-accent">
                    <p className="text-sm text-fg">
                      You&apos;ve been invited to <strong>{club.name}</strong>
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {myClubs && myClubs.length > 0 ? (
          <div className="flex flex-col gap-3">
            {myClubs.map((club) => (
              <Link key={club.id} href={`/clubs/${club.id}`} className="no-underline">
                <Card className="transition-colors hover:border-accent">
                  <h2 className="mb-1 text-base font-semibold text-fg">
                    {club.name}
                  </h2>
                  {club.current_book_title && (
                    <p className="text-sm text-muted">
                      Currently reading: {club.current_book_title}
                      {club.current_book_author ? ` by ${club.current_book_author}` : ""}
                    </p>
                  )}
                  {club.next_meeting_at && (
                    <p className="text-xs text-muted">
                      Next meeting: {new Date(club.next_meeting_at).toLocaleString()}
                    </p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-muted">
              You&apos;re not in any clubs yet — create one to get started.
            </p>
          </Card>
        )}
      </main>
    </>
  );
}
