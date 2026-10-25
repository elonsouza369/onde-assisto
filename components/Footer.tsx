/* eslint-disable @next/next/no-img-element */
export function Footer() {
  return (
    <footer className="mt-12 border-t border-surface-2 px-4 py-8 text-sm text-neutral-400 sm:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">
          <img src="/tmdb-logo.svg" alt="TMDB" width={120} height={16} />
        </a>
        <div>
          <p>Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.</p>
          <p>Dados de disponibilidade: JustWatch.</p>
        </div>
      </div>
    </footer>
  );
}
