// Vercel Node.js serverless function — GET /api/carbon?url=<url>
//
// Fetches the target URL server-side (avoids browser CORS), measures the
// transferred size of the main HTML response, and estimates CO2 grams per
// pageview using the Sustainable Web Design (SWD) model v4 via the
// `@tgwf/co2` package (The Green Web Foundation's open-source, peer-reviewed
// methodology: https://developers.thegreenwebfoundation.org/co2js/methods/).
//
// IMPORTANT SIMPLIFICATION: this measures only the main HTML document's
// transferred bytes from a single request, not a full resource waterfall
// (CSS/JS/images/fonts/XHR that a real browser would also load). It's a
// same-request proxy for page weight, not a full measurement — surfaced
// clearly in the API response and the UI. A real "view source" of transferred
// bytes for the whole page needs a headless browser (Puppeteer/Playwright),
// which is out of scope for a zero-server-cost static deploy.

const { co2 } = require("@tgwf/co2");

const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; WebsiteCarbonFootprintBot/1.0; +https://website-carbon-footprint.vercel.app)";

// Published, citable comparison point: IEA's corrected 2020 estimate for
// video streaming is ~36g CO2 per hour of streaming (vs. earlier inflated
// figures). Source: George Kamiya, IEA (2020), "The carbon footprint of
// streaming video: fact-checking the headlines,"
// https://www.iea.org/commentaries/the-carbon-footprint-of-streaming-video-fact-checking-the-headlines
const STREAMING_G_CO2_PER_HOUR = 36;
const STREAMING_G_CO2_PER_SECOND = STREAMING_G_CO2_PER_HOUR / 3600;

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

function normalizeUrl(input) {
  let url = String(input || "").trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  try {
    new URL(url);
    return url;
  } catch (err) {
    return null;
  }
}

function streamingComparison(grams) {
  const seconds = grams / STREAMING_G_CO2_PER_SECOND;
  if (seconds < 60) {
    return `roughly equivalent to ${seconds < 1 ? "under a second" : `${Math.round(seconds)} second${Math.round(seconds) === 1 ? "" : "s"}`} of video streaming`;
  }
  const minutes = seconds / 60;
  return `roughly equivalent to ${minutes < 10 ? minutes.toFixed(1) : Math.round(minutes)} minute${minutes >= 1.05 ? "s" : ""} of video streaming`;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed. Use GET." });
    return;
  }

  const targetUrl = normalizeUrl((req.query || {}).url);
  if (!targetUrl) {
    res.status(400).json({ error: "Provide a valid ?url= parameter, e.g. ?url=example.com" });
    return;
  }

  let response;
  let html;
  try {
    const { signal, clear } = withTimeout(FETCH_TIMEOUT_MS);
    try {
      response = await fetch(targetUrl, {
        method: "GET",
        redirect: "follow",
        signal,
        headers: { "User-Agent": USER_AGENT },
      });
    } finally {
      clear();
    }
    html = await response.text();
  } catch (err) {
    res.status(502).json({
      error: `Could not fetch that URL: ${err.message || "unknown error"}`,
    });
    return;
  }

  const finalUrl = response.url || targetUrl;

  // Prefer the server's own reported Content-Length (transferred bytes) if
  // present; otherwise fall back to the decoded body's byte length.
  const contentLengthHeader = response.headers.get("content-length");
  const decodedBytes = Buffer.byteLength(html, "utf8");
  const transferredBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : decodedBytes;
  const bytesUsed = Number.isFinite(transferredBytes) && transferredBytes > 0 ? transferredBytes : decodedBytes;

  // green=false: we don't verify the hosting provider's renewable-energy
  // status in this pass (that requires a separate green-hosting-directory
  // lookup), so we conservatively assume grid-average (non-green) hosting,
  // per the SWD model's own "green" flag semantics.
  const emissions = new co2({ model: "swd", version: 4, rating: true });
  const { total: gramsPerVisit, rating } = emissions.perVisit(bytesUsed, false);

  const result = {
    url: finalUrl,
    fetchedAt: new Date().toISOString(),
    pageWeight: {
      bytes: bytesUsed,
      kb: Math.round((bytesUsed / 1024) * 10) / 10,
      source: contentLengthHeader ? "content-length header" : "decoded response body length",
      note: "Simplified same-request estimate: measures only the main HTML document from a single fetch, not a full resource waterfall (CSS/JS/images/fonts a real browser would also load). Real total page weight is typically higher.",
    },
    co2: {
      gramsPerVisit: Math.round(gramsPerVisit * 1000) / 1000,
      rating,
      model: "Sustainable Web Design model v4 (The Green Web Foundation, @tgwf/co2)",
      assumedGreenHosting: false,
      comparison: streamingComparison(gramsPerVisit),
      comparisonSource: "IEA (2020), 'The carbon footprint of streaming video: fact-checking the headlines' — ~36g CO2/hour of streaming",
    },
  };

  res.status(200).json(result);
};
