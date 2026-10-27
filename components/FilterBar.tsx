"use client";

import { isSearch, type Filters } from "@/lib/filters";
import type { Genre, Provider } from "@/lib/tmdb/types";
import { useFilterNavigation } from "@/lib/useFilterNavigation";
import { GenreFilter } from "./GenreFilter";
import { ProviderFilter } from "./ProviderFilter";
import { SortSelect } from "./SortSelect";

type Props = { filters: Filters; providers: Provider[]; genres: Genre[]; countryName: string };

export function FilterBar({ filters, providers, genres, countryName }: Props) {
  const navigate = useFilterNavigation();
  const searching = isSearch(filters);

  return (
    <section className="flex flex-col gap-4">
      <ProviderFilter
        providers={providers}
        selected={filters.streamings}
        onChange={(streamings) => navigate({ ...filters, streamings })}
      />
      <GenreFilter genres={genres} selected={filters.generos} onChange={(generos) => navigate({ ...filters, generos })} />
      <div className="flex flex-wrap items-center gap-3">
        <SortSelect value={filters.ordem} disabled={searching} onChange={(ordem) => navigate({ ...filters, ordem })} />
        {searching && (
          <p className="text-sm text-muted">Mostrando resultados disponíveis em streaming em {countryName}</p>
        )}
      </div>
    </section>
  );
}
