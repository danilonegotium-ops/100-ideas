/**
 * Static archive content for the newsletter — 3 real sample issues, 5
 * facts each. This is fixed editorial content for the MVP (not database-
 * backed), so it renders as plain static pages with no Supabase
 * dependency. Every fact below was picked for being genuinely well-
 * established/verifiable, not just eye-catching — see SPEC.md for the
 * "how these were checked" note.
 */

export type Fact = {
  title: string;
  body: string;
};

export type Issue = {
  slug: string;
  issueNumber: number;
  title: string;
  date: string;
  intro: string;
  facts: Fact[];
};

export const issues: Issue[] = [
  {
    slug: "issue-1-space-is-stranger-than-fiction",
    issueNumber: 1,
    title: "Space is stranger than fiction",
    date: "August 3, 2026",
    intro:
      "Five things about the universe that sound made up but aren't. Welcome to issue #1.",
    facts: [
      {
        title: "A day on Venus is longer than its year",
        body: "Venus rotates so slowly (once every 243 Earth days) that it takes longer to spin once than it does to orbit the Sun (about 225 Earth days). To make it stranger, Venus also spins backwards (retrograde) compared to most planets — on Venus, the sun would rise in the west.",
      },
      {
        title: "A sugar cube of neutron star would weigh about a billion tons",
        body: "Neutron stars are what's left after a massive star collapses, and they pack roughly the mass of the Sun into a sphere about the size of a city. A piece the size of a sugar cube would weigh in the neighborhood of a billion tons here on Earth.",
      },
      {
        title: "Saturn would float in water",
        body: "Saturn's average density is lower than water's (about 0.69 g/cm³ vs. water's 1 g/cm³). If you had a bathtub big enough, the ringed planet would bob on the surface instead of sinking.",
      },
      {
        title: "There's a cloud of alcohol near the center of our galaxy",
        body: "Radio astronomers have detected ethyl alcohol, along with dozens of other organic molecules, in a giant star-forming gas cloud called Sagittarius B2, near the Milky Way's core. It won't be making it into any cocktails — it's an extremely thin, cold gas spread across trillions of miles — but the chemistry is real.",
      },
      {
        title: "Over a million Earths would fit inside the Sun",
        body: "By volume, the Sun is enormous: roughly 1.3 million Earths could fit inside it. And the Sun itself is unremarkable by star standards — plenty of stars in our galaxy are far bigger.",
      },
    ],
  },
  {
    slug: "issue-2-your-body-is-doing-more-than-you-know",
    issueNumber: 2,
    title: "Your body is doing more than you know",
    date: "August 10, 2026",
    intro:
      "Issue #2: five facts about the strange machine you're reading this in.",
    facts: [
      {
        title: "Octopuses have three hearts and blue blood",
        body: "Two hearts pump blood to the gills, and a third pumps it to the rest of the body. Their blood is blue, not red, because it uses a copper-based molecule called hemocyanin to carry oxygen instead of the iron-based hemoglobin humans use.",
      },
      {
        title: "Your brain runs on about 20 watts",
        body: "Despite being about 2% of your body weight, your brain uses roughly 20% of your resting energy — somewhere around 20 watts, similar to a dim incandescent night light. It's also one of the most energy-efficient computers ever built, by a wide margin.",
      },
      {
        title: "Your stomach lining replaces itself every few days",
        body: "Stomach acid is strong enough to damage the stomach's own lining, so your body constantly regenerates the mucosal layer — the whole lining is renewed roughly every few days. It's one reason ulcers form when that renewal process gets disrupted.",
      },
      {
        title: "Humans share a surprising amount of DNA with a banana",
        body: "Estimates put it at roughly 60%. Not because humans and bananas are alike, but because so much of DNA codes for basic cellular machinery — things like how cells divide and process energy — that nearly every living thing needs.",
      },
      {
        title: "A banana is a berry. A strawberry isn't.",
        body: "Botanically, a \"true berry\" develops from a single flower ovary and has its seeds inside the flesh — bananas, grapes, and tomatoes all qualify. Strawberries are technically \"aggregate accessory fruits,\" with their seeds sitting on the outside.",
      },
    ],
  },
  {
    slug: "issue-3-the-hidden-history-of-computers",
    issueNumber: 3,
    title: "The hidden history of computers",
    date: "August 17, 2026",
    intro:
      "Issue #3: five stories from computing history, including two popular ones we had to correct.",
    facts: [
      {
        title: "The first computer \"bug\" was an actual moth — but the word predates it",
        body: "In 1947, operators working on the Harvard Mark II computer found a moth trapped in a relay, taped it into their logbook, and joked about \"debugging\" the machine. It's a real event — but the word \"bug\" for a technical fault is older: Thomas Edison used it in an 1878 letter to describe glitches in his own inventions.",
      },
      {
        title: "\"Wi-Fi\" doesn't actually stand for anything",
        body: "It's a brand name a marketing firm came up with for the Wi-Fi Alliance in 1999 — a play on \"hi-fi\" — not an acronym. \"Wireless Fidelity\" was added afterward as a tagline and stuck in popular memory, but it was never the technical meaning.",
      },
      {
        title: "QWERTY probably wasn't designed to slow typists down",
        body: "The popular story is that QWERTY staggers common letters to stop mechanical typewriter arms from jamming. Historians who've studied the original 1870s patents now think it had more to do with optimizing the layout for telegraph operators transcribing Morse code efficiently — the \"slow typists down\" version is likely a myth that outlived the evidence for it.",
      },
      {
        title: "The first computer mouse was carved out of wood",
        body: "Douglas Engelbart built the first prototype in 1964 at Stanford Research Institute — a wooden shell with two metal wheels underneath. He publicly demoed it, along with hypertext and video conferencing, in 1968's famous \"Mother of All Demos.\"",
      },
      {
        title: "The @ symbol in email addresses was a practical, almost arbitrary choice",
        body: "In 1971, engineer Ray Tomlinson needed a symbol to separate a username from a computer's name for the first network email system. He picked @ mainly because it was already on the keyboard, rarely used, and wouldn't show up in anyone's name — not for any deeper symbolic reason.",
      },
    ],
  },
];

export function getIssueBySlug(slug: string): Issue | undefined {
  return issues.find((issue) => issue.slug === slug);
}
