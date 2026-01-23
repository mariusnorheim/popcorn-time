import { NextResponse } from "next/server";
import { MovieDb } from "moviedb-promise";
import { env } from "~/env";

type MediaType = "movie" | "tv";

function isMediaType(v: string | null): v is MediaType {
  return v === "movie" || v === "tv";
}

function parseId(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
};

export type MediaDetails = {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_year: number | null;
  media_type: MediaType;
  // TV-specific
  number_of_seasons?: number;
  number_of_episodes?: number;
  // Cast
  cast: CastMember[];
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const typeParam = url.searchParams.get("type");
  const idParam = url.searchParams.get("id");

  const type: MediaType = isMediaType(typeParam) ? typeParam : "movie";
  const id = parseId(idParam);

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "INVALID_ID", message: "Missing or invalid id parameter" },
      { status: 400 }
    );
  }

  const moviedb = new MovieDb(env.TMDB_API_KEY);

  try {
    if (type === "movie") {
      const res = await moviedb.movieInfo({
        id,
        append_to_response: "credits",
      });

      const credits = (res as any).credits;
      const cast: CastMember[] = (credits?.cast ?? [])
        .slice(0, 12)
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character ?? "",
          profile_path: c.profile_path,
        }));

      // Extract year from release_date (format: "YYYY-MM-DD")
      const releaseYear = res.release_date
        ? parseInt(res.release_date.slice(0, 4), 10)
        : null;

      const details: MediaDetails = {
        id: res.id!,
        title: res.title ?? "",
        original_title: res.original_title,
        overview: res.overview ?? "",
        poster_path: res.poster_path ?? null,
        backdrop_path: res.backdrop_path ?? null,
        vote_average: res.vote_average ?? 0,
        vote_count: res.vote_count ?? 0,
        release_year: Number.isFinite(releaseYear) ? releaseYear : null,
        media_type: "movie",
        cast,
      };

      return NextResponse.json(details);
    }

    // TV show
    const res = await moviedb.tvInfo({
      id,
      append_to_response: "credits",
    });

    const credits = (res as any).credits;
    const cast: CastMember[] = (credits?.cast ?? [])
      .slice(0, 12)
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        character: c.character ?? "",
        profile_path: c.profile_path,
      }));

    // Extract year from first_air_date (format: "YYYY-MM-DD")
    const releaseYear = res.first_air_date
      ? parseInt(res.first_air_date.slice(0, 4), 10)
      : null;

    const details: MediaDetails = {
      id: res.id!,
      title: res.name ?? "",
      original_title: res.original_name,
      overview: res.overview ?? "",
      poster_path: res.poster_path ?? null,
      backdrop_path: res.backdrop_path ?? null,
      vote_average: res.vote_average ?? 0,
      vote_count: res.vote_count ?? 0,
      release_year: Number.isFinite(releaseYear) ? releaseYear : null,
      media_type: "tv",
      number_of_seasons: res.number_of_seasons,
      number_of_episodes: res.number_of_episodes,
      cast,
    };

    return NextResponse.json(details);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: "TMDB_REQUEST_FAILED", message },
      { status: 502 }
    );
  }
}
