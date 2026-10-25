import { imageUrl } from "./images";
import type { Movie, MovieDetails, Provider } from "./types";

export type RawMovie = {
  id: number;
  title?: string;
  original_title?: string;
  release_date?: string;
  poster_path?: string | null;
  vote_average?: number;
  genre_ids?: number[];
};

export type RawProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority?: number;
  display_priorities?: Record<string, number>;
};

export type RawVideo = { key: string; site: string; type: string; iso_639_1: string };

export type RawRegionProviders = {
  link?: string;
  flatrate?: RawProvider[];
};

export type RawWatchProviders = { results: Record<string, RawRegionProviders | undefined> };

export type RawMovieDetails = RawMovie & {
  runtime?: number | null;
  overview?: string;
  backdrop_path?: string | null;
  genres?: { id: number; name: string }[];
  "watch/providers"?: RawWatchProviders;
  videos?: { results: RawVideo[] };
};

function yearOf(date: string | undefined): number | null {
  const year = Number(date?.slice(0, 4));
  return Number.isInteger(year) && year > 0 ? year : null;
}

function roundRating(value: number | undefined): number {
  return Math.round((value ?? 0) * 10) / 10;
}

export function mapMovie(raw: RawMovie, providers: Provider[] = []): Movie {
  return {
    id: raw.id,
    title: raw.title || raw.original_title || "",
    year: yearOf(raw.release_date),
    posterUrl: imageUrl(raw.poster_path, "w342"),
    rating: roundRating(raw.vote_average),
    genreIds: raw.genre_ids ?? [],
    providers,
  };
}

export function mapProviders(raw: RawProvider[] | undefined): Provider[] {
  return [...(raw ?? [])]
    .sort((a, b) => (a.display_priority ?? 0) - (b.display_priority ?? 0))
    .map((p) => ({ id: p.provider_id, name: p.provider_name, logoUrl: imageUrl(p.logo_path, "w92") }));
}

export function pickTrailer(videos: RawVideo[]): string | null {
  const trailers = videos.filter((v) => v.site === "YouTube" && v.type === "Trailer");
  const preferred = trailers.find((v) => v.iso_639_1 === "pt") ?? trailers.find((v) => v.iso_639_1 === "en");
  return preferred?.key ?? null;
}

export function mapDetails(raw: RawMovieDetails, pais: string): MovieDetails {
  const region = raw["watch/providers"]?.results[pais];
  const base = mapMovie(raw);
  return {
    id: base.id,
    title: base.title,
    year: base.year,
    runtime: raw.runtime || null,
    overview: raw.overview ?? "",
    rating: base.rating,
    posterUrl: base.posterUrl,
    backdropUrl: imageUrl(raw.backdrop_path, "w1280"),
    genres: raw.genres ?? [],
    trailerKey: pickTrailer(raw.videos?.results ?? []),
    providers: mapProviders(region?.flatrate),
    watchLink: region?.link ?? null,
  };
}
