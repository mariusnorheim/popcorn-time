/**
 * Search/filter matching utilities.
 *
 * These functions handle matching search queries against movie/TV results,
 * supporting both Movies (title/original_title) and TV (name/original_name) fields.
 */

export type MediaItem = {
  title?: string;
  original_title?: string;
  name?: string;
  original_name?: string;
};

/**
 * Normalizes a string for matching: lowercases and trims whitespace.
 */
export function normalizeForMatch(str: string): string {
  return str.toLowerCase().trim();
}

/**
 * Checks if a media item matches a search query.
 *
 * Matching rules:
 * - Case-insensitive comparison
 * - Trims leading/trailing whitespace from query
 * - Matches against: title, original_title (movies) and name, original_name (TV)
 * - Safely handles missing/undefined fields
 *
 * @param item - Movie or TV result from TMDB
 * @param query - User's search query
 * @returns true if the item matches the query
 */
export function matchesSearchQuery(item: MediaItem, query: string): boolean {
  if (!query || query.trim().length === 0) {
    return true; // Empty query matches everything
  }

  const normalizedQuery = normalizeForMatch(query);

  // Gather all title fields that might be present (movie uses title, TV uses name)
  const fieldsToCheck: (string | undefined)[] = [
    item.title,
    item.original_title,
    item.name,
    item.original_name,
  ];

  return fieldsToCheck.some((field) => {
    if (!field) return false;
    return normalizeForMatch(field).includes(normalizedQuery);
  });
}

/**
 * Filters an array of media items by search query.
 */
export function filterBySearchQuery<T extends MediaItem>(
  items: T[],
  query: string
): T[] {
  return items.filter((item) => matchesSearchQuery(item, query));
}
