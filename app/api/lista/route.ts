import { parseFilters } from "@/lib/filters";
import { getLista } from "@/lib/listas";
import { ABAS, parseAba } from "@/lib/marcas";
import { getUsuario } from "@/lib/supabase/auth";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const aba = parseAba(searchParams.get("aba") ?? undefined);
  const pagina = searchParams.get("pagina") ?? "";
  if (!aba || !/^\d+$/.test(pagina) || Number(pagina) < 1) {
    return Response.json({ error: "parâmetros inválidos" }, { status: 400 });
  }
  if (!(await getUsuario())) return Response.json({ error: "faça login" }, { status: 401 });

  try {
    const { pais } = parseFilters(Object.fromEntries(searchParams));
    return Response.json(await getLista(ABAS[aba].marca, Number(pagina), pais));
  } catch {
    return Response.json({ error: "Não foi possível carregar a lista" }, { status: 502 });
  }
}
