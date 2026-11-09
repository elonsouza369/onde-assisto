import { CountrySelect } from "@/components/CountrySelect";
import { FeaturedHero } from "@/components/FeaturedHero";
import { FilterBar } from "@/components/FilterBar";
import { MovieGrid } from "@/components/MovieGrid";
import { SearchBox } from "@/components/SearchBox";
import { filtersToSearchParams, isSearch, parseFilters, type Filters, type SortOrder } from "@/lib/filters";
import { getMarcas } from "@/lib/listas";
import { fetchCatalogPage, getGenres, getMovieDetails, getProviders, getRegions } from "@/lib/tmdb";

const ROW_TITLES: Record<SortOrder, string> = {
  popularidade: "Em alta agora",
  nota: "Os mais bem avaliados",
  lancamento: "Chegaram há pouco",
  titulo: "De A a Z",
};

function rowTitle(filters: Filters): string {
  return isSearch(filters) ? `Resultados para “${filters.q.trim()}”` : ROW_TITLES[filters.ordem];
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const regions = await getRegions();
  const filters = parseFilters(
    await searchParams,
    regions.map((r) => r.code),
  );
  const [providers, genres, initial, marcas] = await Promise.all([
    getProviders(filters.pais),
    getGenres(),
    fetchCatalogPage(filters, 1),
    getMarcas(),
  ]);
  const countryName = regions.find((r) => r.code === filters.pais)?.name ?? filters.pais;

  // O destaque é o primeiro filme da lista; se os detalhes falharem, a página segue sem ele.
  const top = isSearch(filters) ? undefined : initial.movies[0];
  const featured = top ? await getMovieDetails(top.id, filters.pais).catch(() => null) : null;

  return (
    <main className="flex flex-1 flex-col">
      {featured ? <FeaturedHero movie={featured} pais={filters.pais} marca={marcas[featured.id] ?? null} /> : <div className="h-24" />}
      <div
        className={`relative z-10 flex flex-col gap-10 px-4 sm:px-12 ${featured ? "-mt-24 md:-mt-32" : ""}`}
      >
        <div className="flex flex-col gap-5">
          <div className="flex max-w-3xl gap-3">
            <SearchBox filters={filters} />
            <CountrySelect filters={filters} regions={regions} />
          </div>
          <FilterBar filters={filters} providers={providers} genres={genres} countryName={countryName} />
        </div>
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold sm:text-2xl">{rowTitle(filters)}</h2>
          <MovieGrid key={filtersToSearchParams(filters).toString()} initial={initial} filters={filters} />
        </section>
      </div>
    </main>
  );
}
