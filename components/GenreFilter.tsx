import type { Genre } from "@/lib/tmdb/types";
import { toggle } from "./ProviderFilter";

type Props = { genres: Genre[]; selected: number[]; onChange: (ids: number[]) => void };

export function GenreFilter({ genres, selected, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {genres.map((g) => {
        const active = selected.includes(g.id);
        return (
          <button
            key={g.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(toggle(selected, g.id))}
            className={`shrink-0 rounded-full px-3 py-1 text-sm ${
              active ? "bg-accent text-white" : "bg-surface-2 text-neutral-300 hover:text-white"
            }`}
          >
            {g.name}
          </button>
        );
      })}
    </div>
  );
}
