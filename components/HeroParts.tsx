import Image from "next/image";

export function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}min`;
}

/** Nota do TMDB (0–10) mostrada como porcentagem, no espírito do "97% Match". */
export function approval(rating: number): string {
  return `${Math.round(rating * 10)}%`;
}

export function HeroBackdrop({ src }: { src: string | null }) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {src ? (
        <Image src={src} alt="" fill priority sizes="100vw" className="animate-backdrop-in object-cover object-top" />
      ) : (
        <div className="h-full w-full bg-linear-to-br from-surface-2 via-surface to-black" />
      )}
      <div className="absolute inset-0 bg-linear-to-r from-black via-black/70 to-transparent md:via-black/40" />
      <div className="absolute inset-0 bg-linear-to-t from-black via-black/10 to-black/30" />
    </div>
  );
}

export function HeroTitle({ title, as: Tag = "h1" }: { title: string; as?: "h1" | "h2" }) {
  return (
    <Tag className="animate-title-in font-display text-[clamp(2.75rem,6.5vw,6rem)] leading-[0.88] tracking-[0.04em] text-balance uppercase">
      {title}
      <svg
        aria-hidden="true"
        viewBox="0 0 10 12"
        className="ml-[0.2em] inline-block h-[0.5em] w-auto -translate-y-[0.12em] fill-accent align-middle"
      >
        <path d="M0 0 10 6 0 12Z" />
      </svg>
    </Tag>
  );
}

type MetaProps = { rating: number; year: number | null; runtime?: number | null };

export function MovieMeta({ rating, year, runtime }: MetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-base sm:text-lg">
      {rating > 0 && <span className="font-bold text-match">{approval(rating)} aprovação</span>}
      {year && <span className="text-white/85">{year}</span>}
      {runtime ? (
        <span className="rounded-sm bg-white/20 px-2 py-0.5 text-sm font-semibold text-white/90">
          {formatRuntime(runtime)}
        </span>
      ) : null}
    </div>
  );
}

export function PlayIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`fill-current ${className}`}>
      <path d="M6 4v16l14-8z" />
    </svg>
  );
}
