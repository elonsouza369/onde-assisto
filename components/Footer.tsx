/* eslint-disable @next/next/no-img-element */
export function Footer() {
  return (
    <footer className="mt-20 overflow-hidden px-4 pb-8 pt-12 text-sm text-muted sm:px-12">
      <div className="flex flex-col-reverse gap-10 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4">
          <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="w-fit">
            <img src="/tmdb-logo.svg" alt="TMDB" width={120} height={16} />
          </a>
          <div className="max-w-[48ch] leading-relaxed">
            <p>Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.</p>
            <p>Dados de disponibilidade: JustWatch.</p>
          </div>
        </div>
        <p
          aria-hidden="true"
          className="font-display text-[clamp(4.5rem,13vw,11rem)] leading-[0.78] tracking-[0.02em] text-accent select-none"
        >
          ONDE ASSISTO
        </p>
      </div>
    </footer>
  );
}
