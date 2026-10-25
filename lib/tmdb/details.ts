import "server-only";
import { REVALIDATE_CONTENT, tmdbFetch } from "./http";
import { mapDetails, type RawMovieDetails } from "./mappers";
import type { MovieDetails } from "./types";

export async function getMovieDetails(id: number, pais: string): Promise<MovieDetails> {
  const raw = await tmdbFetch<RawMovieDetails>(
    `/movie/${id}`,
    { append_to_response: "watch/providers,videos", include_video_language: "pt,en" },
    REVALIDATE_CONTENT,
  );
  return mapDetails(raw, pais);
}
