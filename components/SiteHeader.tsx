"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { sair } from "@/app/entrar/actions";
import { DEFAULT_COUNTRY } from "@/lib/filters";
import { ABAS, parseAba, type Aba } from "@/lib/marcas";

type Props = { usuario: { email: string } | null };

const LINKS: { aba: Aba | null; rotulo: string }[] = [
  { aba: null, rotulo: "Catálogo" },
  ...(Object.keys(ABAS) as Aba[]).map((aba) => ({ aba, rotulo: ABAS[aba].titulo })),
];

function hrefDa(aba: Aba | null, pais: string | null): string {
  const params = new URLSearchParams();
  if (aba) params.set("aba", aba);
  if (pais && pais !== DEFAULT_COUNTRY) params.set("pais", pais);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function Abas({ atual, pais, className }: { atual: Aba | null | undefined; pais: string | null; className: string }) {
  return (
    <nav aria-label="Seções" className={className}>
      {LINKS.map(({ aba, rotulo }) => {
        const ativa = atual === aba;
        return (
          <Link
            key={rotulo}
            href={hrefDa(aba, pais)}
            aria-current={ativa ? "page" : undefined}
            className={`shrink-0 text-sm transition-colors ${ativa ? "font-bold text-white" : "text-white/70 hover:text-white/90"}`}
          >
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

// Abas e conta dependem do endereço; ficam num Suspense para páginas estáticas (ex.: 404) poderem ser geradas.
function Navegacao({ usuario }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const pais = searchParams.get("pais");
  // undefined: fora da página inicial, nenhuma aba fica ativa.
  const abaAtual = pathname === "/" ? parseAba(searchParams.get("aba") ?? undefined) : undefined;

  return (
    <>
      {usuario && (
        <Abas
          atual={abaAtual}
          pais={pais}
          className="order-last -mb-1 flex w-full gap-5 overflow-x-auto pt-3 md:order-none md:mb-0 md:w-auto md:pt-0"
        />
      )}
      <div className="ml-auto">
        {usuario ? (
          <details className="group relative">
            <summary
              aria-label="Sua conta"
              className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-sm bg-accent text-base font-bold uppercase [&::-webkit-details-marker]:hidden"
            >
              {usuario.email.charAt(0).toUpperCase()}
            </summary>
            <div className="absolute right-0 mt-3 w-60 rounded-sm border border-white/15 bg-black/95 p-4 text-sm shadow-2xl">
              <p className="truncate text-muted">{usuario.email}</p>
              <form action={sair} className="mt-3 border-t border-white/15 pt-3">
                <button type="submit" className="w-full text-left font-semibold hover:underline">
                  Sair
                </button>
              </form>
            </div>
          </details>
        ) : (
          pathname !== "/entrar" && (
            <Link
              href={`/entrar?voltar=${encodeURIComponent(query ? `${pathname}?${query}` : pathname)}`}
              className="rounded-sm bg-accent px-4 py-1.5 text-sm font-bold transition-[filter] hover:brightness-110"
            >
              Entrar
            </Link>
          )
        )}
      </div>
    </>
  );
}

export function SiteHeader({ usuario }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 px-4 transition-colors duration-500 sm:px-12 ${
        scrolled ? "bg-black" : "bg-linear-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-8 py-4">
        <Link
          href="/"
          aria-label="Onde Assisto"
          className="font-display text-3xl leading-none tracking-wide text-accent sm:text-4xl"
        >
          ONDE ASSISTO
        </Link>
        <Suspense fallback={null}>
          <Navegacao usuario={usuario} />
        </Suspense>
      </div>
    </header>
  );
}
