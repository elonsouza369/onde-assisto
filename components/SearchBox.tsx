"use client";

import { useEffect, useRef, useState } from "react";
import type { Filters } from "@/lib/filters";
import { useFilterNavigation } from "@/lib/useFilterNavigation";

const DEBOUNCE_MS = 500;

export function SearchBox({ filters }: { filters: Filters }) {
  const [value, setValue] = useState(filters.q);
  const [syncedQ, setSyncedQ] = useState(filters.q);
  const [sentQ, setSentQ] = useState(filters.q);
  // A URL só substitui o texto digitado quando muda por outro motivo (ex.: "Limpar filtros").
  if (filters.q !== syncedQ) {
    setSyncedQ(filters.q);
    if (filters.q !== sentQ) setValue(filters.q);
  }

  const navigate = useFilterNavigation();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latestFilters = useRef(filters);

  useEffect(() => {
    latestFilters.current = filters;
  }, [filters]);

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleChange(q: string) {
    setValue(q);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setSentQ(q.trim());
      navigate({ ...latestFilters.current, q });
    }, DEBOUNCE_MS);
  }

  return (
    <div className="relative min-w-0 flex-1">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="pointer-events-none absolute z-10 left-3 top-1/2 h-5 w-5 -translate-y-1/2 fill-none stroke-white/60 stroke-2"
      >
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Buscar filme..."
        aria-label="Buscar filme"
        className="w-full rounded-sm border border-white/25 bg-black/60 py-2.5 pl-10 pr-3 text-sm backdrop-blur-md transition-colors placeholder:text-white/45 hover:border-white/50 focus:border-white focus:outline-none"
      />
    </div>
  );
}
