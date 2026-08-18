import { NextResponse } from "next/server";

/**
 * Served at GET /widget.js — this is the literal embeddable snippet, e.g.:
 *
 *   <script src="https://<this-app>.vercel.app/widget.js"
 *           data-widget-id="<widget-id>" async></script>
 *
 * Deliberately plain, dependency-free, framework-free JS (ES5-ish syntax,
 * no build step, no React) — it has to run standalone inside ANY
 * third-party page, which may have its own bundler, its own React version
 * (or none), strict CSP, etc. It never assumes anything about the host
 * page beyond "there's a <script> tag and a document".
 *
 * How it finds "where to call home": `document.currentScript.src` is the
 * exact URL the host page used to load this file — parsing its origin
 * (`new URL(...).origin`) is what lets one static, unmodified JS file work
 * correctly no matter which Vercel domain this idea ends up deployed to,
 * with no server-side templating needed. This MUST be read synchronously
 * at the top of the IIFE, before any async work — `document.currentScript`
 * is only reliably non-null while its own <script> is the one currently
 * being evaluated; it goes back to null once you're inside a later
 * callback/promise/timeout.
 */
const SCRIPT = `(function () {
  "use strict";

  var currentScript = document.currentScript;
  if (!currentScript) return;

  var widgetId = currentScript.getAttribute("data-widget-id");
  if (!widgetId) {
    if (window.console) {
      console.error("[feedback-widget] embed <script> tag is missing a data-widget-id attribute.");
    }
    return;
  }

  var origin;
  try {
    origin = new URL(currentScript.src).origin;
  } catch (err) {
    return;
  }

  function inject() {
    if (document.getElementById("fw-widget-" + widgetId)) return;

    var container = document.createElement("div");
    container.id = "fw-widget-" + widgetId;
    container.setAttribute(
      "style",
      "position:fixed;right:16px;bottom:16px;z-index:2147483647;" +
        "background:#14171b;color:#eef1f4;border:1px solid #24282e;" +
        "border-radius:12px;padding:14px 16px;" +
        "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" +
        "font-size:14px;line-height:1.4;box-shadow:0 4px 16px rgba(0,0,0,0.25);" +
        "max-width:260px;"
    );

    var question = document.createElement("p");
    question.textContent = "Was this helpful?";
    question.setAttribute("style", "margin:0 0 10px 0;");

    var buttonRow = document.createElement("div");
    buttonRow.setAttribute("style", "display:flex;gap:8px;");

    var thanks = document.createElement("p");
    thanks.textContent = "Thanks for the feedback!";
    thanks.setAttribute("style", "margin:0;display:none;");

    function respond(answer) {
      buttonRow.style.display = "none";
      question.style.display = "none";
      thanks.style.display = "block";
      fetch(origin + "/api/w/" + widgetId + "/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answer, pageUrl: window.location.href })
      }).catch(function () {
        /* best-effort — the visitor already saw the thank-you state */
      });
    }

    function makeButton(label, answer) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.setAttribute(
        "style",
        "flex:1;padding:6px 10px;border-radius:8px;border:1px solid #24282e;" +
          "background:#6ee7b7;color:#062b1c;font-weight:600;cursor:pointer;font-size:13px;"
      );
      btn.addEventListener("click", function () {
        respond(answer);
      });
      return btn;
    }

    buttonRow.appendChild(makeButton("Yes", true));
    buttonRow.appendChild(makeButton("No", false));

    container.appendChild(question);
    container.appendChild(buttonRow);
    container.appendChild(thanks);
    document.body.appendChild(container);

    fetch(origin + "/api/w/" + widgetId)
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (data) {
        if (data && data.question) question.textContent = data.question;
      })
      .catch(function () {
        /* best-effort — falls back to the default question text above */
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
`;

export async function GET() {
  return new NextResponse(SCRIPT, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
