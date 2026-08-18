// Serbian ZIP Codes API — index.html is API docs, not an interactive UI.
// The only client-side behavior is "copy example to clipboard" on the docs page.

function copyText(text, button) {
  const done = () => {
    const original = button.textContent;
    button.textContent = "Copied!";
    setTimeout(() => {
      button.textContent = original;
    }, 1400);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

function fallbackCopy(text, done) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    // Clipboard unavailable — silently ignore, button just won't confirm.
  }
  document.body.removeChild(textarea);
  done();
}

function initCopyButtons() {
  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-copy-target");
      const target = document.getElementById(targetId);
      if (target) copyText(target.textContent, button);
    });
  });
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initCopyButtons);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { copyText };
}
