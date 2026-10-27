import type { SortOrder } from "@/lib/filters";

const OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "popularidade", label: "Mais populares" },
  { value: "nota", label: "Mais bem avaliados" },
  { value: "lancamento", label: "Lançamentos mais recentes" },
  { value: "titulo", label: "Título A–Z" },
];

type Props = { value: SortOrder; disabled: boolean; onChange: (value: SortOrder) => void };

export function SortSelect({ value, disabled, onChange }: Props) {
  return (
    <select
      aria-label="Ordenar por"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as SortOrder)}
      className="rounded-sm border border-white/25 bg-black/60 px-3 py-2.5 text-sm backdrop-blur-md transition-colors hover:border-white/50 focus:border-white focus:outline-none disabled:opacity-40"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
