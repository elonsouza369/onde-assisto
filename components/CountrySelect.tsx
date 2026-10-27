"use client";

import { withCountry, type Filters } from "@/lib/filters";
import type { Region } from "@/lib/tmdb/types";
import { useFilterNavigation } from "@/lib/useFilterNavigation";

export function CountrySelect({ filters, regions }: { filters: Filters; regions: Region[] }) {
  const navigate = useFilterNavigation();
  return (
    <select
      aria-label="País"
      value={filters.pais}
      onChange={(e) => navigate(withCountry(filters, e.target.value))}
      className="w-36 shrink-0 sm:w-56 rounded-sm border border-white/25 bg-black/60 px-3 py-2.5 text-sm backdrop-blur-md transition-colors hover:border-white/50 focus:border-white focus:outline-none"
    >
      {regions.map((r) => (
        <option key={r.code} value={r.code}>
          {r.name}
        </option>
      ))}
    </select>
  );
}
