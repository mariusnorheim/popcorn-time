/**
 * Extracts year from a date string.
 * Handles both movie (release_date) and TV (first_air_date) formats.
 *
 * @param dateStr - Date string in "YYYY-MM-DD" format, or just "YYYY"
 * @returns The year as a number, or null if invalid
 */
export function extractYear(dateStr: string | null | undefined): number | null {
  if (!dateStr || typeof dateStr !== "string") return null;

  const trimmed = dateStr.trim();
  if (trimmed.length === 0) return null;

  // Try to extract first 4 characters as year
  const yearPart = trimmed.slice(0, 4);
  const year = parseInt(yearPart, 10);

  if (!Number.isFinite(year) || year < 1800 || year > 2100) {
    return null;
  }

  return year;
}

/**
 * Formats a year for display, with optional media type context.
 *
 * @param year - The year number or null
 * @param mediaType - "movie" or "tv" for context
 * @returns Formatted string like "2024" or "—" if null
 */
export function formatYear(
  year: number | null,
  mediaType?: "movie" | "tv"
): string {
  if (year === null) return "—";
  return String(year);
}

/**
 * Formats release info for display in the modal.
 * Movies: just the year
 * TV: year + seasons/episodes if available
 */
export function formatReleaseInfo(
  year: number | null,
  mediaType: "movie" | "tv",
  seasons?: number,
  episodes?: number
): string {
  const yearStr = year !== null ? String(year) : "—";

  if (mediaType === "tv" && seasons !== undefined) {
    const seasonText = seasons === 1 ? "1 season" : `${seasons} seasons`;
    if (episodes !== undefined) {
      return `${yearStr} · ${seasonText} · ${episodes} episodes`;
    }
    return `${yearStr} · ${seasonText}`;
  }

  return yearStr;
}
