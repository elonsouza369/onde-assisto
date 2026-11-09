import "server-only";
import type { Marca } from "./marcas";
import { getUsuario } from "./supabase/auth";
import { createSupabase } from "./supabase/server";
import { getMovieDetails } from "./tmdb";
import type { Movie, MovieDetails, MoviePage } from "./tmdb/types";

export const LISTA_POR_PAGINA = 24;
const TABELA = "lista_filmes";
const ERRO_SALVAR = "Não foi possível salvar. Tente de novo.";

export type ListaPage = MoviePage & { total: number };

/** Marcações do usuário logado, para selos e botões. Sem login ou em falha: nenhuma. */
export async function getMarcas(): Promise<Record<number, Marca>> {
  if (!(await getUsuario())) return {};
  const supabase = await createSupabase();
  if (!supabase) return {};
  const { data, error } = await supabase.from(TABELA).select("filme_id, status");
  if (error || !data) return {};
  return Object.fromEntries(data.map((row) => [row.filme_id, row.status]));
}

function toMovie(d: MovieDetails): Movie {
  return {
    id: d.id,
    title: d.title,
    year: d.year,
    posterUrl: d.posterUrl,
    rating: d.rating,
    genreIds: d.genres.map((g) => g.id),
    providers: d.providers,
  };
}

/** Uma página da lista, mais recentes primeiro. Filmes que falharem no TMDB são pulados. */
export async function getLista(marca: Marca, pagina: number, pais: string): Promise<ListaPage> {
  const supabase = await createSupabase();
  if (!supabase) throw new Error("Supabase não configurado");
  const inicio = (pagina - 1) * LISTA_POR_PAGINA;
  const { data, error, count } = await supabase
    .from(TABELA)
    .select("filme_id", { count: "exact" })
    .eq("status", marca)
    .order("atualizado_em", { ascending: false })
    .range(inicio, inicio + LISTA_POR_PAGINA - 1);
  if (error || !data) throw new Error("Não foi possível ler a lista");

  const detalhes = await Promise.allSettled(data.map((row) => getMovieDetails(row.filme_id, pais)));
  const movies = detalhes.flatMap((r) => (r.status === "fulfilled" ? [toMovie(r.value)] : []));
  const total = count ?? 0;
  return { movies, page: pagina, totalPages: Math.max(1, Math.ceil(total / LISTA_POR_PAGINA)), total };
}

/** Marca, troca ou (com null) desmarca um filme do usuário logado. */
export async function salvarMarca(filmeId: number, marca: Marca | null): Promise<{ erro: string } | null> {
  const supabase = await createSupabase();
  if (!supabase) return { erro: ERRO_SALVAR };
  const { error } = marca
    ? await supabase
        .from(TABELA)
        .upsert(
          { filme_id: filmeId, status: marca, atualizado_em: new Date().toISOString() },
          { onConflict: "user_id,filme_id" },
        )
    : await supabase.from(TABELA).delete().eq("filme_id", filmeId);
  return error ? { erro: ERRO_SALVAR } : null;
}
