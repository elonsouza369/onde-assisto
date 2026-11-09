"use client";

import { useState, type ReactNode } from "react";
import type { Marca } from "@/lib/marcas";
import type { Movie, MoviePage } from "@/lib/tmdb/types";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { MovieCard } from "./MovieCard";

export const GRID_CLASSES =
  "grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7";

function mergeUnique(current: Movie[], next: Movie[]): Movie[] {
  const seen = new Set(current.map((m) => m.id));
  return [...current, ...next.filter((m) => !seen.has(m.id))];
}

type Props = {
  initial: MoviePage;
  /** URL do "Carregar mais"; a página é acrescentada como `pagina=N`. */
  endpoint: string;
  pais: string;
  marcas: Record<number, Marca>;
  empty?: ReactNode;
};

export function MovieGrid({ initial, endpoint, pais, marcas, empty }: Props) {
  const [movies, setMovies] = useState(initial.movies);
  const [page, setPage] = useState(initial.page);
  const [totalPages, setTotalPages] = useState(initial.totalPages);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function loadMore() {
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch(`${endpoint}${endpoint.includes("?") ? "&" : "?"}pagina=${page + 1}`);
      if (!response.ok) throw new Error(`status ${response.status}`);
      const next: MoviePage = await response.json();
      setMovies((current) => mergeUnique(current, next.movies));
      setPage(next.page);
      setTotalPages(next.totalPages);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  if (initial.movies.length === 0 && initial.page >= initial.totalPages) return empty ?? <EmptyState pais={pais} />;

  return (
    <div>
      <div className={GRID_CLASSES}>
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} pais={pais} marca={marcas[movie.id]} />
        ))}
      </div>
      {failed ? (
        <ErrorState onRetry={loadMore} />
      ) : (
        page < totalPages && (
          <div className="flex justify-center pt-12">
            <button
              type="button"
              onClick={loadMore}
              disabled={loading}
              className="rounded-sm border border-white/30 px-8 py-2.5 font-semibold transition-colors hover:border-white hover:bg-white hover:text-black disabled:opacity-60"
            >
              {loading ? "Carregando..." : "Carregar mais"}
            </button>
          </div>
        )
      )}
    </div>
  );
}
