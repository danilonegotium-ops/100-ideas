// Balkan Recipe API — GET /api/recipes
//
// Plain Node.js Vercel serverless function (no framework — Vercel's
// zero-config static deploy auto-detects any /api/*.js file as a Node
// function). Reads the curated dataset in recipes-data.json and returns
// recipes as JSON, optionally filtered by query params:
//   ?name=sarma   — case-insensitive match against id, name, or altNames
//   ?tag=stew     — case-insensitive exact match against the tags array
// Both params can be combined (AND). No params returns the full dataset.
//
// Query params are parsed from req.url with Node's built-in `url` module
// rather than relying on req.query, so this same handler is trivially
// testable outside the Vercel runtime with a plain mock request object.

const { URL } = require("url");
const recipes = require("./recipes-data.json");

function parseQuery(req) {
  // req.url on a Vercel Node function is a path like "/api/recipes?name=sarma".
  // Base doesn't matter for parsing the query string, just needs to be valid.
  const parsed = new URL(req.url, "http://localhost");
  const query = {};
  for (const [key, value] of parsed.searchParams.entries()) {
    query[key] = value;
  }
  return query;
}

/**
 * Pure filter logic, kept separate from the HTTP handler so it's easy to
 * unit test directly.
 */
function filterRecipes(list, { name, tag } = {}) {
  let results = list;

  if (name) {
    const needle = name.trim().toLowerCase();
    results = results.filter((r) => {
      const haystacks = [r.id, r.name, ...(r.altNames || [])].map((s) => s.toLowerCase());
      return haystacks.some((h) => h.includes(needle));
    });
  }

  if (tag) {
    const needle = tag.trim().toLowerCase();
    results = results.filter((r) => (r.tags || []).some((t) => t.toLowerCase() === needle));
  }

  return results;
}

function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed. Use GET." });
    return;
  }

  const query = req.query && Object.keys(req.query).length ? req.query : parseQuery(req);
  const { name, tag } = query;
  const results = filterRecipes(recipes, { name, tag });

  res.status(200).json({
    count: results.length,
    query: { name: name || null, tag: tag || null },
    results,
  });
}

module.exports = handler;
// Vercel Node functions accept a default export — CommonJS `module.exports`
// assigned to the function itself is the standard zero-config convention.
module.exports.filterRecipes = filterRecipes;
module.exports.parseQuery = parseQuery;
