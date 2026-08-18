import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { PlaydateApp } from "@/components/PlaydateApp";
import { createClient, getUser } from "@/lib/supabase/server";
import type { Dog, Swipe } from "@/lib/types";

export default async function Home() {
  const user = await getUser();

  if (!user) {
    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
          <h1 className="mb-2 text-2xl font-semibold">
            Pet Playdate Finder
          </h1>
          <p className="mb-6 text-muted">
            A &quot;Tinder&quot; for dogs — find park buddies for your pup.
            Swipe yes/no on other dogs in your area, and when you both say
            yes, it&apos;s a match.
          </p>
          <Card>
            <p className="mb-4 text-sm text-muted">
              Log in with a magic link to create your dog&apos;s profile.
            </p>
            <Link href="/login">
              <Button>Log in</Button>
            </Link>
          </Card>
        </main>
      </>
    );
  }

  const supabase = createClient();
  const { data: myDogsData, error: myDogsError } = await supabase
    .from("pet_playdate_finder_dogs")
    .select(
      "id, owner_id, name, breed, size, energy_level, neighborhood, bio, photo_url, created_at",
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  const myDogs: Dog[] = myDogsError ? [] : (myDogsData ?? []);
  const myDogIds = myDogs.map((d) => d.id);

  let otherDogs: Dog[] = [];
  let outgoingSwipes: Swipe[] = [];
  let incomingSwipes: Swipe[] = [];

  if (myDogs.length > 0) {
    const [
      { data: otherDogsData },
      { data: outgoingData },
      { data: incomingData },
    ] = await Promise.all([
      supabase
        .from("pet_playdate_finder_dogs")
        .select(
          "id, owner_id, name, breed, size, energy_level, neighborhood, bio, photo_url, created_at",
        )
        .neq("owner_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("pet_playdate_finder_swipes")
        .select("id, from_dog_id, to_dog_id, direction, created_at")
        .in("from_dog_id", myDogIds),
      supabase
        .from("pet_playdate_finder_swipes")
        .select("id, from_dog_id, to_dog_id, direction, created_at")
        .in("to_dog_id", myDogIds),
    ]);

    otherDogs = otherDogsData ?? [];
    outgoingSwipes = outgoingData ?? [];
    incomingSwipes = incomingData ?? [];
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Pet Playdate Finder</h1>
        <p className="mb-6 text-muted">
          Logged in as <strong className="text-fg">{user.email}</strong>.
        </p>
        {myDogsError && (
          <Card className="mb-6 border-danger">
            <p className="text-sm text-danger">
              Couldn&apos;t load your dogs: {myDogsError.message}
            </p>
          </Card>
        )}
        <PlaydateApp
          ownerId={user.id}
          initialMyDogs={myDogs}
          initialOtherDogs={otherDogs}
          initialOutgoingSwipes={outgoingSwipes}
          initialIncomingSwipes={incomingSwipes}
        />
      </main>
    </>
  );
}
