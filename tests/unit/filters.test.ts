import {
  filtersToSearchParams,
  isSearch,
  parseFilters,
  withCountry,
  type Filters,
} from "@/lib/filters";

describe("parseFilters", () => {
  it("usa padrões quando vazio", () => {
    expect(parseFilters({})).toEqual({
      pais: "BR",
      streamings: [],
      generos: [],
      ordem: "popularidade",
      q: "",
      nota: null,
    });
  });

  it("lê todos os parâmetros", () => {
    expect(
      parseFilters({ pais: "us", streaming: "8,119", genero: "27,35", ordem: "nota", q: " batman ", nota: "8" }),
    ).toEqual({ pais: "US", streamings: [8, 119], generos: [27, 35], ordem: "nota", q: "batman", nota: 8 });
  });

  it("ignora valores inválidos", () => {
    expect(
      parseFilters({ pais: "XX", streaming: "8,abc,-1,2.5", genero: "x", ordem: "abc" }, ["BR", "US"]),
    ).toEqual({ pais: "BR", streamings: [8], generos: [], ordem: "popularidade", q: "", nota: null });
  });

  it.each(["6", "10", "8.5", "abc", ""])("ignora nota fora dos atalhos (%s)", (nota) => {
    expect(parseFilters({ nota }).nota).toBeNull();
  });

  it.each([7, 8, 9])("aceita nota %i", (nota) => {
    expect(parseFilters({ nota: String(nota) }).nota).toBe(nota);
  });

  it("ignora pais fora do formato mesmo sem lista", () => {
    expect(parseFilters({ pais: "Brasil" }).pais).toBe("BR");
  });

  it("usa o primeiro valor quando repetido", () => {
    expect(parseFilters({ ordem: ["titulo", "nota"] }).ordem).toBe("titulo");
  });
});

describe("filtersToSearchParams", () => {
  it("omite padrões", () => {
    expect(filtersToSearchParams(parseFilters({})).toString()).toBe("");
  });

  it("serializa filtros e página", () => {
    const f: Filters = { pais: "US", streamings: [8, 119], generos: [27], ordem: "nota", q: "ação & cia", nota: 9 };
    const p = filtersToSearchParams(f, { pagina: 2 });
    expect(p.get("pais")).toBe("US");
    expect(p.get("streaming")).toBe("8,119");
    expect(p.get("genero")).toBe("27");
    expect(p.get("ordem")).toBe("nota");
    expect(p.get("q")).toBe("ação & cia");
    expect(p.get("nota")).toBe("9");
    expect(p.get("pagina")).toBe("2");
  });
});

it("withCountry limpa streamings e mantém o resto", () => {
  const f: Filters = { pais: "BR", streamings: [8], generos: [27], ordem: "nota", q: "x", nota: 8 };
  expect(withCountry(f, "US")).toEqual({ ...f, pais: "US", streamings: [] });
});

it("isSearch detecta texto de busca", () => {
  expect(isSearch(parseFilters({ q: "  " }))).toBe(false);
  expect(isSearch(parseFilters({ q: "duna" }))).toBe(true);
});
