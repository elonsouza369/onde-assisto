import Link from "next/link";
import { DEFAULT_COUNTRY } from "@/lib/filters";

export function EmptyState({ pais }: { pais: string }) {
  const href = pais === DEFAULT_COUNTRY ? "/" : `/?pais=${pais}`;
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-lg text-white/80">Nenhum filme encontrado com esses filtros.</p>
      <Link href={href} className="rounded-sm bg-white px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-white/80">
        Limpar filtros
      </Link>
    </div>
  );
}
