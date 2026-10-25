import { tmdbFetch } from "@/lib/tmdb/http";
import { getGenres, getProviders, getRegions } from "@/lib/tmdb/lists";

vi.mock("@/lib/tmdb/http", () => ({ tmdbFetch: vi.fn(), REVALIDATE_LISTS: 86400 }));
const fetchMock = vi.mocked(tmdbFetch);

beforeEach(() => {
  fetchMock.mockReset();
});

it("getProviders busca provedores do país e ordena pela prioridade do país", async () => {
  fetchMock.mockResolvedValue({
    results: [
      { provider_id: 1, provider_name: "Tarde", logo_path: "/t.jpg", display_priority: 1, display_priorities: { BR: 9 } },
      { provider_id: 8, provider_name: "Netflix", logo_path: "/n.jpg", display_priority: 50, display_priorities: { BR: 2 } },
      { provider_id: 3, provider_name: "Sem BR", logo_path: null, display_priority: 5 },
    ],
  });
  const result = await getProviders("BR");
  expect(fetchMock).toHaveBeenCalledWith("/watch/providers/movie", { watch_region: "BR" }, 86400);
  expect(result.map((p) => p.id)).toEqual([8, 3, 1]);
  expect(result[0]).toEqual({ id: 8, name: "Netflix", logoUrl: "https://image.tmdb.org/t/p/w92/n.jpg" });
});

it("getGenres devolve os gêneros", async () => {
  fetchMock.mockResolvedValue({ genres: [{ id: 27, name: "Terror" }] });
  expect(await getGenres()).toEqual([{ id: 27, name: "Terror" }]);
  expect(fetchMock).toHaveBeenCalledWith("/genre/movie/list", {}, 86400);
});

it("getRegions usa nome nativo e ordena em pt-BR", async () => {
  fetchMock.mockResolvedValue({
    results: [
      { iso_3166_1: "US", english_name: "United States", native_name: "Estados Unidos" },
      { iso_3166_1: "BR", english_name: "Brazil", native_name: "Brasil" },
      { iso_3166_1: "AT", english_name: "Austria", native_name: "" },
    ],
  });
  expect(await getRegions()).toEqual([
    { code: "AT", name: "Austria" },
    { code: "BR", name: "Brasil" },
    { code: "US", name: "Estados Unidos" },
  ]);
  expect(fetchMock).toHaveBeenCalledWith("/watch/providers/regions", {}, 86400);
});
