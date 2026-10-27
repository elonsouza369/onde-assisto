import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-8 pt-32 text-center">
      <h1 className="font-display text-[clamp(3rem,8vw,6rem)] leading-none tracking-wide uppercase">
        Filme não encontrado
      </h1>
      <Link href="/" className="rounded-sm bg-white px-6 py-2.5 text-sm font-bold text-black hover:bg-white/80">
        Voltar ao catálogo
      </Link>
    </main>
  );
}
