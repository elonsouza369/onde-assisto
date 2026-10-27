import type { Genre } from "@/lib/tmdb/types";
import { toggle } from "./ProviderFilter";

type Props = { genres: Genre[]; selected: number[]; onChange: (ids: number[]) => void };

export function GenreFilter({ genres, selected, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {genres.map((g) => {
        const active = selected.includes(g.id);
        return (
          <button
            key={g.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(toggle(selected, g.id))}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "border-white bg-white text-black"
                : "border-white/25 text-white/75 hover:border-white/60 hover:text-white"
            }`}
          >
            {g.name}
          </button>
        );
      })}
    </div>
  );
}
