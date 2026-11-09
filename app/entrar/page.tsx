import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getUsuario } from "@/lib/supabase/auth";

export const metadata: Metadata = { title: "Entrar · Onde Assisto" };

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  if (await getUsuario()) redirect("/");
  const params = await searchParams;
  const modo = first(params.modo) === "criar" ? "criar" : "entrar";

  return (
    <main className="flex flex-1 items-center justify-center bg-[radial-gradient(ellipse_at_top,rgba(229,9,20,0.18),transparent_60%)] px-4 pb-12 pt-32">
      <div className="w-full max-w-md rounded-md bg-black/75 p-8 shadow-[0_0_80px_rgba(0,0,0,0.8)] ring-1 ring-white/10 sm:p-12">
        <h1 className="mb-8 font-display text-5xl leading-none tracking-wide uppercase">
          {modo === "criar" ? "Criar conta" : "Entrar"}
        </h1>
        <LoginForm
          key={modo}
          modo={modo}
          voltar={first(params.voltar)}
          filme={first(params.filme)}
          marcar={first(params.marcar)}
        />
      </div>
    </main>
  );
}
