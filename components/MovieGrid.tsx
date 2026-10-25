"use client";

import { useState } from "react";
import { filtersToSearchParams, type Filters } from "@/lib/filters";
import type { Movie, MoviePage } from "@/lib/tmdb/types";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { MovieCard } from "./MovieCard";

export const GRID_CLASSES =
  "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

function mergeUnique(current: Movie[], next: Movie[]): Movie[] {
  const seen = new Set(current.map((m) => m.id));
  return [...current, ...next.filter((m) => !seen.has(m.id))];
}

export function MovieGrid({ initial, filters }: { initial: MoviePage; filters: Filters }) {
  const [movies, setMovies] = useState(initial.movies);
  const [page, setPage] = useState(initial.page);
  const [totalPages, setTotalPages] = useState(initial.totalPages);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function loadMore() {
    setLoading(true);
    setFailed(false);
    try {
      const params = filtersToSearchParams(filters, { pagina: page + 1 });
      const response = await fetch(`/api/movies?${params}`);
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

  if (initial.movies.length === 0 && initial.page >= initial.totalPages) return <EmptyState pais={filters.pais} />;

  return (
    <div>
      <div className={GRID_CLASSES}>
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} pais={filters.pais} />
        ))}
      </div>
      {failed ? (
        <ErrorState onRetry={loadMore} />
      ) : (
        page < totalPages && (
          <div className="flex justify-center py-8">
            <button
              type="button"
              onClick={loadMore}
              disabled={loading}
              className="rounded bg-surface-2 px-6 py-2 font-semibold hover:bg-accent disabled:opacity-60"
            >
              {loading ? "Carregando..." : "Carregar mais"}
            </button>
          </div>
        )
      )}
    </div>
  );
}
