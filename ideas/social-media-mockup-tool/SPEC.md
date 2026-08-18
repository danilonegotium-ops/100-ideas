# Social Media Mockup Tool

Enter a display name and caption, upload an image, and preview how the post would look as an
Instagram feed post, a TikTok video card, or a LinkedIn post, switching between the three via
tabs. Each mockup frame approximates that platform's real UI chrome (avatar, action icons, like
counts, comment counts, caption layout, timestamps) using original, generic SVG icons hand-built
for this tool (heart, chat bubble, paper-plane/send, bookmark, thumbs-up, repost arrows, dots,
globe, music note, plus-badge, person silhouette, photo placeholder — all basic geometric line
icons, not any brand's actual logo or trademarked glyph). Uploaded images are read client-side
via `FileReader.readAsDataURL` (never uploaded anywhere) and applied to all three frames at once
so switching tabs is instant. Engagement numbers (likes/comments/reactions) are static plausible
placeholders, not computed from anything, since the point of the tool is layout preview, not a
real social graph.

**Scope call:** the spec only requires caption + image inputs; I added a "Display name" field
too (defaulting to "yourhandle") because a mockup with no username visible in the header looks
obviously fake — this felt like a reasonable, low-risk addition rather than scope creep. The
TikTok frame derives its `@handle` from the display name via a pure `toHandle()` function
(lowercase, spaces stripped, non `[a-z0-9._]` chars stripped).

**Out of scope for this pass:** downloading/exporting the mockup as an image (no `html2canvas`
or similar — would need an extra dependency), multiple images/carousel posts, video upload
(TikTok frame treats the uploaded image as a static video-thumbnail stand-in, no actual video
playback), editable engagement numbers, additional platforms (X/Twitter, Facebook, etc.).

**Data:** `data.js` holds the icon SVG markup (all hand-authored generic shapes, see above) and
default placeholder text. No third-party icon library, no brand assets.
