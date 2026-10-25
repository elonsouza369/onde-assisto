export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-neutral-300">Não foi possível carregar os filmes</p>
      <button type="button" onClick={onRetry} className="rounded bg-accent px-4 py-2 text-sm font-semibold">
        Tentar de novo
      </button>
    </div>
  );
}
