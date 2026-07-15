// Regression test for ISSUE-002 (2026-07-15,
// .aiw/reports/qa/qa-report-localhost-2026-07-15.md and
// .aiw/reports/investigate/inv-2026-07-15-issue-003-false-positive.md):
// isLoading initialized to false while the page always fetches on mount,
// so the server-rendered first paint carried the "No matches found" empty
// state as a false claim during the loading window (verified via curl of
// the SSR HTML). Effects never run during SSR, so renderToString captures
// exactly the frame the bug lived in — a client render with flushed
// effects would mask it (setIsLoading(true) fires before assertions).
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import Home from "../app/page";

describe("initial loading state (ISSUE-002)", () => {
  it("SSR first paint shows the loading indicator, not the empty state", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("Loading…");
    expect(html).not.toContain("No matches found.");
  });
});
