export type SortOrder = "popularidade" | "nota" | "lancamento" | "titulo";

export type Filters = {
  pais: string;
  streamings: number[];
  generos: number[];
  ordem: SortOrder;
  q: string;
};

export const DEFAULT_COUNTRY = "BR";
const DEFAULT_ORDER: SortOrder = "popularidade";
const SORT_ORDERS: SortOrder[] = ["popularidade", "nota", "lancamento", "titulo"];

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function parseIds(value: string): number[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => /^\d+$/.test(part))
    .map(Number)
    .filter((id) => id > 0);
}

function parseCountry(value: string, validCountries?: string[]): string {
  if (!/^[A-Za-z]{2}$/.test(value)) return DEFAULT_COUNTRY;
  const code = value.toUpperCase();
  if (validCountries && !validCountries.includes(code)) return DEFAULT_COUNTRY;
  return code;
}

export function parseFilters(params: RawParams, validCountries?: string[]): Filters {
  const ordem = first(params.ordem) as SortOrder;
  return {
    pais: parseCountry(first(params.pais), validCountries),
    streamings: parseIds(first(params.streaming)),
    generos: parseIds(first(params.genero)),
    ordem: SORT_ORDERS.includes(ordem) ? ordem : DEFAULT_ORDER,
    q: first(params.q).trim(),
  };
}

export function filtersToSearchParams(f: Filters, extra?: { pagina?: number }): URLSearchParams {
  const params = new URLSearchParams();
  if (f.pais !== DEFAULT_COUNTRY) params.set("pais", f.pais);
  if (f.streamings.length) params.set("streaming", f.streamings.join(","));
  if (f.generos.length) params.set("genero", f.generos.join(","));
  if (f.ordem !== DEFAULT_ORDER) params.set("ordem", f.ordem);
  if (f.q.trim()) params.set("q", f.q.trim());
  if (extra?.pagina) params.set("pagina", String(extra.pagina));
  return params;
}

export function withCountry(f: Filters, pais: string): Filters {
  return { ...f, pais, streamings: [] };
}

export function isSearch(f: Filters): boolean {
  return f.q.trim() !== "";
}
