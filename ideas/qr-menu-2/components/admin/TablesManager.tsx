"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";
import { QRCodeImage } from "./QRCodeImage";

export interface TableRow {
  id: string;
  label: string;
}

export function TablesManager({
  restaurantId,
  restaurantSlug,
  initialTables,
}: {
  restaurantId: string;
  restaurantSlug: string;
  initialTables: TableRow[];
}) {
  const [tables, setTables] = useState(initialTables);
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function handleAddTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!label.trim()) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("qr_menu_2_tables")
      .insert({ restaurant_id: restaurantId, label: label.trim() })
      .select("id, label")
      .single();

    if (insertError || !data) {
      setError(
        insertError?.code === "23505"
          ? "A table with that name already exists."
          : insertError?.message ?? "Failed to add table.",
      );
      setSubmitting(false);
      return;
    }

    setTables((prev) => [...prev, data]);
    setLabel("");
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("qr_menu_2_tables").delete().eq("id", id);
    if (!deleteError) {
      setTables((prev) => prev.filter((table) => table.id !== id));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <form onSubmit={handleAddTable} className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="table-label">New table</label>
            <input
              id="table-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Table 5"
            />
          </div>
          <Button type="submit" disabled={submitting}>
            Add table
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </Card>

      {tables.length === 0 ? (
        <p className="text-sm text-muted">No tables yet — add one above to get a QR code.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {tables.map((table) => {
            const url = `${origin}/r/${restaurantSlug}/t/${table.id}`;
            const isExpanded = expandedId === table.id;
            return (
              <Card key={table.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{table.label}</p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-sm text-accent"
                      onClick={() => setExpandedId(isExpanded ? null : table.id)}
                    >
                      {isExpanded ? "Hide QR code" : "Show QR code"}
                    </button>
                    <button
                      type="button"
                      className="text-sm text-danger"
                      onClick={() => handleDelete(table.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {isExpanded && origin && (
                  <div className="mt-4 flex flex-col items-start gap-2">
                    <QRCodeImage value={url} />
                    <p className="break-all text-xs text-muted">{url}</p>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-accent"
                    >
                      Open customer view
                    </a>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
