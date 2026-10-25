import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MovieHero } from "@/components/MovieHero";
import { WatchProviders } from "@/components/WatchProviders";
import { DEFAULT_COUNTRY, parseFilters } from "@/lib/filters";
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
  const movie = await load(parseId(id), pais);
  const countryName = regions.find((r) => r.code === pais)?.name ?? pais;

  return (
    <main className="flex-1">
      <MovieHero movie={movie} />
      <div className="flex flex-col gap-6 px-4 pt-6 sm:px-8">
        <WatchProviders providers={movie.providers} watchLink={movie.watchLink} countryName={countryName} />
        <Link href={pais === DEFAULT_COUNTRY ? "/" : `/?pais=${pais}`} className="text-sm text-neutral-400 hover:text-white">
          ← Voltar
        </Link>
      </div>
    </main>
  );
}
