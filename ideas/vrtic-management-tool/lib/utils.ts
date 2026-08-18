/**
 * Tiny classname joiner so components don't need a `clsx`/`tailwind-merge`
 * dependency (kept out on purpose — this template gets copied into ~37
 * separate apps, and every added dependency is 37x the install time).
 * Falsy values (false, undefined, null, "") are dropped.
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
