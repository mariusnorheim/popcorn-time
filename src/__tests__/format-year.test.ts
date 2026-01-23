import { describe, it, expect } from "vitest";
import { extractYear, formatYear, formatReleaseInfo } from "../lib/format-year";

describe("extractYear", () => {
  describe("valid date strings", () => {
    it("extracts year from YYYY-MM-DD format", () => {
      expect(extractYear("2024-12-25")).toBe(2024);
      expect(extractYear("1999-01-01")).toBe(1999);
    });

    it("extracts year from YYYY format", () => {
      expect(extractYear("2024")).toBe(2024);
    });

    it("handles dates with extra whitespace", () => {
      expect(extractYear("  2024-05-15  ")).toBe(2024);
    });
  });

  describe("invalid inputs", () => {
    it("returns null for null/undefined", () => {
      expect(extractYear(null)).toBe(null);
      expect(extractYear(undefined)).toBe(null);
    });

    it("returns null for empty string", () => {
      expect(extractYear("")).toBe(null);
      expect(extractYear("   ")).toBe(null);
    });

    it("returns null for non-year strings", () => {
      expect(extractYear("abc")).toBe(null);
      expect(extractYear("20")).toBe(null);
    });

    it("returns null for unreasonable years", () => {
      expect(extractYear("1700-01-01")).toBe(null); // Too old
      expect(extractYear("2200-01-01")).toBe(null); // Too future
    });
  });

  describe("movie vs TV compatibility", () => {
    it("works with movie release_date format", () => {
      expect(extractYear("2024-07-26")).toBe(2024); // Typical movie release
    });

    it("works with TV first_air_date format", () => {
      expect(extractYear("2022-03-24")).toBe(2022); // Typical TV premiere
    });
  });
});

describe("formatYear", () => {
  it("formats valid year as string", () => {
    expect(formatYear(2024)).toBe("2024");
    expect(formatYear(1999)).toBe("1999");
  });

  it("returns dash for null year", () => {
    expect(formatYear(null)).toBe("—");
  });

  it("accepts optional media type parameter", () => {
    expect(formatYear(2024, "movie")).toBe("2024");
    expect(formatYear(2024, "tv")).toBe("2024");
  });
});

describe("formatReleaseInfo", () => {
  describe("movies", () => {
    it("shows just the year for movies", () => {
      expect(formatReleaseInfo(2024, "movie")).toBe("2024");
    });

    it("shows dash for null year", () => {
      expect(formatReleaseInfo(null, "movie")).toBe("—");
    });
  });

  describe("TV shows", () => {
    it("shows year + seasons + episodes for TV", () => {
      expect(formatReleaseInfo(2022, "tv", 5, 50)).toBe("2022 · 5 seasons · 50 episodes");
    });

    it("handles singular season", () => {
      expect(formatReleaseInfo(2023, "tv", 1, 10)).toBe("2023 · 1 season · 10 episodes");
    });

    it("shows year + seasons without episodes", () => {
      expect(formatReleaseInfo(2021, "tv", 3)).toBe("2021 · 3 seasons");
    });

    it("shows just year if no seasons provided", () => {
      expect(formatReleaseInfo(2020, "tv")).toBe("2020");
    });

    it("shows dash for null year with seasons", () => {
      expect(formatReleaseInfo(null, "tv", 2, 20)).toBe("— · 2 seasons · 20 episodes");
    });
  });
});
