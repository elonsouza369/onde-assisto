import { parseFilters } from "@/lib/filters";
import { MAX_PAGE, fetchCatalogPage, getRegions } from "@/lib/tmdb";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const pagina = searchParams.get("pagina") ?? "";
  if (!/^\d+$/.test(pagina) || Number(pagina) < 1 || Number(pagina) > MAX_PAGE) {
    return Response.json({ error: "pagina inválida" }, { status: 400 });
  }

  try {
    const regions = await getRegions();
    const filters = parseFilters(
      Object.fromEntries(searchParams),
      regions.map((r) => r.code),
    );
    return Response.json(await fetchCatalogPage(filters, Number(pagina)));
  } catch {
    return Response.json({ error: "Não foi possível carregar os filmes" }, { status: 502 });
  }
}
