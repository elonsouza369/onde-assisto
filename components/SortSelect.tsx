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
      className="rounded bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
