/**
 * Returns a formatted date/time string from an ISO timestamp.
 * Returns "—" if the value is falsy.
 */
export function formatDate(iso?: string): string {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
    " \u00b7 " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
}
