"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { marcarFilme } from "@/app/filme/actions";
import type { Marca } from "@/lib/marcas";

const OPCOES: { marca: Marca; rotulo: string }[] = [
  { marca: "quero", rotulo: "+ Quero assistir" },
  { marca: "assistido", rotulo: "✓ Já assisti" },
];

export function MarkButtons({ filmeId, marca }: { filmeId: number; marca: Marca | null }) {
  const [atual, setOtimista] = useOptimistic(marca);
  const [erro, setErro] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const voltar = query ? `${pathname}?${query}` : pathname;

  function escolher(opcao: Marca) {
    const nova = atual === opcao ? null : opcao;
    setErro(null);
    startTransition(async () => {
      setOtimista(nova);
      const resultado = await marcarFilme(filmeId, nova, voltar);
      if (resultado?.erro) setErro(resultado.erro);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        {OPCOES.map(({ marca: opcao, rotulo }) => {
          const ativo = atual === opcao;
          return (
            <button
              key={opcao}
              type="button"
              aria-pressed={ativo}
              onClick={() => escolher(opcao)}
              className={`rounded-sm px-5 py-2.5 text-lg font-bold transition-colors ${
                ativo ? "bg-white text-black hover:bg-white/80" : "bg-white/25 backdrop-blur-sm hover:bg-white/35"
              }`}
            >
              {rotulo}
            </button>
          );
        })}
      </div>
      <p role="status" className="min-h-5 text-sm text-white/80">
        {erro}
      </p>
    </div>
  );
}
