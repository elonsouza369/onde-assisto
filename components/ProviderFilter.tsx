import Image from "next/image";
import type { Provider } from "@/lib/tmdb/types";

type Props = { providers: Provider[]; selected: number[]; onChange: (ids: number[]) => void };

export function toggle(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

export function ProviderFilter({ providers, selected, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {providers.map((p) => {
        const active = selected.includes(p.id);
        return (
          <button
            key={p.id}
            type="button"
            aria-label={p.name}
            aria-pressed={active}
            title={p.name}
            onClick={() => onChange(toggle(selected, p.id))}
            className={`shrink-0 overflow-hidden rounded-lg border-2 ${
              active ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            {p.logoUrl ? (
              <Image src={p.logoUrl} alt="" width={44} height={44} />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center bg-surface-2 text-[10px]">{p.name}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
