// Starter resume Markdown template — pre-fills the editor on first load.

const STARTER_RESUME_MARKDOWN = `# Jane Doe
Senior Software Engineer

jane.doe@email.com | +1 555 123 4567 | San Francisco, CA | [github.com/janedoe](https://github.com/janedoe)

---

## Summary

Results-driven software engineer with 6+ years of experience designing and shipping scalable
web applications. Strong background in **JavaScript/TypeScript**, distributed systems, and
mentoring junior engineers.

## Experience

**Senior Software Engineer** — Acme Corp (2022–Present)
- Led migration of a legacy monolith to microservices, cutting deploy time by 60%
- Mentored 3 junior engineers and ran the team's weekly code review sessions
- Owned the on-call rotation for payments infrastructure

**Software Engineer** — Widget Inc (2019–2022)
- Built and shipped a customer-facing analytics dashboard used by 10,000+ users
- Reduced p95 API latency by 40% by introducing a Redis caching layer
- Wrote the team's first end-to-end test suite, cutting regression bugs by half

## Education

**B.S. Computer Science** — State University (2015–2019)

## Skills

JavaScript, TypeScript, React, Node.js, PostgreSQL, AWS, Docker, GraphQL

---

*Edit this Markdown on the left — the preview on the right updates live. Click "Download PDF"
when you're ready to export.*
`;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { STARTER_RESUME_MARKDOWN };
}
