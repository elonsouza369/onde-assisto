import type { MovieDetails } from "@/lib/tmdb/types";
import { HeroBackdrop, HeroTitle, MovieMeta } from "./HeroParts";
import { TrailerModal } from "./TrailerModal";

export function MovieHero({ movie }: { movie: MovieDetails }) {
  return (
    <section className="relative isolate flex min-h-[78svh] items-end md:min-h-[92svh]">
      <HeroBackdrop src={movie.backdropUrl} />
      <div className="flex w-full max-w-3xl flex-col gap-5 px-4 pb-10 pt-36 sm:px-12 md:pb-20">
        <HeroTitle title={movie.title} />
        <MovieMeta rating={movie.rating} year={movie.year} runtime={movie.runtime} />
        {movie.genres.length > 0 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/70">
            {movie.genres.map((g, i) => (
              <li key={g.id} className={i > 0 ? "before:mr-4 before:inline-block before:h-1 before:w-1 before:-translate-y-0.5 before:rounded-full before:bg-accent" : ""}>
                {g.name}
              </li>
            ))}
          </ul>
        )}
        {movie.overview && (
          <p className="max-w-[58ch] text-base leading-relaxed text-white/85 sm:text-lg">{movie.overview}</p>
        )}
        {movie.trailerKey && (
          <div className="pt-2">
            <TrailerModal trailerKey={movie.trailerKey} />
          </div>
        )}
      </div>
    </section>
  );
}
