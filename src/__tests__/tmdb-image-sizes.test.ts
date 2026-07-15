// Regression test for ISSUE-001 (2026-07-15, .aiw/reports/qa/qa-report-localhost-2026-07-15.md):
// poster grid requested image.tmdb.org/t/p/w4000/... — an invalid TMDB size
// variant — so every poster returned HTTP 400 and rendered blank.
// This test pins every TMDB image URL in the app to a size variant TMDB
// actually serves; an invalid segment (w4000, w40, typo'd) fails here
// before it ships.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Sizes verified against live TMDB image CDN responses (HTTP 200).
const VALID_SIZES = new Set([
  "w92",
  "w154",
  "w185",
  "w300",
  "w342",
  "w400",
  "w500",
  "w780",
  "original",
]);

const SOURCES = ["src/app/page.tsx", "src/components/detail-modal.tsx"];

describe("TMDB image size variants", () => {
  for (const rel of SOURCES) {
    it(`${rel} only uses valid TMDB size segments`, () => {
      const src = readFileSync(join(process.cwd(), rel), "utf8");
      const matches = [...src.matchAll(/image\.tmdb\.org\/t\/p\/([A-Za-z0-9]+)/g)];
      expect(matches.length).toBeGreaterThan(0);
      for (const m of matches) {
        expect(VALID_SIZES.has(m[1]), `invalid TMDB size "${m[1]}" in ${rel}`).toBe(true);
      }
    });
  }
});
