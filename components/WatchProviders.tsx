import Image from "next/image";
import type { Provider } from "@/lib/tmdb/types";

type Props = { providers: Provider[]; watchLink: string | null; countryName: string };

export function WatchProviders({ providers, watchLink, countryName }: Props) {
  return (
    <section className="rounded-lg bg-surface p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Onde assistir · {countryName}</h2>
      {providers.length === 0 ? (
        <p className="mt-3 text-neutral-300">Não disponível em streaming em {countryName} no momento</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-4">
          {providers.map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              {p.logoUrl && <Image src={p.logoUrl} alt="" width={48} height={48} className="h-12 w-12 rounded-lg" />}
              <span className="text-sm">{p.name}</span>
            </li>
          ))}
        </ul>
      )}
      {watchLink && providers.length > 0 && (
        <a
          href={watchLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm text-neutral-400 underline hover:text-white"
        >
          Ver no JustWatch
        </a>
      )}
    </section>
  );
}
