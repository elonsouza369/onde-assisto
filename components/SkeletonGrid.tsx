import { GRID_CLASSES } from "./MovieGrid";

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className={GRID_CLASSES} aria-busy="true" aria-label="Carregando filmes">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] rounded-md bg-surface-2" />
          <div className="mt-2 h-4 w-3/4 rounded bg-surface-2" />
          <div className="mt-1 h-3 w-1/3 rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}
