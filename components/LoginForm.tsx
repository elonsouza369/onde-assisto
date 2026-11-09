"use client";

import Link from "next/link";
import { useActionState } from "react";
import { criarConta, entrar, type EstadoLogin } from "@/app/entrar/actions";

type Modo = "entrar" | "criar";
type Props = { modo: Modo; voltar: string; filme: string; marcar: string };

const ABAS: { modo: Modo; rotulo: string }[] = [
  { modo: "entrar", rotulo: "Entrar" },
  { modo: "criar", rotulo: "Criar conta" },
];

const CAMPO =
  "w-full rounded-sm border border-white/25 bg-surface-2/70 px-4 py-3 text-base transition-colors placeholder:text-white/40 hover:border-white/50 focus:border-white focus:outline-none";

export function LoginForm({ modo, voltar, filme, marcar }: Props) {
  const [estado, acao, enviando] = useActionState<EstadoLogin, FormData>(modo === "criar" ? criarConta : entrar, {});
  const rotulo = modo === "criar" ? "Criar conta" : "Entrar";

  function hrefDa(aba: Modo) {
    const params = new URLSearchParams();
    if (aba === "criar") params.set("modo", "criar");
    Object.entries({ voltar, filme, marcar }).forEach(([k, v]) => v && params.set(k, v));
    return `/entrar?${params}`;
  }

  return (
    <div className="flex flex-col gap-8">
      <nav className="flex gap-6 border-b border-white/15">
        {ABAS.map((aba) => {
          const atual = aba.modo === modo;
          return (
            <Link
              key={aba.modo}
              href={hrefDa(aba.modo)}
              aria-current={atual ? "page" : undefined}
              className={`-mb-px border-b-2 pb-3 text-base font-semibold transition-colors ${
                atual ? "border-accent text-white" : "border-transparent text-muted hover:text-white"
              }`}
            >
              {aba.rotulo}
            </Link>
          );
        })}
      </nav>

      <form action={acao} className="flex flex-col gap-4">
        <input type="hidden" name="voltar" value={voltar} />
        <input type="hidden" name="filme" value={filme} />
        <input type="hidden" name="marcar" value={marcar} />
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-white/85">
          E-mail
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={estado.email}
            key={estado.email}
            className={CAMPO}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-white/85">
          Senha
          <input
            name="senha"
            type="password"
            required
            minLength={6}
            autoComplete={modo === "criar" ? "new-password" : "current-password"}
            className={CAMPO}
          />
        </label>
        {estado.erro && (
          <p role="alert" className="rounded-sm border-l-4 border-accent bg-accent/15 px-4 py-3 text-sm text-white">
            {estado.erro}
          </p>
        )}
        <button
          type="submit"
          disabled={enviando}
          className="mt-2 rounded-sm bg-accent py-3 text-base font-bold transition-[filter] hover:brightness-110 disabled:opacity-60"
        >
          {rotulo}
        </button>
      </form>
    </div>
  );
}
