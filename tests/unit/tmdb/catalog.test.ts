import type { Filters } from "@/lib/filters";
import { tmdbFetch } from "@/lib/tmdb/http";
import { discoverMovies, fetchCatalogPage, getMovieProviders, searchMovies } from "@/lib/tmdb/catalog";

vi.mock("@/lib/tmdb/http", () => ({ tmdbFetch: vi.fn(), REVALIDATE_CONTENT: 21600 }));
const fetchMock = vi.mocked(tmdbFetch);

const base: Filters = { pais: "BR", streamings: [], generos: [], ordem: "popularidade", q: "" };

const netflix = { provider_id: 8, provider_name: "Netflix", logo_path: "/n.jpg", display_priority: 1 };
const prime = { provider_id: 119, provider_name: "Prime", logo_path: "/p.jpg", display_priority: 2 };

function raw(id: number, genre_ids: number[] = [27]) {
  return { id, title: `Filme ${id}`, release_date: "2024-01-01", poster_path: null, vote_average: 7, genre_ids };
}

type Routes = {
  list?: { results: ReturnType<typeof raw>[]; page?: number; total_pages?: number };
  providers?: Record<number, unknown[] | Error>;
};

function route({ list, providers = {} }: Routes) {
  fetchMock.mockImplementation(async (path: string) => {
    const match = path.match(/^\/movie\/(\d+)\/watch\/providers$/);
    if (match) {
      const value = providers[Number(match[1])] ?? [];
      if (value instanceof Error) throw value;
      return { results: { BR: { flatrate: value } } };
    }
    return { page: 1, total_pages: 1, ...list };
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-24T12:00:00Z"));
});

afterEach(() => vi.useRealTimers());

describe("discoverMovies", () => {
  it("envia filtros corretos", async () => {
    route({ list: { results: [] } });
    await discoverMovies({ ...base, streamings: [8, 119], generos: [27, 35], ordem: "nota" }, 2);
    expect(fetchMock).toHaveBeenCalledWith(
      "/discover/movie",
      expect.objectContaining({
        watch_region: "BR",
        with_watch_monetization_types: "flatrate",
        with_watch_providers: "8|119",
        with_genres: "27|35",
        sort_by: "vote_average.desc",
        "vote_count.gte": 200,
        page: 2,
        include_adult: "false",
      }),
      21600,
    );
  });

  it.each([
    ["popularidade", { sort_by: "popularity.desc" }],
    ["lancamento", { sort_by: "primary_release_date.desc", "primary_release_date.lte": "2026-10-24" }],
    ["titulo", { sort_by: "title.asc" }],
  ] as const)("ordem %s", async (ordem, expected) => {
    route({ list: { results: [] } });
    await discoverMovies({ ...base, ordem }, 1);
    const params = fetchMock.mock.calls[0][1];
    expect(params).toMatchObject(expected);
    expect(params["vote_count.gte"]).toBeUndefined();
  });

  it("sem streamings e gêneros não envia esses filtros", async () => {
    route({ list: { results: [] } });
    await discoverMovies(base, 1);
    const params = fetchMock.mock.calls[0][1];
    expect(params.with_watch_providers).toBeUndefined();
    expect(params.with_genres).toBeUndefined();
  });

  it("anexa provedores de cada filme e tolera falha individual", async () => {
    route({ list: { results: [raw(1), raw(2)] }, providers: { 1: [netflix], 2: new Error("falhou") } });
    const page = await discoverMovies(base, 1);
    expect(page.movies.map((m) => m.id)).toEqual([1, 2]);
    expect(page.movies[0].providers.map((p) => p.name)).toEqual(["Netflix"]);
    expect(page.movies[1].providers).toEqual([]);
  });

  it("totalPages é limitado a 500", async () => {
    route({ list: { results: [], page: 3, total_pages: 9999 } });
    expect(await discoverMovies(base, 3)).toMatchObject({ page: 3, totalPages: 500 });
  });
});

describe("searchMovies", () => {
  it("envia query e include_adult=false", async () => {
    route({ list: { results: [] } });
    await searchMovies({ ...base, q: "ação & cia" }, 2);
    expect(fetchMock).toHaveBeenCalledWith(
      "/search/movie",
      { query: "ação & cia", page: 2, include_adult: "false" },
      21600,
    );
  });

  it("mantém só filmes em streaming no país", async () => {
    route({ list: { results: [raw(1), raw(2), raw(3)] }, providers: { 1: [netflix], 3: [prime] } });
    const page = await searchMovies({ ...base, q: "x" }, 1);
    expect(page.movies.map((m) => m.id)).toEqual([1, 3]);
  });

  it("aplica filtro de streaming e gênero (OU)", async () => {
    route({
      list: { results: [raw(1, [27]), raw(2, [35]), raw(3, [18]), raw(4, [27])] },
      providers: { 1: [netflix], 2: [prime], 3: [netflix], 4: [{ ...netflix, provider_id: 337 }] },
    });
    const page = await searchMovies({ ...base, q: "x", streamings: [8, 119], generos: [27, 35] }, 1);
    expect(page.movies.map((m) => m.id)).toEqual([1, 2]);
  });
});

describe("searchMovies com páginas sem resultados", () => {
  it("continua para a próxima página até achar resultados", async () => {
    fetchMock.mockImplementation(async (path: string, params: Record<string, unknown>) => {
      if (path.endsWith("/watch/providers")) {
        return { results: { BR: { flatrate: path === "/movie/20/watch/providers" ? [netflix] : [] } } };
      }
      return params.page === 1
        ? { page: 1, total_pages: 5, results: [raw(10)] }
        : { page: 2, total_pages: 5, results: [raw(20)] };
    });
    const page = await searchMovies({ ...base, q: "x" }, 1);
    expect(page).toMatchObject({ page: 2, totalPages: 5 });
    expect(page.movies.map((m) => m.id)).toEqual([20]);
  });

  it("para depois de 3 páginas vazias", async () => {
    fetchMock.mockImplementation(async (path: string, params: Record<string, unknown>) =>
      path.endsWith("/watch/providers")
        ? { results: {} }
        : { page: params.page, total_pages: 50, results: [raw(Number(params.page))] },
    );
    const page = await searchMovies({ ...base, q: "x" }, 4);
    expect(page).toMatchObject({ movies: [], page: 6, totalPages: 50 });
    expect(fetchMock.mock.calls.filter(([p]) => p === "/search/movie")).toHaveLength(3);
  });

  it("para na última página", async () => {
    route({ list: { results: [raw(1)], page: 1, total_pages: 1 } });
    const page = await searchMovies({ ...base, q: "x" }, 1);
    expect(page).toMatchObject({ movies: [], page: 1, totalPages: 1 });
    expect(fetchMock.mock.calls.filter(([p]) => p === "/search/movie")).toHaveLength(1);
  });
});

it("getMovieProviders devolve só flatrate do país", async () => {
  fetchMock.mockResolvedValue({ results: { BR: { flatrate: [netflix], rent: [prime] } } });
  expect((await getMovieProviders(5, "BR")).map((p) => p.id)).toEqual([8]);
  expect(fetchMock).toHaveBeenCalledWith("/movie/5/watch/providers", {}, 21600);
  expect(await getMovieProviders(5, "US")).toEqual([]);
});

it("fetchCatalogPage escolhe busca quando há q", async () => {
  route({ list: { results: [] } });
  await fetchCatalogPage({ ...base, q: "duna" }, 1);
  expect(fetchMock.mock.calls[0][0]).toBe("/search/movie");
  fetchMock.mockClear();
  await fetchCatalogPage(base, 1);
  expect(fetchMock.mock.calls[0][0]).toBe("/discover/movie");
});
