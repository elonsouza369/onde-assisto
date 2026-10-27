import Image from "next/image";
import Link from "next/link";
import type { MovieDetails } from "@/lib/tmdb/types";
import { HeroBackdrop, HeroTitle, MovieMeta } from "./HeroParts";
import { TrailerModal } from "./TrailerModal";

export function FeaturedHero({ movie, pais }: { movie: MovieDetails; pais: string }) {
  const providers = movie.providers.slice(0, 3);

  return (
    <section className="relative isolate flex min-h-[82svh] items-end md:min-h-[95svh]">
      <HeroBackdrop src={movie.backdropUrl} />
      <div className="flex w-full max-w-3xl flex-col gap-5 px-4 pb-36 pt-36 sm:px-12 md:pb-48">
        {providers.length > 0 && (
          <div className="flex items-center gap-2.5 text-sm font-semibold text-white/90">
            {providers.map((p) =>
              p.logoUrl ? (
                <Image key={p.id} src={p.logoUrl} alt="" width={28} height={28} className="h-7 w-7 rounded-sm" />
              ) : null,
            )}
            <span>Disponível agora em {providers.map((p) => p.name).join(", ")}</span>
          </div>
        )}
        <HeroTitle title={movie.title} as="h2" />
        <MovieMeta rating={movie.rating} year={movie.year} runtime={movie.runtime} />
        {movie.overview && (
          <p className="line-clamp-3 max-w-[54ch] text-base leading-relaxed text-white/85 sm:text-lg">
            {movie.overview}
          </p>
        )}
        <div className="flex flex-wrap gap-3 pt-2">
          {movie.trailerKey && <TrailerModal trailerKey={movie.trailerKey} />}
          <Link
            href={`/filme/${movie.id}?pais=${pais}`}
            className="inline-flex items-center gap-2.5 rounded-sm bg-white/25 px-6 py-2.5 text-lg font-bold backdrop-blur-sm transition-colors hover:bg-white/35"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2">
              <circle cx="12" cy="12" r="9.5" />
              <path d="M12 11v6M12 7.5v.01" strokeLinecap="round" />
            </svg>
            Mais informações
          </Link>
        </div>
      </div>
    </section>
  );
}
