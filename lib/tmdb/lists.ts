import "server-only";
import { REVALIDATE_LISTS, tmdbFetch } from "./http";
import { mapProviders, type RawProvider } from "./mappers";
import type { Genre, Provider, Region } from "./types";

type RawRegion = { iso_3166_1: string; english_name: string; native_name?: string };

export async function getProviders(pais: string): Promise<Provider[]> {
  const data = await tmdbFetch<{ results: RawProvider[] }>(
    "/watch/providers/movie",
    { watch_region: pais },
    REVALIDATE_LISTS,
  );
  return mapProviders(
    data.results.map((p) => ({ ...p, display_priority: p.display_priorities?.[pais] ?? p.display_priority })),
  );
}

export async function getGenres(): Promise<Genre[]> {
  const data = await tmdbFetch<{ genres: Genre[] }>("/genre/movie/list", {}, REVALIDATE_LISTS);
  return data.genres;
}

export async function getRegions(): Promise<Region[]> {
  const data = await tmdbFetch<{ results: RawRegion[] }>("/watch/providers/regions", {}, REVALIDATE_LISTS);
  return data.results
    .map((r) => ({ code: r.iso_3166_1, name: r.native_name || r.english_name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
