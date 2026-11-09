import Link from "next/link";
import { getLista, getMarcas } from "@/lib/listas";
import { ABAS, type Aba } from "@/lib/marcas";
import { MovieGrid } from "./MovieGrid";

const VAZIO: Record<Aba, string> = {
  "quero-assistir": "Nenhum filme aqui ainda. Encontre algo no catálogo e toque em + Quero assistir.",
  assistidos: "Nenhum filme aqui ainda. Quando terminar um filme, toque em ✓ Já assisti na página dele.",
};

export async function ListaView({ aba, pais }: { aba: Aba; pais: string }) {
  const { marca, titulo } = ABAS[aba];
  const [pagina, marcas] = await Promise.all([getLista(marca, 1, pais), getMarcas()]);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="flex flex-wrap items-baseline gap-x-3 font-display text-[clamp(2.5rem,5vw,4rem)] leading-none tracking-wide uppercase">
        {titulo}{" "}
        <span className="font-sans text-base font-semibold tracking-normal normal-case text-muted">
          · {pagina.total} {pagina.total === 1 ? "filme" : "filmes"}
        </span>
      </h1>
      <MovieGrid
        // Recria a grade ao trocar de aba, de país ou quando a lista muda; senão ela mostraria os filmes antigos.
        key={`${aba}-${pais}-${pagina.total}`}
        initial={pagina}
        endpoint={`/api/lista?aba=${aba}&pais=${pais}`}
        pais={pais}
        marcas={marcas}
        empty={
          <div className="flex flex-col items-start gap-5 rounded-sm border border-white/10 bg-surface px-6 py-12 sm:items-center sm:text-center">
            <p className="max-w-[46ch] text-lg text-white/80">{VAZIO[aba]}</p>
            <Link
              href="/"
              className="rounded-sm bg-white px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-white/80"
            >
              Explorar catálogo
            </Link>
          </div>
        }
      />
    </section>
  );
}
