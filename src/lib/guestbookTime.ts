/** Message timestamps are absolute ISO instants; display modern Beijing time (UTC+8).
 * Build the 24-hour clock explicitly so browser/OS 12-hour preferences cannot alter it.
 */
export function formatGuestbookTime(timestamp: string): string | null {
  if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(timestamp)) return null;
  const instant = Date.parse(timestamp);
  if (!Number.isFinite(instant)) return null;
  const beijing = new Date(instant + 8 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${beijing.getUTCFullYear()}-${pad(beijing.getUTCMonth() + 1)}-${pad(beijing.getUTCDate())} ${pad(beijing.getUTCHours())}:${pad(beijing.getUTCMinutes())}`;
}
