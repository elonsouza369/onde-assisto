import Image from "next/image";
import type { Provider } from "@/lib/tmdb/types";

type Props = { providers: Provider[]; selected: number[]; onChange: (ids: number[]) => void };

export function toggle(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

export function ProviderFilter({ providers, selected, onChange }: Props) {
  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 py-1.5">
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
            className={`shrink-0 overflow-hidden rounded-md transition duration-200 ${
              active
                ? "ring-[3px] ring-white ring-offset-2 ring-offset-black"
                : "opacity-55 grayscale-[35%] hover:opacity-100 hover:grayscale-0"
            }`}
          >
            {p.logoUrl ? (
              <Image src={p.logoUrl} alt="" width={48} height={48} className="h-12 w-12" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center bg-surface-2 text-[10px] leading-tight">{p.name}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
