import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkButtons } from "@/components/MarkButtons";
import { MovieHero } from "@/components/MovieHero";
import { WatchProviders } from "@/components/WatchProviders";
import { DEFAULT_COUNTRY, parseFilters } from "@/lib/filters";
import { getMarcas } from "@/lib/listas";
import { getMovieDetails, getRegions, TmdbNotFoundError } from "@/lib/tmdb";

type Props = PageProps<"/filme/[id]">;

function parseId(id: string): number {
  if (!/^\d+$/.test(id)) notFound();
  return Number(id);
}

async function load(id: number, pais: string) {
  try {
    return await getMovieDetails(id, pais);
  } catch (error) {
    if (error instanceof TmdbNotFoundError) notFound();
    throw error;
  }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const { pais } = parseFilters(await searchParams);
  const movie = await load(parseId(id), pais);
  return { title: `${movie.title} · Onde Assisto`, description: movie.overview || undefined };
}

export default async function MoviePage({ params, searchParams }: Props) {
  const { id } = await params;
  const regions = await getRegions();
  const { pais } = parseFilters(
    await searchParams,
    regions.map((r) => r.code),
  );
  const [movie, marcas] = await Promise.all([load(parseId(id), pais), getMarcas()]);
  const countryName = regions.find((r) => r.code === pais)?.name ?? pais;

  return (
    <main className="flex-1">
      <MovieHero movie={movie} acoes={<MarkButtons filmeId={movie.id} marca={marcas[movie.id] ?? null} />} />
      <div className="flex flex-col gap-10 px-4 pt-4 sm:px-12">
        <WatchProviders providers={movie.providers} watchLink={movie.watchLink} countryName={countryName} />
        <Link
          href={pais === DEFAULT_COUNTRY ? "/" : `/?pais=${pais}`}
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted hover:text-white"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
            <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Voltar ao catálogo
        </Link>
      </div>
    </main>
  );
}
