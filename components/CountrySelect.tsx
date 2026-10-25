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
      className="rounded bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
    >
      {regions.map((r) => (
        <option key={r.code} value={r.code}>
          {r.name}
        </option>
      ))}
    </select>
  );
}
