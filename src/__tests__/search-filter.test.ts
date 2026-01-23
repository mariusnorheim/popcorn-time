import { describe, it, expect } from "vitest";
import {
  normalizeForMatch,
  matchesSearchQuery,
  filterBySearchQuery,
  type MediaItem,
} from "../lib/search-filter";

describe("normalizeForMatch", () => {
  it("lowercases input", () => {
    expect(normalizeForMatch("AVATAR")).toBe("avatar");
    expect(normalizeForMatch("The Matrix")).toBe("the matrix");
  });

  it("trims whitespace", () => {
    expect(normalizeForMatch("  avatar  ")).toBe("avatar");
    expect(normalizeForMatch("\ttest\n")).toBe("test");
  });

  it("handles empty string", () => {
    expect(normalizeForMatch("")).toBe("");
  });
});

describe("matchesSearchQuery", () => {
  describe("case-insensitive matching", () => {
    it("matches regardless of case in query", () => {
      const movie: MediaItem = { title: "Avatar: Fire and Ash" };
      expect(matchesSearchQuery(movie, "avatar")).toBe(true);
      expect(matchesSearchQuery(movie, "AVATAR")).toBe(true);
      expect(matchesSearchQuery(movie, "Avatar")).toBe(true);
    });

    it("matches regardless of case in title", () => {
      const movie: MediaItem = { title: "AVATAR" };
      expect(matchesSearchQuery(movie, "avatar")).toBe(true);
    });
  });

  describe("whitespace handling", () => {
    it("trims query whitespace", () => {
      const movie: MediaItem = { title: "Avatar" };
      expect(matchesSearchQuery(movie, "  avatar  ")).toBe(true);
      expect(matchesSearchQuery(movie, "\tavatar\n")).toBe(true);
    });

    it("empty query matches everything", () => {
      const movie: MediaItem = { title: "Avatar" };
      expect(matchesSearchQuery(movie, "")).toBe(true);
      expect(matchesSearchQuery(movie, "   ")).toBe(true);
    });
  });

  describe("movie fields (title/original_title)", () => {
    it("matches movie title field", () => {
      const movie: MediaItem = { title: "Avatar: Fire and Ash" };
      expect(matchesSearchQuery(movie, "avatar")).toBe(true);
      expect(matchesSearchQuery(movie, "fire")).toBe(true);
    });

    it("matches movie original_title field", () => {
      const movie: MediaItem = {
        title: "Parasite",
        original_title: "기생충",
      };
      expect(matchesSearchQuery(movie, "기생충")).toBe(true);
      expect(matchesSearchQuery(movie, "parasite")).toBe(true);
    });
  });

  describe("TV fields (name/original_name)", () => {
    it("matches TV name field", () => {
      const tvShow: MediaItem = { name: "Breaking Bad" };
      expect(matchesSearchQuery(tvShow, "breaking")).toBe(true);
      expect(matchesSearchQuery(tvShow, "bad")).toBe(true);
    });

    it("matches TV original_name field", () => {
      const tvShow: MediaItem = {
        name: "Money Heist",
        original_name: "La Casa de Papel",
      };
      expect(matchesSearchQuery(tvShow, "casa")).toBe(true);
      expect(matchesSearchQuery(tvShow, "money")).toBe(true);
    });
  });

  describe("missing/undefined fields", () => {
    it("handles item with no title fields", () => {
      const item: MediaItem = {};
      expect(matchesSearchQuery(item, "avatar")).toBe(false);
    });

    it("handles item with only some fields defined", () => {
      const movie: MediaItem = { title: "Avatar" };
      expect(matchesSearchQuery(movie, "avatar")).toBe(true);
      // Should not crash when original_title is undefined
    });

    it("handles null-ish query", () => {
      const movie: MediaItem = { title: "Avatar" };
      // @ts-expect-error - testing runtime safety
      expect(matchesSearchQuery(movie, null)).toBe(true);
      // @ts-expect-error - testing runtime safety
      expect(matchesSearchQuery(movie, undefined)).toBe(true);
    });
  });

  describe("partial matching", () => {
    it("matches partial strings", () => {
      const movie: MediaItem = { title: "Avatar: Fire and Ash" };
      expect(matchesSearchQuery(movie, "ava")).toBe(true);
      expect(matchesSearchQuery(movie, "fire")).toBe(true);
      expect(matchesSearchQuery(movie, "ash")).toBe(true);
    });

    it("does not match unrelated strings", () => {
      const movie: MediaItem = { title: "Avatar" };
      expect(matchesSearchQuery(movie, "matrix")).toBe(false);
      expect(matchesSearchQuery(movie, "xyz123")).toBe(false);
    });
  });
});

describe("filterBySearchQuery", () => {
  const items: MediaItem[] = [
    { title: "Avatar: Fire and Ash" },
    { title: "The Matrix" },
    { name: "Breaking Bad" },
    { title: "Avatar" },
  ];

  it("filters items matching the query", () => {
    const result = filterBySearchQuery(items, "avatar");
    expect(result).toHaveLength(2);
    expect(result[0]?.title).toBe("Avatar: Fire and Ash");
    expect(result[1]?.title).toBe("Avatar");
  });

  it("returns all items for empty query", () => {
    const result = filterBySearchQuery(items, "");
    expect(result).toHaveLength(4);
  });

  it("returns empty array when nothing matches", () => {
    const result = filterBySearchQuery(items, "nonexistent");
    expect(result).toHaveLength(0);
  });
});
