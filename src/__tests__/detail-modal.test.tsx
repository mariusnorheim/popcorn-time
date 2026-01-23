import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import React from "react";
import DetailModal, { clearDetailsCache } from "../components/detail-modal";
import type { MediaDetails } from "../app/api/tmdb/details/route";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock HTMLDialogElement methods (jsdom doesn't support them)
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
  // Clear the cache before each test
  clearDetailsCache();
});

afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});

const mockMovieDetails: MediaDetails = {
  id: 123,
  title: "Test Movie",
  original_title: "Test Movie Original",
  overview: "This is a full description of the test movie that should not be truncated.",
  poster_path: "/poster.jpg",
  backdrop_path: "/backdrop.jpg",
  vote_average: 8.5,
  vote_count: 1234,
  release_year: 2024,
  media_type: "movie",
  cast: [
    { id: 1, name: "Actor One", character: "Hero", profile_path: "/actor1.jpg" },
    { id: 2, name: "Actor Two", character: "Villain", profile_path: null },
  ],
};

const mockTvDetails: MediaDetails = {
  id: 456,
  title: "Test TV Show",
  original_title: "Test TV Original",
  overview: "This is a TV show description.",
  poster_path: "/tv-poster.jpg",
  backdrop_path: null,
  vote_average: 9.0,
  vote_count: 5678,
  release_year: 2022,
  media_type: "tv",
  number_of_seasons: 3,
  number_of_episodes: 30,
  cast: [
    { id: 3, name: "TV Actor", character: "Lead", profile_path: "/tvactor.jpg" },
  ],
};

describe("DetailModal", () => {
  describe("opening behavior", () => {
    it("does not render when isOpen is false", () => {
      const { container } = render(
        <DetailModal
          isOpen={false}
          onClose={() => {}}
          mediaType="movie"
          mediaId={123}
        />
      );

      expect(container.querySelector("dialog")).not.toBeInTheDocument();
    });

    it("renders when isOpen is true", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMovieDetails),
      });

      const { container } = render(
        <DetailModal
          isOpen={true}
          onClose={() => {}}
          mediaType="movie"
          mediaId={123}
        />
      );

      expect(container.querySelector("dialog")).toBeInTheDocument();
    });

    it("calls showModal when opened", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMovieDetails),
      });

      render(
        <DetailModal
          isOpen={true}
          onClose={() => {}}
          mediaType="movie"
          mediaId={123}
        />
      );

      expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    });
  });

  describe("content rendering", () => {
    it("shows loading state initially", async () => {
      // Never resolve the fetch
      mockFetch.mockImplementationOnce(() => new Promise(() => {}));

      render(
        <DetailModal
          isOpen={true}
          onClose={() => {}}
          mediaType="movie"
          mediaId={123}
        />
      );

      expect(screen.getByText("Loading details…")).toBeInTheDocument();
    });

    it("renders movie details after fetch", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMovieDetails),
      });

      render(
        <DetailModal
          isOpen={true}
          onClose={() => {}}
          mediaType="movie"
          mediaId={123}
        />
      );

      await waitFor(() => {
        // Title appears in both header and content, so use getAllByText
        const titles = screen.getAllByText("Test Movie");
        expect(titles.length).toBeGreaterThanOrEqual(1);
      });

      // Check all key fields
      expect(screen.getByText("Test Movie Original")).toBeInTheDocument();
      expect(screen.getByText(/This is a full description/)).toBeInTheDocument();
      expect(screen.getByText("2024")).toBeInTheDocument();
      expect(screen.getByText("★ 8.5")).toBeInTheDocument();
      expect(screen.getByText("(1,234 votes)")).toBeInTheDocument();

      // Check cast
      expect(screen.getByText("Actor One")).toBeInTheDocument();
      expect(screen.getByText("Hero")).toBeInTheDocument();
    });

    it("renders TV show details with season info", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTvDetails),
      });

      render(
        <DetailModal
          isOpen={true}
          onClose={() => {}}
          mediaType="tv"
          mediaId={456}
        />
      );

      await waitFor(() => {
        // Title appears in both header and content
        const titles = screen.getAllByText("Test TV Show");
        expect(titles.length).toBeGreaterThanOrEqual(1);
      });

      // TV-specific: year + seasons + episodes
      expect(screen.getByText("2022 · 3 seasons · 30 episodes")).toBeInTheDocument();
    });

    it("shows error state on fetch failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: "Not found" }),
      });

      render(
        <DetailModal
          isOpen={true}
          onClose={() => {}}
          mediaType="movie"
          mediaId={999}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Couldn't load details")).toBeInTheDocument();
      });
    });
  });

  describe("closing behavior", () => {
    it("calls onClose when close button is clicked", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMovieDetails),
      });

      const onClose = vi.fn();

      render(
        <DetailModal
          isOpen={true}
          onClose={onClose}
          mediaType="movie"
          mediaId={123}
        />
      );

      const closeButton = screen.getByLabelText("Close modal");
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose on ESC key", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMovieDetails),
      });

      const onClose = vi.fn();

      const { container } = render(
        <DetailModal
          isOpen={true}
          onClose={onClose}
          mediaType="movie"
          mediaId={123}
        />
      );

      const dialog = container.querySelector("dialog")!;
      fireEvent.keyDown(dialog, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("accessibility", () => {
    it("has aria-labelledby pointing to the title", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMovieDetails),
      });

      const { container } = render(
        <DetailModal
          isOpen={true}
          onClose={() => {}}
          mediaType="movie"
          mediaId={123}
        />
      );

      const dialog = container.querySelector("dialog")!;
      expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");

      await waitFor(() => {
        // The title element itself has the id="modal-title"
        const titleElement = container.querySelector("#modal-title");
        expect(titleElement).toBeInTheDocument();
        expect(titleElement).toHaveTextContent("Test Movie");
      });
    });

    it("has close button with aria-label", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMovieDetails),
      });

      render(
        <DetailModal
          isOpen={true}
          onClose={() => {}}
          mediaType="movie"
          mediaId={123}
        />
      );

      expect(screen.getByLabelText("Close modal")).toBeInTheDocument();
    });
  });
});
