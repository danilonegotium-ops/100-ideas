import Link from "next/link";

/**
 * Site header, structurally the same as `_shared/static-template`'s
 * `header.site`: a single muted "back to all tools" link, same max-width
 * container as the rest of the page.
 */
export function Nav() {
  return (
    <header className="mx-auto flex w-full max-w-site items-center justify-between px-5 pt-5">
      <Link
        href="/"
        className="text-sm text-muted no-underline transition-colors hover:text-fg"
      >
        &larr; back to all tools
      </Link>
    </header>
  );
}
