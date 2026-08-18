/**
 * The `/api/w/[id]` (config) and `/api/w/[id]/respond` routes are called
 * from the embed script running on arbitrary third-party origins — that's
 * the entire point of an embeddable widget — so every response (including
 * the OPTIONS preflight browsers send before a JSON POST) needs these
 * headers rather than relying on same-origin defaults.
 */
export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
