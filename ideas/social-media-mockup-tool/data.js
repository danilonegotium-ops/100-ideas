// Social Media Mockup Tool — data.
// ICONS are small, original, generic line-icon SVGs (basic geometric
// shapes: heart, chat bubble, paper plane, bookmark, thumbs-up, repost
// arrows, dots, globe, music note, plus badge, generic photo/person
// silhouettes). These are original recreations of universal, unbranded UI
// icon patterns — not any platform's actual logo or trademarked glyph.

const ICONS = {
  heart:
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 6.6c-1.5-1.9-4.3-2.4-6.4-.9-.9.6-1.6 1.5-2 2.5-.4-1-1.1-1.9-2-2.5-2.1-1.5-4.9-1-6.4.9-1.7 2.1-1.5 5.1.4 7.1l7.6 7.7c.2.2.5.3.8.3s.6-.1.8-.3l7.6-7.7c1.9-2 2.1-5 .4-7.1z"/></svg>',
  heartFilled:
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20.8 6.6c-1.5-1.9-4.3-2.4-6.4-.9-.9.6-1.6 1.5-2 2.5-.4-1-1.1-1.9-2-2.5-2.1-1.5-4.9-1-6.4.9-1.7 2.1-1.5 5.1.4 7.1l7.6 7.7c.2.2.5.3.8.3s.6-.1.8-.3l7.6-7.7c1.9-2 2.1-5 .4-7.1z"/></svg>',
  comment:
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 9.3 9.3 0 0 1-4-.9L3 20l1.1-4.5a8.3 8.3 0 0 1-1.1-4.1 8.4 8.4 0 0 1 8.9-8.4 8.8 8.8 0 0 1 6.3 2.5 8 8 0 0 1 2.8 6z"/></svg>',
  send:
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>',
  bookmark:
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>',
  thumbsUp:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3z"/><path d="M7 11l4-7a2 2 0 0 1 2 2v3h5.5a2 2 0 0 1 1.9 2.6l-1.8 6A2 2 0 0 1 16.7 20H10a3 3 0 0 1-3-3v-6z"/></svg>',
  repost:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h11a4 4 0 0 1 4 4v2"/><path d="M8 3 4 7l4 4"/><path d="M20 17H9a4 4 0 0 1-4-4v-2"/><path d="M16 21l4-4-4-4"/></svg>',
  dots:
    '<svg viewBox="0 0 24 6" width="20" height="6" fill="currentColor"><circle cx="3" cy="3" r="2.4"/><circle cx="12" cy="3" r="2.4"/><circle cx="21" cy="3" r="2.4"/></svg>',
  globe:
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 4 5.7 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.7-4-9s1.5-6.5 4-9z"/></svg>',
  music:
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M14 3v10.5a3.5 3.5 0 1 1-2-3.2V6h-4v9.5a3.5 3.5 0 1 1-2-3.2V3h8z"/></svg>',
  plusBadge:
    '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="10" fill="#20d5ec"/><path d="M12 7v10M7 12h10" stroke="#111" stroke-width="2.2" stroke-linecap="round"/></svg>',
  person:
    '<svg viewBox="0 0 24 24" width="55%" height="55%" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 22a8 8 0 0 1 16 0z"/></svg>',
  photo:
    '<svg viewBox="0 0 24 24" width="18%" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5-11 11"/></svg>'
};

const DEFAULTS = {
  displayName: "yourhandle",
  caption: "Sunset walks hit different \u{1F305}"
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ICONS, DEFAULTS };
}
