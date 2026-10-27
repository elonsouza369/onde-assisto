export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-lg text-white/80">Não foi possível carregar os filmes</p>
      <button type="button" onClick={onRetry} className="rounded-sm bg-white px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-white/80">
        Tentar de novo
      </button>
    </div>
  );
}
