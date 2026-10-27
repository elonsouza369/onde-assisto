import { RATING_MINS, type RatingMin } from "@/lib/filters";

type Props = { value: RatingMin | null; onChange: (value: RatingMin | null) => void };

export function RatingFilter({ value, onChange }: Props) {
  return (
    <div role="group" aria-label="Nota mínima" className="flex items-center gap-2">
      <span aria-hidden="true" className="text-sm text-muted">
        Nota
      </span>
      {RATING_MINS.map((n) => {
        const active = value === n;
        return (
          <button
            key={n}
            type="button"
            aria-label={`Nota ${n} ou mais`}
            aria-pressed={active}
            onClick={() => onChange(active ? null : n)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-bold tabular-nums transition-colors ${
              active
                ? "border-match bg-match text-black"
                : "border-white/25 text-white/75 hover:border-match/70 hover:text-match"
            }`}
          >
            {n}+
          </button>
        );
      })}
    </div>
  );
}
