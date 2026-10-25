import Link from "next/link";
import { DEFAULT_COUNTRY } from "@/lib/filters";

export function EmptyState({ pais }: { pais: string }) {
  const href = pais === DEFAULT_COUNTRY ? "/" : `/?pais=${pais}`;
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-neutral-300">Nenhum filme encontrado com esses filtros.</p>
      <Link href={href} className="rounded bg-accent px-4 py-2 text-sm font-semibold">
        Limpar filtros
      </Link>
    </div>
  );
}
