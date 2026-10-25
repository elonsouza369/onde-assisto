import { CountrySelect } from "@/components/CountrySelect";
import { FilterBar } from "@/components/FilterBar";
import { MovieGrid } from "@/components/MovieGrid";
import { SearchBox } from "@/components/SearchBox";
import { filtersToSearchParams, parseFilters } from "@/lib/filters";
import { fetchCatalogPage, getGenres, getProviders, getRegions } from "@/lib/tmdb";

export default async function Home({ searchParams }: PageProps<"/">) {
  const regions = await getRegions();
  const filters = parseFilters(
    await searchParams,
    regions.map((r) => r.code),
  );
  const [providers, genres, initial] = await Promise.all([
    getProviders(filters.pais),
    getGenres(),
    fetchCatalogPage(filters, 1),
  ]);
  const countryName = regions.find((r) => r.code === filters.pais)?.name ?? filters.pais;

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pb-8 sm:px-8">
      <div className="flex gap-3">
        <SearchBox filters={filters} />
        <CountrySelect filters={filters} regions={regions} />
      </div>
      <FilterBar filters={filters} providers={providers} genres={genres} countryName={countryName} />
      <MovieGrid key={filtersToSearchParams(filters).toString()} initial={initial} filters={filters} />
    </main>
  );
}
