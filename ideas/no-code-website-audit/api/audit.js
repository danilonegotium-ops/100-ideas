// Vercel Node.js serverless function — GET /api/audit?url=<url>
//
// Fetches the target URL server-side (avoids browser CORS entirely) and runs
// a checklist of no-external-API-required SEO/technical checks, returning a
// pass/warn/fail per check plus an overall score out of 10.
//
// If GOOGLE_PAGESPEED_API_KEY is set in the environment, also calls the
// Google PageSpeed Insights API (https://developers.google.com/speed/docs/insights/v5/get-started)
// for a real Lighthouse performance score and includes it as a bonus item —
// the core 8-check score never depends on this key being present.

const FETCH_TIMEOUT_MS = 8000;
const FAVICON_TIMEOUT_MS = 3000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; NoCodeWebsiteAuditBot/1.0; +https://no-code-website-audit.vercel.app)";

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
    // Throws if genuinely invalid.
    new URL(url);
    return url;
  } catch (err) {
    return null;
  }
}

// Find all `<tagName ...>` opening tags (self-closing or not) in raw HTML.
function findTags(html, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  return html.match(re) || [];
}

// Parse attributes out of a single tag string into a plain object, keys lowercased.
function parseAttrs(tagString) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match;
  while ((match = re.exec(tagString))) {
    const name = match[1].toLowerCase();
    const value = match[2] !== undefined ? match[2] : match[3] !== undefined ? match[3] : match[4];
    attrs[name] = value;
  }
  return attrs;
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return null;
  return match[1].replace(/\s+/g, " ").trim();
}

function extractMetaContent(html, name) {
  const metas = findTags(html, "meta");
  for (const tag of metas) {
    const attrs = parseAttrs(tag);
    if (attrs.name && attrs.name.toLowerCase() === name.toLowerCase()) {
      return attrs.content || "";
    }
  }
  return null;
}

function extractFaviconHref(html) {
  const links = findTags(html, "link");
  for (const tag of links) {
    const attrs = parseAttrs(tag);
    if (attrs.rel && /icon/i.test(attrs.rel)) {
      return attrs.href || null;
    }
  }
  return null;
}

function countImagesAndAlt(html) {
  const imgs = findTags(html, "img");
  let withAlt = 0;
  for (const tag of imgs) {
    const attrs = parseAttrs(tag);
    if (attrs.alt !== undefined) withAlt += 1;
  }
  return { total: imgs.length, withAlt };
}

async function checkFaviconFallback(origin) {
  const { signal, clear } = withTimeout(FAVICON_TIMEOUT_MS);
  try {
    const res = await fetch(new URL("/favicon.ico", origin).toString(), {
      method: "GET",
      redirect: "follow",
      signal,
      headers: { "User-Agent": USER_AGENT },
    });
    return res.ok;
  } catch (err) {
    return false;
  } finally {
    clear();
  }
}

function makeCheck(id, label, status, message) {
  return { id, label, status, message };
}

