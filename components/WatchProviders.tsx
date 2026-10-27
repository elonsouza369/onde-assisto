import Image from "next/image";
import type { Provider } from "@/lib/tmdb/types";

type Props = { providers: Provider[]; watchLink: string | null; countryName: string };

export function WatchProviders({ providers, watchLink, countryName }: Props) {
  return (
    <section>
      <h2 className="text-xl font-bold sm:text-2xl">Onde assistir · {countryName}</h2>
      {providers.length === 0 ? (
        <p className="mt-3 text-muted">Não disponível em streaming em {countryName} no momento</p>
      ) : (
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-5">
          {providers.map((p) => (
            <li key={p.id} className="flex w-24 flex-col items-center gap-2 text-center">
              {p.logoUrl ? (
                <Image
                  src={p.logoUrl}
                  alt=""
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-md shadow-[0_8px_30px_rgba(0,0,0,0.7)]"
                />
              ) : (
                <span className="h-20 w-20 rounded-md bg-surface-2" />
              )}
              <span className="text-sm leading-tight text-white/85">{p.name}</span>
            </li>
          ))}
        </ul>
      )}
      {watchLink && providers.length > 0 && (
        <a
          href={watchLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-sm text-muted underline underline-offset-4 hover:text-white"
        >
          Ver no JustWatch
        </a>
      )}
    </section>
  );
}
