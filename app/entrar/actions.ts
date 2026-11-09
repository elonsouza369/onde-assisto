"use server";

import { redirect } from "next/navigation";
import { salvarMarca } from "@/lib/listas";
import { parseMarca } from "@/lib/marcas";
import { caminhoSeguro } from "@/lib/redirect";
import { ERRO_CONEXAO, ERRO_EMAIL, ERRO_SENHA, mensagemDeErro } from "@/lib/supabase/erros";
import { createSupabase } from "@/lib/supabase/server";

export type EstadoLogin = { erro?: string; email?: string };

const SENHA_MINIMA = 6;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function campo(form: FormData, nome: string): string {
  const value = form.get(nome);
  return typeof value === "string" ? value : "";
}

async function autenticar(modo: "entrar" | "criar", form: FormData): Promise<EstadoLogin> {
  const email = campo(form, "email").trim();
  const senha = campo(form, "senha");
  if (!EMAIL.test(email)) return { erro: ERRO_EMAIL, email };
  if (senha.length < SENHA_MINIMA) return { erro: ERRO_SENHA, email };

  const supabase = await createSupabase();
  if (!supabase) return { erro: ERRO_CONEXAO, email };
  const credenciais = { email, password: senha };
  const { data, error } =
    modo === "entrar" ? await supabase.auth.signInWithPassword(credenciais) : await supabase.auth.signUp(credenciais);
  if (error) return { erro: mensagemDeErro(error), email };
  // Com "Confirm email" ligado no Supabase, o cadastro volta sem sessão.
  if (!data.session) return { erro: "Conta criada. Confirme seu e-mail para entrar.", email };

  const filme = campo(form, "filme");
  const marca = parseMarca(campo(form, "marcar"));
  if (/^\d+$/.test(filme) && Number(filme) > 0 && marca) await salvarMarca(Number(filme), marca);
  redirect(caminhoSeguro(campo(form, "voltar")));
}

export async function entrar(_estado: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  return autenticar("entrar", form);
}

export async function criarConta(_estado: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  return autenticar("criar", form);
}

export async function sair(): Promise<void> {
  const supabase = await createSupabase();
  await supabase?.auth.signOut();
  redirect("/");
}
