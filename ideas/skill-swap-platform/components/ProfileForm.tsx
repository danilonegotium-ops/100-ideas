"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

type InitialProfile = {
  display_name: string;
  bio: string;
  skills_teach: string[];
  skills_learn: string[];
};

function parseSkills(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
}

export function ProfileForm({ initial }: { initial?: InitialProfile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial?.display_name ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [skillsTeach, setSkillsTeach] = useState(
    initial?.skills_teach.join(", ") ?? "",
  );
  const [skillsLearn, setSkillsLearn] = useState(
    initial?.skills_learn.join(", ") ?? "",
  );
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const teach = parseSkills(skillsTeach);
    const learn = parseSkills(skillsLearn);

    if (!displayName.trim()) {
      setStatus("error");
      setErrorMessage("Display name is required.");
      return;
    }
    if (teach.length === 0) {
      setStatus("error");
      setErrorMessage("List at least one skill you can teach.");
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("error");
      setErrorMessage("Your session expired — please log in again.");
      return;
    }

    const { error } = await supabase.from("skill_swap_platform_profiles").upsert(
      {
        user_id: user.id,
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        skills_teach: teach,
        skills_learn: learn,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.push("/profiles");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="displayName">Display name</label>
        <input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Maya R."
          required
        />
      </div>
      <div>
        <label htmlFor="bio">Bio (optional)</label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={2}
        />
      </div>
      <div>
        <label htmlFor="skillsTeach">Skills you can teach (comma-separated)</label>
        <input
          id="skillsTeach"
          value={skillsTeach}
          onChange={(e) => setSkillsTeach(e.target.value)}
          placeholder="e.g. Photoshop, UI Design"
          required
        />
      </div>
      <div>
        <label htmlFor="skillsLearn">Skills you want to learn (comma-separated)</label>
        <input
          id="skillsLearn"
          value={skillsLearn}
          onChange={(e) => setSkillsLearn(e.target.value)}
          placeholder="e.g. Piano, Music Theory"
        />
      </div>

      {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}

      <Button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
