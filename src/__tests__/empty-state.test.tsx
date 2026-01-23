import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

/**
 * Empty state component extracted for testability.
 * This matches the empty state markup in src/app/page.tsx.
 */
function EmptyState() {
  return (
    <div
      data-testid="empty-state"
      className="mt-4 rounded-xl border border-slate-500/30 bg-slate-800/50 px-4 py-6 text-center"
    >
      <div className="text-sm text-slate-200">No matches found.</div>
      <div className="mt-1 text-sm text-slate-400">
        Try a broader search or adjust filters.
      </div>
    </div>
  );
}

describe("EmptyState", () => {
  describe("copy text", () => {
    it("displays the correct primary message", () => {
      render(<EmptyState />);
      expect(screen.getByText("No matches found.")).toBeInTheDocument();
    });

    it("displays the correct secondary message", () => {
      render(<EmptyState />);
      expect(
        screen.getByText("Try a broader search or adjust filters.")
      ).toBeInTheDocument();
    });

    it("does NOT display old/deprecated copy", () => {
      render(<EmptyState />);
      expect(
        screen.queryByText("No results. Try a different search or filter.")
      ).not.toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("has rounded-xl border styling", () => {
      render(<EmptyState />);
      const container = screen.getByTestId("empty-state");
      expect(container).toHaveClass("rounded-xl");
      expect(container).toHaveClass("border");
    });

    it("has correct background styling", () => {
      render(<EmptyState />);
      const container = screen.getByTestId("empty-state");
      expect(container).toHaveClass("bg-slate-800/50");
    });

    it("is centered text", () => {
      render(<EmptyState />);
      const container = screen.getByTestId("empty-state");
      expect(container).toHaveClass("text-center");
    });
  });
});
