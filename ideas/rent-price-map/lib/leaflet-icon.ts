/**
 * Fixes Leaflet's well-known default-marker-icon bug under bundlers:
 * `L.Icon.Default` builds its image URLs relative to the CSS file's own
 * path, which breaks once Leaflet's CSS is imported through a bundler
 * (Webpack/Next.js) instead of loaded as a plain `<link>` from Leaflet's
 * own `dist/` folder. The standard fix is to delete the broken URL-guessing
 * method and point the three marker images at explicit URLs.
 *
 * We point at the same pinned Leaflet version's marker assets on the
 * unpkg CDN (the library's JS/CSS itself is still bundled from `npm`, only
 * these three small PNGs are loaded externally) — this sidesteps needing
 * to know exactly how Next.js's bundler represents an imported image
 * (`next/image`-style `{src, width, height}` objects vs. plain strings, a
 * detail that varies and isn't worth the risk here for 3 static assets).
 *
 * Call once, client-side only, before creating any markers.
 */
export function configureDefaultMarkerIcon(leaflet: typeof import("leaflet")) {
  const CDN_BASE = "https://unpkg.com/leaflet@1.9.4/dist/images/";

  // `_getIconUrl` is an internal, undocumented method (hence not present in
  // `@types/leaflet`'s public types) that Leaflet uses to guess marker
  // image paths relative to its CSS file — deleting it is the standard,
  // widely-used fix so `mergeOptions` below takes full effect instead.
  const iconDefaultCtor = leaflet.Icon.Default as unknown as {
    prototype: { _getIconUrl?: unknown };
  };
  delete iconDefaultCtor.prototype._getIconUrl;

  leaflet.Icon.Default.mergeOptions({
    iconRetinaUrl: `${CDN_BASE}marker-icon-2x.png`,
    iconUrl: `${CDN_BASE}marker-icon.png`,
    shadowUrl: `${CDN_BASE}marker-shadow.png`,
  });
}
