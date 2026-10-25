"use client";

import { useRouter } from "next/navigation";
import { filtersToSearchParams, type Filters } from "./filters";

export function useFilterNavigation(): (next: Filters) => void {
  const router = useRouter();
  return (next) => {
    const params = filtersToSearchParams(next).toString();
    router.push(params ? `/?${params}` : "/", { scroll: false });
  };
}
