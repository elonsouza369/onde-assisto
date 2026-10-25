import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Filme não encontrado</h1>
      <Link href="/" className="rounded bg-accent px-4 py-2 text-sm font-semibold">
        Voltar ao catálogo
      </Link>
    </main>
  );
}
