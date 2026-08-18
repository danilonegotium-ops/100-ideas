# CSS Animation Library

A showcase of 20 real, ready-to-use CSS animations (fade, slide x4 directions, bounce, pulse,
shake, spin, flip x2 axes, zoom in/out, rotate in, wobble, heartbeat, swing, rubber band, flash).
Each card plays the animation live on a demo box and has a "Copy CSS" button that copies the
exact `.class { animation: ... }` + `@keyframes` block to the clipboard via
`navigator.clipboard.writeText` (with a `document.execCommand('copy')` fallback for older
browsers). A search box filters the grid by animation name. Demo boxes auto-restart every
2.6s (via a reflow trick: `animation: none` then forced reflow then clear the inline override)
so one-shot entrance animations (fade-in, slide-in, zoom-in, flip-in, rotate-in) are visible on
a loop without requiring user interaction, while looping animations (spin, pulse, bounce, etc.)
just keep running. The copied CSS itself is production-typical (one-shot where appropriate, not
force-looped) — only the live demo page adds the restart loop.

**Out of scope for this pass:** animation duration/easing customization UI, exporting all
animations as a single stylesheet download, category tags/grouping beyond the flat grid,
dark/light theme toggle beyond the existing `prefers-color-scheme` handling in `theme.css`.

**Data:** all 20 animations in `data.js` are original CSS I wrote for this tool (standard,
widely-known animation techniques like fade/slide/spin/bounce — not copied from any specific
library's source, though the general effects are industry-standard patterns you'll recognize
from libraries like Animate.css).
