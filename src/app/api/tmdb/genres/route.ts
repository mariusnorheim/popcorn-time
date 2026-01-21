import { NextResponse } from "next/server";
import { MovieDb } from "moviedb-promise";
import { env } from "~/env";

type MediaType = "movie" | "tv";

function isMediaType(v: string | null): v is MediaType {
  return v === "movie" || v === "tv";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const typeParam = url.searchParams.get("type");
  const type: MediaType = isMediaType(typeParam) ? typeParam : "movie";

  const moviedb = new MovieDb(env.TMDB_API_KEY);

  try {
    const res =
      type === "movie" ? await moviedb.genreMovieList() : await moviedb.genreTvList();
    return NextResponse.json(res);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: "TMDB_GENRES_FAILED", message },
      { status: 502 },
    );
  }
}

