'use client'
import React, { useEffect, useState } from 'react';
import type { MovieResult, TrendingResponse, TvResult } from "moviedb-promise";
import Card from '@components/card';
import FilterBar, {
  type Genre,
  type MediaType,
  type SortMode,
  type TimeWindow,
} from "@components/filter-bar";

type AnyResult = MovieResult | TvResult;

type ApiError = { ok: false; error: string; message?: string };

function isApiError(x: unknown): x is ApiError {
  return (
    typeof x === "object" &&
    x !== null &&
    "ok" in x &&
    (x as any).ok === false &&
    typeof (x as any).error === "string"
  );
}

function makeKey(item: AnyResult, mediaType: MediaType): string {
  if ("id" in item && item.id !== undefined) {
    return `${mediaType}-${item.id}`;
  }
  const name =
    ("name" in item && item.name) ||
    ("title" in item && item.title) ||
    "unknown";
  const path =
    ("poster_path" in item && item.poster_path) ||
    ("profile_path" in item && item.profile_path) ||
    "";
  return `${mediaType}-${name}-${path}`;
}

function dedupeResults(list: AnyResult[], mediaType: MediaType): AnyResult[] {
  const seen = new Set<string>();
  const out: AnyResult[] = [];
  for (const item of list) {
    const key = makeKey(item, mediaType);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

async function fetchTmdb<T>(params: {
  type: MediaType;
  sort: SortMode;
  timeWindow: TimeWindow;
  genres: number[];
  q?: string;
  page?: number;
  castId?: number;
}): Promise<T> {
  const qs = new URLSearchParams();
  qs.set("type", params.type);
  qs.set("sort", params.sort);
  qs.set("timeWindow", params.timeWindow);
  if (params.genres.length > 0) qs.set("genres", params.genres.join(","));
  if (params.q && params.q.trim().length > 0) qs.set("q", params.q.trim());
  if (params.page && params.page > 1) qs.set("page", String(params.page));
  if (params.castId) qs.set("castId", String(params.castId));

  const res = await fetch(`/api/tmdb?${qs.toString()}`);
  const json = (await res.json()) as unknown;
  if (!res.ok || isApiError(json)) {
    const msg = isApiError(json)
      ? json.message ?? json.error
      : `TMDB proxy failed: ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

async function fetchGenres(type: MediaType): Promise<Genre[]> {
  const res = await fetch(`/api/tmdb/genres?type=${encodeURIComponent(type)}`);
  const json = (await res.json()) as unknown;
  if (!res.ok || isApiError(json)) {
    const msg = isApiError(json)
      ? json.message ?? json.error
      : `TMDB genres failed: ${res.status}`;
    throw new Error(msg);
  }
  return (json as { genres?: Genre[] }).genres ?? [];
}

export default function HomePage() {
  const [mediaType, setMediaType] = useState<MediaType>("movie");
  const [sort, setSort] = useState<SortMode>("trending");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("week");
  const [query, setQuery] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);
  const [castId, setCastId] = useState<number | undefined>(undefined);

  const [result, setResult] = useState<AnyResult[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  // Load genres whenever the media type changes (movies/TV only).
  useEffect(() => {
    fetchGenres(mediaType)
      .then((g) => setGenres(g))
      .catch((e) => {
        console.error(e);
        setError(
          e instanceof Error ? e.message : "Failed to load genres. Please retry.",
        );
      });
    setSelectedGenreIds([]);
  }, [mediaType]);

  // Reset paging when filter state changes.
  useEffect(() => {
    setResult([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setLoadMoreError(null);
  }, [mediaType, sort, timeWindow, selectedGenreIds, query, castId]);

  // Fetch first page when filter state changes.
  useEffect(() => {
    const isTrending = sort === "trending";
    const isSearching = query.trim().length > 0;
    const genresToSend = isTrending || isSearching ? [] : selectedGenreIds;

    setIsLoading(true);
    setError(null);
    fetchTmdb<{
      page?: number;
      total_pages?: number;
      results?: AnyResult[];
    }>({
      type: mediaType,
      sort,
      timeWindow,
      genres: genresToSend,
      q: query.trim(),
      page: 1,
      castId,
    })
      .then((res) => {
        const next = res.results ?? [];
        setResult(dedupeResults(next, mediaType));
        const totalPages = res.total_pages ?? 1;
        setHasMore(1 < totalPages);
      })
      .catch((e) => {
        console.error(e);
        setError(
          e instanceof Error
            ? e.message
            : "Something went wrong fetching results. Please retry.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [mediaType, sort, timeWindow, selectedGenreIds, query, castId]);

  // Infinite scroll: load next page when sentinel becomes visible.
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    if (!hasMore) return;
    if (isLoading || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;

        const nextPage = page + 1;
        setIsLoadingMore(true);
        setLoadMoreError(null);

        const isTrending = sort === "trending";
        const isSearching = query.trim().length > 0;
        const genresToSend = isTrending || isSearching ? [] : selectedGenreIds;

        fetchTmdb<{
          page?: number;
          total_pages?: number;
          results?: AnyResult[];
        }>({
          type: mediaType,
          sort,
          timeWindow,
          genres: genresToSend,
          q: query.trim(),
          page: nextPage,
          castId,
        })
          .then((res) => {
            const next = res.results ?? [];
            setResult((prev) => dedupeResults([...prev, ...next], mediaType));
            setPage(nextPage);
            const totalPages = res.total_pages ?? nextPage;
            setHasMore(nextPage < totalPages);
          })
          .catch((e) => {
            console.error(e);
            setLoadMoreError(
              e instanceof Error
                ? e.message
                : "Failed to load more results. Try again.",
            );
            // Back off to avoid repeated requests while sentinel is visible.
            setHasMore(false);
          })
          .finally(() => setIsLoadingMore(false));
      },
      { rootMargin: "600px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [
    hasMore,
    isLoading,
    isLoadingMore,
    mediaType,
    page,
    query,
    selectedGenreIds,
    sort,
    timeWindow,
    castId,
  ]);

  const toggleGenreId = (id: number) => {
    setSelectedGenreIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const retry = () => {
    setError(null);
    setLoadMoreError(null);
    setHasMore(true);
    setResult([]);
    setPage(1);
  };

  const pivotToCast = (type: "movie" | "tv", person: PersonResult) => {
    setMediaType(type);
    setCastId(person.id);
    setCastName(person.name ?? "Selected person");
    setQuery("");
    setSelectedGenreIds([]);
    setSort("popular");
  };

    return (
        <main>
            <FilterBar
              mediaType={mediaType}
              setMediaType={(t) => {
                setMediaType(t);
                setCastId(undefined);
              }}
              sort={sort}
              setSort={setSort}
              timeWindow={timeWindow}
              setTimeWindow={setTimeWindow}
              query={query}
              setQuery={setQuery}
              genres={genres.slice(0, 12)}
              selectedGenreIds={selectedGenreIds}
              toggleGenreId={toggleGenreId}
            />
            <div className="container mx-auto px-4">
                {error ? (
                  <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    <div className="font-semibold">Couldn’t load results</div>
                    <div className="mt-1 text-red-100/90">{error}</div>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={retry}
                        className="rounded-lg border border-red-400/30 bg-white/5 px-3 py-1.5 text-xs text-red-50 hover:bg-white/10"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : null}
                {isLoading ? (
                  <div className="py-6 text-center text-slate-200">Loading…</div>
                ) : null}
                {!isLoading && !error && result.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-slate-500/30 bg-slate-800/50 px-4 py-6 text-center">
                    <div className="text-sm text-slate-200">No matches found.</div>
                    <div className="mt-1 text-sm text-slate-400">
                      Try a broader search or adjust filters.
                    </div>
                  </div>
                ) : null}
                <div className="card-container grid gap-4 py-2">
                    {result?.map((res: AnyResult, idx: number) => {
                        let name, description, imageUrl, rating;

                        if('title' in res && res.title) {
                            name = res.title;
                        } else if('name' in res && res.name) {
                            name = res.name;
                        }

                        if('overview' in res && res.overview) {
                            description = res.overview;
                        } else {
                            description = '';
                        }

                        if('poster_path' in res && res.poster_path) {
                            imageUrl = `https://image.tmdb.org/t/p/w400${res.poster_path}`;
                        } else if('profile_path' in res && res.profile_path) {
                            imageUrl = `https://image.tmdb.org/t/p/w400${res.profile_path}`;
                        }

                        if ('vote_average' in res && typeof res.vote_average === "number") {
                          rating = res.vote_average;
                        }

                        const key =
                          "id" in res && res.id !== undefined
                            ? `${mediaType}-${res.id}`
                            : `${mediaType}-idx-${idx}`;

                        return (
                            <Card
                                key={key}
                                movie={{
                                    id: res.id,
                                    name: name ?? '',
                                    description: description,
                                    imageUrl: imageUrl ?? '',
                                    rating,
                                }}
                            />
                        );
                    })}
                </div>
                <div ref={loadMoreRef} className="h-10" />
                {isLoadingMore ? (
                  <div className="py-6 text-center text-slate-300">
                    Loading more…
                  </div>
                ) : null}
                {loadMoreError ? (
                  <div className="pb-8 text-center text-sm text-red-200">
                    {loadMoreError}
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setLoadMoreError(null);
                          setHasMore(true);
                        }}
                        className="rounded-lg border border-red-400/30 bg-white/5 px-3 py-1.5 text-xs text-red-50 hover:bg-white/10"
                      >
                        Try loading more
                      </button>
                    </div>
                  </div>
                ) : null}
            </div>
        </main>
    );
};