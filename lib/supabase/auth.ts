import "server-only";
import { cache } from "react";
import { createSupabase } from "./server";

export type Usuario = { id: string; email: string };

/** Usuário logado nesta requisição. getUser() valida a sessão no servidor do Supabase. */
export const getUsuario = cache(async (): Promise<Usuario | null> => {
  const supabase = await createSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? "" };
  } catch {
    return null;
  }
});
