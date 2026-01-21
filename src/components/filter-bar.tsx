import React from "react";

export type MediaType = "movie" | "tv";
export type SortMode = "trending" | "popular" | "top_rated";
export type TimeWindow = "day" | "week";

export type Genre = {
  id: number;
  name: string;
};

type Props = {
  mediaType: MediaType;
  setMediaType: (v: MediaType) => void;
  sort: SortMode;
  setSort: (v: SortMode) => void;
  timeWindow: TimeWindow;
  setTimeWindow: (v: TimeWindow) => void;
  query: string;
  setQuery: (v: string) => void;
  genres: Genre[];
  selectedGenreIds: number[];
  toggleGenreId: (id: number) => void;
};

function SegmentedButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1.5 text-sm font-medium transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        active
          ? "bg-slate-100 text-slate-900 shadow-sm"
          : "text-slate-200 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1 text-sm transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        active
          ? "border-cyan-300/60 bg-cyan-400/15 text-cyan-100"
          : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function FilterBar(props: Props) {
  const isTrending = props.sort === "trending";
  const isSearching = props.query.trim().length > 0;
  const placeholderForType =
    props.mediaType === "movie"
      ? "Search movies (title or actor)…"
      : "Search TV shows (title or actor)…";

  return (
    <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative w-full">
              <input
                value={props.query}
                onChange={(e) => props.setQuery(e.target.value)}
                placeholder={placeholderForType}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 pr-10 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
              />
              {isSearching ? (
                <button
                  type="button"
                  onClick={() => props.setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Media type tabs */}
            <div className="inline-flex overflow-hidden rounded-lg border border-white/10 bg-white/5">
              <SegmentedButton
                active={props.mediaType === "movie"}
                onClick={() => props.setMediaType("movie")}
              >
                Movies
              </SegmentedButton>
              <SegmentedButton
                active={props.mediaType === "tv"}
                onClick={() => props.setMediaType("tv")}
              >
                TV
              </SegmentedButton>
            </div>

            {/* Sort + time */}
            <div className="inline-flex overflow-hidden rounded-lg border border-white/10 bg-white/5">
              <SegmentedButton
                active={props.sort === "trending"}
                onClick={() => props.setSort("trending")}
              >
                Trending
              </SegmentedButton>
              <SegmentedButton
                active={props.sort === "popular"}
                onClick={() => props.setSort("popular")}
              >
                Popular
              </SegmentedButton>
              <SegmentedButton
                active={props.sort === "top_rated"}
                onClick={() => props.setSort("top_rated")}
              >
                Top rated
              </SegmentedButton>
            </div>

            {/* Time window (only for trending) */}
            {isTrending ? (
              <div className="inline-flex overflow-hidden rounded-lg border border-white/10 bg-white/5">
                <SegmentedButton
                  active={props.timeWindow === "day"}
                  onClick={() => props.setTimeWindow("day")}
                >
                  Today
                </SegmentedButton>
                <SegmentedButton
                  active={props.timeWindow === "week"}
                  onClick={() => props.setTimeWindow("week")}
                >
                  This week
                </SegmentedButton>
              </div>
            ) : (
              <div className="text-sm text-slate-300">
                {isSearching
                  ? "Genres are disabled while searching."
                  : "Tip: add a genre (multi-select)"}
              </div>
            )}
          </div>

          {/* Genres */}
          {!isTrending && !isSearching && props.genres.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {props.genres.map((g) => (
                <Chip
                  key={g.id}
                  active={props.selectedGenreIds.includes(g.id)}
                  onClick={() => props.toggleGenreId(g.id)}
                >
                  {g.name}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

