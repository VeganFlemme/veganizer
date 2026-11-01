// Pure helpers for the /methodologie page. No network access.

/**
 * Share (0–1) of rows without a numeric value.
 * Returns null when a count is unavailable or inconsistent: the UI then shows
 * "donnée manquante" instead of a misleading 0.
 */
export function missingShare(
  total: number | null | undefined,
  numeric: number | null | undefined,
): number | null {
  if (total == null || numeric == null) return null;
  if (total <= 0 || numeric < 0 || numeric > total) return null;
  return (total - numeric) / total;
}
