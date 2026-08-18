"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import type { Member, Pairing, PairingWeek } from "@/lib/watercooler/types";

export function DashboardClient() {
  const [members, setMembers] = useState<Member[]>([]);
  const [week, setWeek] = useState<PairingWeek | null>(null);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [running, setRunning] = useState(false);
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();

    // RLS scopes both queries to the logged-in owner automatically — no
    // need to filter by owner_id client-side.
    const [membersResult, weeksResult] = await Promise.all([
      supabase
        .from("remote_team_watercooler_members")
        .select("*")
        .order("created_at", { ascending: true }),
      supabase
        .from("remote_team_watercooler_pairing_weeks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    if (membersResult.error) setError(membersResult.error.message);
    if (weeksResult.error) setError(weeksResult.error.message);

    setMembers(membersResult.data ?? []);

    const latestWeek: PairingWeek | null = weeksResult.data?.[0] ?? null;
    setWeek(latestWeek);

    if (latestWeek) {
      const { data: pairingRows, error: pairingError } = await supabase
        .from("remote_team_watercooler_pairings")
        .select("*")
        .eq("week_id", latestWeek.id)
        .order("created_at", { ascending: true });
      if (pairingError) setError(pairingError.message);
      const rows: Pairing[] = pairingRows ?? [];
      setPairings(rows);
      const drafts: Record<string, string> = {};
      rows.forEach((p) => (drafts[p.id] = p.meeting_link));
      setLinkDrafts(drafts);
    } else {
      setPairings([]);
      setLinkDrafts({});
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setAdding(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not logged in.");
      setAdding(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("remote_team_watercooler_members")
      .insert({ owner_id: user.id, name: name.trim(), email: email.trim() });

    if (insertError) {
      setError(insertError.message);
    } else {
      setName("");
      setEmail("");
      await loadData();
    }
    setAdding(false);
  }

  async function toggleActive(member: Member) {
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("remote_team_watercooler_members")
      .update({ active: !member.active })
      .eq("id", member.id);
    if (updateError) setError(updateError.message);
    else await loadData();
  }

  async function removeMember(member: Member) {
    if (!confirm(`Remove ${member.name}? This can't be undone.`)) return;
    setError("");
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("remote_team_watercooler_members")
      .delete()
      .eq("id", member.id);
    if (deleteError) setError(deleteError.message);
    else await loadData();
  }

  async function runPairing() {
    setRunning(true);
    setError("");
    const res = await fetch("/api/run-pairing", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Failed to run pairing.");
    } else {
      await loadData();
    }
    setRunning(false);
  }

  async function saveLink(pairingId: string) {
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("remote_team_watercooler_pairings")
      .update({ meeting_link: linkDrafts[pairingId] ?? "" })
      .eq("id", pairingId);
    if (updateError) setError(updateError.message);
    else await loadData();
  }

  function memberName(id: string) {
    return members.find((m) => m.id === id)?.name ?? "(removed member)";
  }

  const activeCount = members.filter((m) => m.active).length;

  if (loading) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {error && <p className="text-sm text-danger">{error}</p>}

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          This week&apos;s pairing
        </h2>
        {!week || pairings.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">
              No pairing has been run yet. Add at least 2 active members
              below, then run pairing.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {pairings.map((pairing) => (
              <Card key={pairing.id}>
                <p className="mb-2 text-sm font-medium text-fg">
                  {pairing.member_ids.map(memberName).join(" + ")}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="url"
                    placeholder="Paste a meeting link (Google Meet, Zoom…)"
                    value={linkDrafts[pairing.id] ?? ""}
                    onChange={(event) =>
                      setLinkDrafts((prev) => ({
                        ...prev,
                        [pairing.id]: event.target.value,
                      }))
                    }
                  />
                  <Button
                    variant="secondary"
                    onClick={() => saveLink(pairing.id)}
                  >
                    Save link
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
        <Button
          className="mt-4"
          onClick={runPairing}
          disabled={running || activeCount < 2}
        >
          {running ? "Pairing…" : "Run pairing for this week"}
        </Button>
        {activeCount < 2 && (
          <p className="mt-2 text-sm text-muted">
            Need at least 2 active members to run a pairing.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Team members</h2>
        <form
          onSubmit={handleAddMember}
          className="mb-4 flex flex-col gap-3 sm:flex-row"
        >
          <input
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Button type="submit" disabled={adding}>
            {adding ? "Adding…" : "Add member"}
          </Button>
        </form>

        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <Card
              key={member.id}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-fg">
                  {member.name}{" "}
                  {!member.active && (
                    <span className="text-xs text-muted">(inactive)</span>
                  )}
                </p>
                <p className="text-xs text-muted">{member.email}</p>
                <p className="mt-1 text-xs text-muted">
                  Personal link:{" "}
                  <code className="font-mono">/m/{member.share_token}</code>
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => toggleActive(member)}>
                  {member.active ? "Deactivate" : "Activate"}
                </Button>
                <Button variant="danger" onClick={() => removeMember(member)}>
                  Remove
                </Button>
              </div>
            </Card>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-muted">No members yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