async function runPageSpeed(url, apiKey) {
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("key", apiKey);
  endpoint.searchParams.set("category", "PERFORMANCE");
  endpoint.searchParams.set("strategy", "mobile");

  const { signal, clear } = withTimeout(15000);
  try {
    const res = await fetch(endpoint.toString(), { signal });
    if (!res.ok) {
      return { available: false, error: `PageSpeed API responded ${res.status}` };
    }
    const data = await res.json();
    const scoreRaw = data && data.lighthouseResult && data.lighthouseResult.categories &&
      data.lighthouseResult.categories.performance && data.lighthouseResult.categories.performance.score;
    if (typeof scoreRaw !== "number") {
      return { available: false, error: "Unexpected PageSpeed API response shape" };
    }
    const score100 = Math.round(scoreRaw * 100);
    let status;
    if (score100 >= 90) status = "pass";
    else if (score100 >= 50) status = "warn";
    else status = "fail";
    return {
      available: true,
      score: score100,
      status,
      message: `Google PageSpeed Insights (Lighthouse, mobile) performance score: ${score100}/100.`,
    };
  } catch (err) {
    return { available: false, error: `PageSpeed API call failed: ${err.message}` };
  } finally {
    clear();
  }
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

  const startedAt = Date.now();
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
  const responseTimeMs = Date.now() - startedAt;

  const finalUrl = response.url || targetUrl;
  const isHttps = finalUrl.startsWith("https://");
  const sizeBytes = Buffer.byteLength(html, "utf8");
  const sizeKb = Math.round((sizeBytes / 1024) * 10) / 10;

  const title = extractTitle(html);
  const description = extractMetaContent(html, "description");
  const viewport = extractMetaContent(html, "viewport");
  const { total: imgTotal, withAlt: imgWithAlt } = countImagesAndAlt(html);
  const faviconHref = extractFaviconHref(html);

  const checks = [];

  // 1. Title tag
  if (!title) {
    checks.push(makeCheck("title", "Title tag", "fail", "No <title> tag found (or it's empty). Every page needs one for SEO and browser tabs."));
  } else if (title.length < 10 || title.length > 60) {
    checks.push(makeCheck("title", "Title tag", "warn", `Title is ${title.length} characters ("${title}"). Aim for 10-60 characters so it displays well in search results.`));
  } else {
    checks.push(makeCheck("title", "Title tag", "pass", `Title is ${title.length} characters ("${title}") — a good length for search results.`));
  }

  // 2. Meta description
  if (!description) {
    checks.push(makeCheck("description", "Meta description", "fail", "No meta description found. Search engines often use this for the snippet under your link."));
  } else if (description.length < 50 || description.length > 160) {
    checks.push(makeCheck("description", "Meta description", "warn", `Meta description is ${description.length} characters. Aim for 50-160 characters so it isn't truncated in search results.`));
  } else {
    checks.push(makeCheck("description", "Meta description", "pass", `Meta description is ${description.length} characters — a good length.`));
  }

  // 3. Viewport meta tag
  if (viewport) {
    checks.push(makeCheck("viewport", "Mobile viewport tag", "pass", `Viewport meta tag present ("${viewport}") — the page is set up to be mobile-responsive.`));
  } else {
    checks.push(makeCheck("viewport", "Mobile viewport tag", "fail", "No viewport meta tag found. Without it, mobile browsers will render the page as a zoomed-out desktop layout."));
  }

  // 4. HTTPS
  if (isHttps) {
    checks.push(makeCheck("https", "HTTPS", "pass", "Site is served over HTTPS."));
  } else {
    checks.push(makeCheck("https", "HTTPS", "fail", "Site is not served over HTTPS. Browsers flag HTTP sites as \"Not secure\" and it hurts SEO ranking."));
  }

  // 5. Response size
  if (sizeKb < 200) {
    checks.push(makeCheck("size", "HTML document size", "pass", `HTML document is ${sizeKb} KB — lightweight. (This measures the HTML response only, not total page weight including images/scripts.)`));
  } else if (sizeKb < 1000) {
    checks.push(makeCheck("size", "HTML document size", "warn", `HTML document is ${sizeKb} KB — on the heavier side. Consider trimming inline scripts/styles. (HTML only, not total page weight.)`));
  } else {
    checks.push(makeCheck("size", "HTML document size", "fail", `HTML document is ${sizeKb} KB — quite large for a single HTML response. (HTML only, not total page weight.)`));
  }

  // 6. Image alt attributes
  if (imgTotal === 0) {
    checks.push(makeCheck("img-alt", "Image alt attributes", "pass", "No <img> tags found on the page, so nothing to flag here."));
  } else {
    const pct = Math.round((imgWithAlt / imgTotal) * 100);
    if (pct === 100) {
      checks.push(makeCheck("img-alt", "Image alt attributes", "pass", `All ${imgTotal} images have an alt attribute.`));
    } else if (pct >= 50) {
      checks.push(makeCheck("img-alt", "Image alt attributes", "warn", `${imgWithAlt}/${imgTotal} images (${pct}%) have an alt attribute. Missing alt text hurts accessibility and image SEO.`));
    } else {
      checks.push(makeCheck("img-alt", "Image alt attributes", "fail", `Only ${imgWithAlt}/${imgTotal} images (${pct}%) have an alt attribute.`));
    }
  }

  // 7. Favicon
  if (faviconHref) {
    checks.push(makeCheck("favicon", "Favicon", "pass", `Favicon link tag found (${faviconHref}).`));
  } else {
    const hasDefaultFavicon = await checkFaviconFallback(finalUrl);
    if (hasDefaultFavicon) {
      checks.push(makeCheck("favicon", "Favicon", "warn", "No <link rel=\"icon\"> tag, but /favicon.ico exists at the default location. Add an explicit link tag for reliability across browsers."));
    } else {
      checks.push(makeCheck("favicon", "Favicon", "fail", "No favicon link tag found, and no /favicon.ico at the default location."));
    }
  }

  // 8. Response time
  if (responseTimeMs < 500) {
    checks.push(makeCheck("response-time", "Server response time", "pass", `Server responded in ${responseTimeMs}ms.`));
  } else if (responseTimeMs < 1500) {
    checks.push(makeCheck("response-time", "Server response time", "warn", `Server took ${responseTimeMs}ms to respond. Under 500ms is ideal.`));
  } else {
    checks.push(makeCheck("response-time", "Server response time", "fail", `Server took ${responseTimeMs}ms to respond — noticeably slow.`));
  }

  const weight = { pass: 1, warn: 0.5, fail: 0 };
  const totalPoints = checks.reduce((sum, c) => sum + weight[c.status], 0);
  const score = Math.round((totalPoints / checks.length) * 10 * 10) / 10;

  const result = {
    url: finalUrl,
    fetchedAt: new Date().toISOString(),
    score,
    scoreOutOf: 10,
    checks,
  };

  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (apiKey) {
    const pagespeed = await runPageSpeed(finalUrl, apiKey);
    result.pagespeed = pagespeed; // bonus item, not folded into `score` above
  } else {
    result.pagespeed = { available: false, error: "GOOGLE_PAGESPEED_API_KEY not configured — showing core checks only." };
  }

  res.status(200).json(result);
};
