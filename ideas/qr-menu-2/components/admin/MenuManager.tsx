"use client";

import { FormEvent, useState } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { formatCents } from "@/lib/money";
import { createClient } from "@/lib/supabase/client";

export interface CategoryRow {
  id: string;
  name: string;
  sort_order: number;
}

export interface MenuItemRow {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price_cents: number;
  is_available: boolean;
  sort_order: number;
}

export function MenuManager({
  restaurantId,
  initialCategories,
  initialItems,
}: {
  restaurantId: string;
  initialCategories: CategoryRow[];
  initialItems: MenuItemRow[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState(initialItems);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [itemForm, setItemForm] = useState({
    categoryId: initialCategories[0]?.id ?? "",
    name: "",
    description: "",
    price: "",
  });
  const [submittingItem, setSubmittingItem] = useState(false);

  async function handleAddCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newCategoryName.trim()) return;
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("qr_menu_2_categories")
      .insert({
        restaurant_id: restaurantId,
        name: newCategoryName.trim(),
        sort_order: categories.length,
      })
      .select("id, name, sort_order")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Failed to add category.");
      return;
    }

    setCategories((prev) => [...prev, data]);
    setItemForm((prev) => (prev.categoryId ? prev : { ...prev, categoryId: data.id }));
    setNewCategoryName("");
    setError(null);
  }

  async function handleDeleteCategory(id: string) {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("qr_menu_2_categories")
      .delete()
      .eq("id", id);
    if (!deleteError) {
      setCategories((prev) => prev.filter((category) => category.id !== id));
      setItems((prev) =>
        prev.map((item) => (item.category_id === id ? { ...item, category_id: null } : item)),
      );
    }
  }

  async function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const priceCents = Math.round(Number(itemForm.price) * 100);
    if (!itemForm.name.trim() || !Number.isFinite(priceCents) || priceCents < 0) {
      setError("Enter a name and a valid price.");
      return;
    }

    setSubmittingItem(true);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("qr_menu_2_menu_items")
      .insert({
        restaurant_id: restaurantId,
        category_id: itemForm.categoryId || null,
        name: itemForm.name.trim(),
        description: itemForm.description.trim() || null,
        price_cents: priceCents,
        sort_order: items.length,
      })
      .select("id, category_id, name, description, price_cents, is_available, sort_order")
      .single();

    setSubmittingItem(false);

    if (insertError || !data) {
      setError(insertError?.message ?? "Failed to add item.");
      return;
    }

    setItems((prev) => [...prev, data]);
    setItemForm((prev) => ({ ...prev, name: "", description: "", price: "" }));
    setError(null);
  }

  async function toggleAvailable(item: MenuItemRow) {
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("qr_menu_2_menu_items")
      .update({ is_available: !item.is_available })
      .eq("id", item.id);
    if (!updateError) {
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, is_available: !row.is_available } : row)),
      );
    }
  }

  async function handleDeleteItem(id: string) {
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("qr_menu_2_menu_items").delete().eq("id", id);
    if (!deleteError) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h3 className="mb-2 text-sm font-semibold">Categories</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span
              key={category.id}
              className="flex items-center gap-2 rounded-brand border border-border px-3 py-1 text-sm"
            >
              {category.name}
              <button
                type="button"
                onClick={() => handleDeleteCategory(category.id)}
                aria-label={`Delete ${category.name}`}
                className="text-danger"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <form onSubmit={handleAddCategory} className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="new-category">New category</label>
            <input
              id="new-category"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="Desserts"
            />
          </div>
          <Button type="submit" variant="secondary">
            Add
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-semibold">Add a menu item</h3>
        <form onSubmit={handleAddItem} className="flex flex-col gap-3">
          <div>
            <label htmlFor="item-category">Category</label>
            <select
              id="item-category"
              value={itemForm.categoryId}
              onChange={(event) => setItemForm((prev) => ({ ...prev, categoryId: event.target.value }))}
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="item-name">Name</label>
            <input
              id="item-name"
              value={itemForm.name}
              onChange={(event) => setItemForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Margherita Pizza"
            />
          </div>
          <div>
            <label htmlFor="item-description">Description (optional)</label>
            <input
              id="item-description"
              value={itemForm.description}
              onChange={(event) =>
                setItemForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="San Marzano tomato, mozzarella, basil"
            />
          </div>
          <div>
            <label htmlFor="item-price">Price (USD)</label>
            <input
              id="item-price"
              type="number"
              min="0"
              step="0.01"
              value={itemForm.price}
              onChange={(event) => setItemForm((prev) => ({ ...prev, price: event.target.value }))}
              placeholder="13.50"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={submittingItem}>
            {submittingItem ? "Adding…" : "Add item"}
          </Button>
        </form>
      </Card>

      <div className="flex flex-col gap-2">
        {items.length === 0 && <p className="text-sm text-muted">No menu items yet.</p>}
        {items.map((item) => (
          <Card key={item.id} className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">
                {item.name}{" "}
                <span className="font-mono text-sm text-muted">
                  {formatCents(item.price_cents)}
                </span>
              </p>
              {item.description && <p className="text-sm text-muted">{item.description}</p>}
              <p className="text-xs text-muted">
                {categories.find((category) => category.id === item.category_id)?.name ??
                  "Uncategorized"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={() => toggleAvailable(item)}
                className={`text-xs ${item.is_available ? "text-muted" : "text-danger"}`}
              >
                {item.is_available ? "Available" : "Sold out — tap to restore"}
              </button>
              <button type="button" onClick={() => handleDeleteItem(item.id)} className="text-xs text-danger">
                Delete
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
