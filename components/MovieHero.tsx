import Image from "next/image";
import type { MovieDetails } from "@/lib/tmdb/types";
import { TrailerModal } from "./TrailerModal";

function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}min`;
}

export function MovieHero({ movie }: { movie: MovieDetails }) {
  const meta = [movie.year, movie.runtime ? formatRuntime(movie.runtime) : null].filter(Boolean).join(" · ");

  return (
    <div>
      <div className="relative h-[40vh] w-full overflow-hidden md:h-[60vh]">
        {movie.backdropUrl ? (
          <Image src={movie.backdropUrl} alt="" fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-surface-2 to-bg" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/40 to-bg" />
      </div>

      <div className="relative -mt-32 flex gap-4 px-4 sm:gap-6 sm:px-8 md:-mt-48">
        <div className="relative aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-lg bg-surface-2 shadow-2xl sm:w-44">
          {movie.posterUrl && <Image src={movie.posterUrl} alt={movie.title} fill sizes="176px" className="object-cover" />}
        </div>
        <div className="flex flex-col justify-end gap-1 pb-2">
          <h1 className="text-2xl font-extrabold sm:text-4xl">{movie.title}</h1>
          {meta && <p className="text-neutral-300">{meta}</p>}
          {movie.rating > 0 && <p className="font-bold text-rating">★ {movie.rating.toFixed(1)}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-6 sm:px-8">
        {movie.genres.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {movie.genres.map((g) => (
              <li key={g.id} className="rounded-full bg-surface-2 px-3 py-1 text-sm text-neutral-300">
                {g.name}
              </li>
            ))}
          </ul>
        )}
        {movie.overview && <p className="max-w-3xl leading-relaxed text-neutral-300">{movie.overview}</p>}
        {movie.trailerKey && (
          <div>
            <TrailerModal trailerKey={movie.trailerKey} />
          </div>
        )}
      </div>
    </div>
  );
}
