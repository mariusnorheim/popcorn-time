import { NextResponse } from "next/server";
import { MovieDb } from "moviedb-promise";
import { env } from "~/env";

type MediaType = "movie" | "tv";
type SortMode = "trending" | "popular" | "top_rated";
type TimeWindow = "day" | "week";

function isMediaType(v: string | null): v is MediaType {
  return v === "movie" || v === "tv";
}

function isSortMode(v: string | null): v is SortMode {
  return v === "trending" || v === "popular" || v === "top_rated";
}

function isTimeWindow(v: string | null): v is TimeWindow {
  return v === "day" || v === "week";
}

function parseGenreIds(v: string | null): number[] {
  if (!v) return [];
  return v
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function parsePage(v: string | null): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  return Math.min(500, Math.max(1, Math.floor(n)));
}

function parseOptionalInt(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  const i = Math.floor(n);
  return i > 0 ? i : undefined;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const typeParam = url.searchParams.get("type");
  const sortParam = url.searchParams.get("sort");
  const timeParam = url.searchParams.get("timeWindow");
  const genresParam = url.searchParams.get("genres");
  const pageParam = url.searchParams.get("page");
  const queryParam = url.searchParams.get("q");
  const castIdParam = url.searchParams.get("castId");

  const type: MediaType = isMediaType(typeParam) ? typeParam : "movie";
  const sort: SortMode = isSortMode(sortParam) ? sortParam : "trending";
  const timeWindow: TimeWindow = isTimeWindow(timeParam) ? timeParam : "week";
  const genreIds = parseGenreIds(genresParam);
  const page = parsePage(pageParam);
  const q = queryParam?.trim();
  const castId = parseOptionalInt(castIdParam);

  const moviedb = new MovieDb(env.TMDB_API_KEY);

  try {
    if (q && q.length > 0) {
      // ROOT CAUSE FIX: Search must work for both title queries ("Avatar") and actor
      // queries ("Tom Hardy"). We run both searches in parallel and combine results:
      // - Title matches come first (so "Avatar" finds the movie)
      // - Person filmography is appended (so "Tom Hardy" finds his movies)
      // - Results are deduplicated by ID

      // If caller already provided a castId, use discover with that cast member.
      if (castId) {
        const res =
          type === "movie"
            ? await moviedb.discoverMovie({
                with_cast: String(castId),
                include_adult: false,
                include_video: false,
                page,
                sort_by: "popularity.desc",
              })
            : await moviedb.discoverTv({
                with_cast: String(castId),
                page,
                sort_by: "popularity.desc",
              });
        return NextResponse.json(res);
      }

      // Run title search and person search in parallel for better performance.
      const [titleRes, peopleRes] = await Promise.all([
        type === "movie"
          ? moviedb.searchMovie({ query: q, page, include_adult: false })
          : moviedb.searchTv({ query: q, page }),
        // Only search people on first page to avoid duplicate person lookups
        page === 1 ? moviedb.searchPerson({ query: q, page: 1 }) : null,
      ]);

      const titleResults = titleRes?.results ?? [];
      const person = peopleRes?.results?.[0];

      // If we found a matching person, fetch their filmography
      let personFilmography: typeof titleResults = [];
      if (person?.id) {
        const filmRes =
          type === "movie"
            ? await moviedb.discoverMovie({
                with_cast: String(person.id),
                include_adult: false,
                include_video: false,
                page: 1,
                sort_by: "popularity.desc",
              })
            : await moviedb.discoverTv({
                with_cast: String(person.id),
                page: 1,
                sort_by: "popularity.desc",
              });
        personFilmography = (filmRes?.results ?? []) as typeof titleResults;
      }

      // Combine: title matches first, then person filmography, deduplicated by ID
      const seenIds = new Set<number>();
      const combined: typeof titleResults = [];

      for (const item of titleResults) {
        if (item.id && !seenIds.has(item.id)) {
          seenIds.add(item.id);
          combined.push(item);
        }
      }
      for (const item of personFilmography) {
        if (item.id && !seenIds.has(item.id)) {
          seenIds.add(item.id);
          combined.push(item);
        }
      }

      // Return combined results with pagination info from title search
      return NextResponse.json({
        ...titleRes,
        results: combined,
        // Adjust total if we added person results
        total_results: Math.max(
          titleRes?.total_results ?? 0,
          combined.length
        ),
      });
    }

    if (sort === "trending") {
      const res = await moviedb.trending({
        media_type: type,
        time_window: timeWindow,
        page,
      });
      return NextResponse.json(res);
    }

    // For Popular/Top rated we use "discover" so we can apply genres.
    const with_genres = genreIds.length > 0 ? genreIds.join(",") : undefined;
    const with_cast = castId ? String(castId) : undefined;
    const sort_by = sort === "popular" ? "popularity.desc" : "vote_average.desc";

    const res =
      type === "movie"
        ? await moviedb.discoverMovie({
            sort_by,
            with_genres,
            with_cast,
            include_adult: false,
            include_video: false,
            page,
            vote_count_gte: 200,
          })
        : await moviedb.discoverTv({
            sort_by,
            with_genres,
            with_cast,
            page,
            vote_count_gte: 200,
          });

    return NextResponse.json(res);
  } catch (err) {
    // Avoid leaking upstream details; include a small hint for debugging
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: "TMDB_REQUEST_FAILED", message },
      { status: 502 },
    );
  }
}

