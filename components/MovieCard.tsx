import Image from "next/image";
import Link from "next/link";
import type { Movie } from "@/lib/tmdb/types";
import { formatRating } from "./HeroParts";

export function MovieCard({ movie, pais }: { movie: Movie; pais: string }) {
  return (
    <Link href={`/filme/${movie.id}?pais=${pais}`} className="group block focus-visible:outline-none">
      <div className="relative aspect-[2/3] overflow-hidden rounded-sm bg-surface ring-white transition duration-300 ease-out group-hover:scale-[1.03] group-hover:ring-[3px] group-focus-visible:scale-[1.03] group-focus-visible:ring-[3px]">
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            sizes="(min-width: 1536px) 14vw, (min-width: 1280px) 16vw, (min-width: 768px) 25vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-linear-to-b from-surface-2 to-surface p-4 text-center font-display text-2xl leading-none tracking-wide text-white/60 uppercase">
            {movie.title}
          </div>
        )}
        {movie.providers.length > 0 && (
          <span className="absolute left-1.5 top-1.5 flex gap-1">
            {movie.providers.slice(0, 3).map((p) =>
              p.logoUrl ? (
                <Image
                  key={p.id}
                  src={p.logoUrl}
                  alt={p.name}
                  title={p.name}
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-[3px] shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                />
              ) : null,
            )}
          </span>
        )}
      </div>
      <h3 className="mt-2.5 line-clamp-2 text-sm font-semibold leading-snug text-white/90 group-hover:text-white">
        {movie.title}
      </h3>
      <p className="mt-0.5 flex gap-2 text-xs text-muted">
        {movie.rating > 0 && <span className="font-bold text-match">{formatRating(movie.rating)}</span>}
        {movie.year && <span>{movie.year}</span>}
      </p>
    </Link>
  );
}
