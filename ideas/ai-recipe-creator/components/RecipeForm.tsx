"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import {
  MAX_INGREDIENTS_INPUT_LENGTH,
  MIN_INGREDIENTS,
  parseIngredientsInput,
  Recipe,
} from "@/lib/prompt";

interface ApiResponse {
  recipe?: Recipe | null;
  raw?: string | null;
  error?: string;
}

export function RecipeForm() {
  const [ingredientsInput, setIngredientsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [raw, setRaw] = useState<string | null>(null);

  const parsedCount = parseIngredientsInput(ingredientsInput).length;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (parsedCount < MIN_INGREDIENTS) {
      setError(`Please list at least ${MIN_INGREDIENTS} ingredients.`);
      return;
    }

    setLoading(true);
    setError(null);
    setRecipe(null);
    setRaw(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingredientsInput }),
      });
      const data: ApiResponse = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      if (data.recipe) {
        setRecipe(data.recipe);
      } else if (data.raw) {
        setRaw(data.raw);
      } else {
        setError("The AI didn't return a recipe. Please try again.");
      }
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="ingredients">
            Ingredients you have (comma or newline separated, at least{" "}
            {MIN_INGREDIENTS})
          </label>
          <textarea
            id="ingredients"
            required
            rows={4}
            maxLength={MAX_INGREDIENTS_INPUT_LENGTH}
            placeholder="e.g. chicken thighs, spinach, feta cheese"
            value={ingredientsInput}
            onChange={(e) => setIngredientsInput(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted">
            {parsedCount} ingredient{parsedCount === 1 ? "" : "s"} detected —{" "}
            {ingredientsInput.length}/{MAX_INGREDIENTS_INPUT_LENGTH}
          </p>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Cooking up a recipe..." : "Generate recipe"}
        </Button>
      </form>

      {error && (
        <Card className="mt-6 border-danger">
          <p className="text-sm text-danger">{error}</p>
        </Card>
      )}

      {recipe && (
        <Card className="mt-6">
          <h2 className="mb-3 text-xl font-semibold">{recipe.title}</h2>

          <h3 className="mb-1 text-sm font-semibold text-muted">
            Ingredients
          </h3>
          <ul className="mb-4 list-inside list-disc space-y-1 text-sm">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>{ing}</li>
            ))}
          </ul>

          <h3 className="mb-1 text-sm font-semibold text-muted">Steps</h3>
          <ol className="list-inside list-decimal space-y-2 text-sm">
            {recipe.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </Card>
      )}

      {raw && (
        <Card className="mt-6">
          <p className="mb-2 text-xs text-muted">
            The AI responded, but not in the expected format. Here&apos;s the raw
            response:
          </p>
          <pre className="whitespace-pre-wrap font-mono text-sm">{raw}</pre>
        </Card>
      )}
    </>
  );
}
