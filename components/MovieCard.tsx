import Image from "next/image";
import Link from "next/link";
import type { Movie } from "@/lib/tmdb/types";

export function MovieCard({ movie, pais }: { movie: Movie; pais: string }) {
  return (
    <Link href={`/filme/${movie.id}?pais=${pais}`} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-surface-2">
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            sizes="(min-width: 1280px) 16vw, (min-width: 768px) 25vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-sm text-neutral-500">
            {movie.title}
          </div>
        )}
        {movie.rating > 0 && (
          <span className="absolute left-2 top-2 rounded bg-black/75 px-1.5 py-0.5 text-xs font-semibold text-rating">
            ★ {movie.rating.toFixed(1)}
          </span>
        )}
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-semibold">{movie.title}</h3>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-xs text-neutral-400">{movie.year ?? ""}</span>
        <span className="flex gap-1">
          {movie.providers.slice(0, 3).map((p) =>
            p.logoUrl ? (
              <Image key={p.id} src={p.logoUrl} alt={p.name} title={p.name} width={20} height={20} className="h-5 w-5 rounded" />
            ) : null,
          )}
        </span>
      </div>
    </Link>
  );
}
