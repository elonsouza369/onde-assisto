import "server-only";
import { isSearch, type Filters, type SortOrder } from "@/lib/filters";
import { REVALIDATE_CONTENT, tmdbFetch } from "./http";
import { mapMovie, mapProviders, type RawMovie, type RawWatchProviders } from "./mappers";
import type { Movie, MoviePage, Provider } from "./types";

export const MAX_PAGE = 500;

type RawMovieList = { page: number; total_pages: number; results: RawMovie[] };
type Params = Record<string, string | number | undefined>;

function sortParams(ordem: SortOrder): Params {
  switch (ordem) {
    case "nota":
      return { sort_by: "vote_average.desc", "vote_count.gte": 200 };
    case "lancamento":
      return {
        sort_by: "primary_release_date.desc",
        "primary_release_date.lte": new Date().toISOString().slice(0, 10),
      };
    case "titulo":
      return { sort_by: "title.asc" };
    default:
      return { sort_by: "popularity.desc" };
  }
}

const orList = (ids: number[]) => (ids.length ? ids.join("|") : undefined);

export async function getMovieProviders(id: number, pais: string): Promise<Provider[]> {
  const data = await tmdbFetch<RawWatchProviders>(`/movie/${id}/watch/providers`, {}, REVALIDATE_CONTENT);
  return mapProviders(data.results[pais]?.flatrate);
}

async function withProviders(results: RawMovie[], pais: string): Promise<Movie[]> {
  const providers = await Promise.allSettled(results.map((m) => getMovieProviders(m.id, pais)));
  return results.map((m, i) => {
    const outcome = providers[i];
    return mapMovie(m, outcome.status === "fulfilled" ? outcome.value : []);
  });
}

function toPage(data: RawMovieList, movies: Movie[]): MoviePage {
  return { movies, page: data.page, totalPages: Math.min(data.total_pages, MAX_PAGE) };
}

export async function discoverMovies(f: Filters, pagina: number): Promise<MoviePage> {
  const data = await tmdbFetch<RawMovieList>(
    "/discover/movie",
    {
      watch_region: f.pais,
      with_watch_monetization_types: "flatrate",
      with_watch_providers: orList(f.streamings),
      with_genres: orList(f.generos),
      include_adult: "false",
      page: pagina,
      ...sortParams(f.ordem),
    },
    REVALIDATE_CONTENT,
  );
  return toPage(data, await withProviders(data.results, f.pais));
}

export async function searchMovies(f: Filters, pagina: number): Promise<MoviePage> {
  const data = await tmdbFetch<RawMovieList>(
    "/search/movie",
    { query: f.q, page: pagina, include_adult: "false" },
    REVALIDATE_CONTENT,
  );
  const movies = (await withProviders(data.results, f.pais)).filter(
    (m) =>
      m.providers.length > 0 &&
      (f.streamings.length === 0 || m.providers.some((p) => f.streamings.includes(p.id))) &&
      (f.generos.length === 0 || m.genreIds.some((g) => f.generos.includes(g))),
  );
  return toPage(data, movies);
}

export function fetchCatalogPage(f: Filters, pagina: number): Promise<MoviePage> {
  return isSearch(f) ? searchMovies(f, pagina) : discoverMovies(f, pagina);
}
