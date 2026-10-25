// @vitest-environment node
import { GET } from "@/app/api/movies/route";
import { fetchCatalogPage, getRegions } from "@/lib/tmdb";

vi.mock("@/lib/tmdb", () => ({
  MAX_PAGE: 500,
  fetchCatalogPage: vi.fn(),
  getRegions: vi.fn(),
}));

const catalogMock = vi.mocked(fetchCatalogPage);
const page = { movies: [], page: 2, totalPages: 5 };

beforeEach(() => {
  catalogMock.mockReset();
  vi.mocked(getRegions).mockResolvedValue([
    { code: "BR", name: "Brasil" },
    { code: "US", name: "Estados Unidos" },
  ]);
});

const call = (query: string) => GET(new Request(`http://localhost/api/movies?${query}`));

it("devolve a página pedida com os filtros da URL", async () => {
  catalogMock.mockResolvedValue(page);
  const response = await call("pagina=2&streaming=8&pais=US");
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(page);
  expect(catalogMock).toHaveBeenCalledWith(
    { pais: "US", streamings: [8], generos: [], ordem: "popularidade", q: "" },
    2,
  );
});

it.each(["pagina=0", "pagina=501", "pagina=abc", "pagina=1.5", ""])("rejeita %s", async (query) => {
  const response = await call(query);
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "pagina inválida" });
  expect(catalogMock).not.toHaveBeenCalled();
});

it("responde 502 se o TMDB falhar", async () => {
  catalogMock.mockImplementation(async () => {
    throw new Error("fora do ar");
  });
  const response = await call("pagina=2");
  expect(response.status).toBe(502);
  expect(await response.json()).toEqual({ error: "Não foi possível carregar os filmes" });
});
