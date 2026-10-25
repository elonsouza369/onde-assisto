"use client";

import { useEffect, useRef, useState } from "react";
import type { Filters } from "@/lib/filters";
import { useFilterNavigation } from "@/lib/useFilterNavigation";

const DEBOUNCE_MS = 500;

export function SearchBox({ filters }: { filters: Filters }) {
  const [value, setValue] = useState(filters.q);
  const navigate = useFilterNavigation();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleChange(q: string) {
    setValue(q);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate({ ...filters, q }), DEBOUNCE_MS);
  }

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="Buscar filme..."
      aria-label="Buscar filme"
      className="w-full rounded bg-surface-2 px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent"
    />
  );
}
