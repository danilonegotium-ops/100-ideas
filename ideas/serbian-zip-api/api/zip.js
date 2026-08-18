// Vercel Node.js serverless function — GET /api/zip
//
// Serves the GeoNames postal-code dataset for Serbia baked into the repo at
// build time (../data/rs-zip.json). No runtime external calls, no API key.
//
// Query params (mutually exclusive; ?code= takes priority if both are sent):
//   ?code=11000        exact postal code lookup
//   ?city=Novi Sad      case-insensitive partial match against place name
// With no params, returns the first `limit` records (default 50) as a sample.
//
// Data source: GeoNames.org postal code export (http://download.geonames.org/export/zip/RS.zip)
// Licensed CC BY 4.0 — attribution required, see index.html.

const records = require("../data/rs-zip.json");

const MAX_RESULTS = 200;

module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed. Use GET." });
    return;
  }

  const { code, city, limit } = req.query || {};

  let results;
  let mode;

  if (code) {
    mode = "code";
    const needle = String(code).trim();
    results = records.filter((r) => r.postalCode === needle);
  } else if (city) {
    mode = "city";
    const needle = String(city).trim().toLowerCase();
    results = records.filter((r) => r.placeName.toLowerCase().includes(needle));
  } else {
    mode = "sample";
    results = records;
  }

  const parsedLimit = Math.min(parseInt(limit, 10) || (mode === "sample" ? 50 : MAX_RESULTS), MAX_RESULTS);
  const truncated = results.length > parsedLimit;
  results = results.slice(0, parsedLimit);

  res.status(200).json({
    query: { code: code || null, city: city || null },
    count: results.length,
    truncated,
    attribution: "Postal code data © GeoNames.org, CC BY 4.0 (https://www.geonames.org)",
    results,
  });
};
