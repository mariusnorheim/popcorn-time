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
      // Prefer matching cast to return titles featuring the person.
      let resolvedCastId = castId;
      if (!resolvedCastId) {
        const people = await moviedb.searchPerson({ query: q, page: 1 });
        resolvedCastId = people?.results?.[0]?.id;
      }

      if (resolvedCastId) {
        const res =
          type === "movie"
            ? await moviedb.discoverMovie({
                with_cast: String(resolvedCastId),
                include_adult: false,
                include_video: false,
                page,
                sort_by: "popularity.desc",
              })
            : await moviedb.discoverTv({
                with_cast: String(resolvedCastId),
                page,
                sort_by: "popularity.desc",
              });
        return NextResponse.json(res);
      }

      // Fallback: search by title if no person match.
      const res =
        type === "movie"
          ? await moviedb.searchMovie({ query: q, page, include_adult: false })
          : await moviedb.searchTv({ query: q, page });
      return NextResponse.json(res);
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

