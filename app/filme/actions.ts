"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { salvarMarca } from "@/lib/listas";
import { parseMarca, type Marca } from "@/lib/marcas";
import { caminhoSeguro } from "@/lib/redirect";
import { getUsuario } from "@/lib/supabase/auth";

const ERRO_SALVAR = { erro: "Não foi possível salvar. Tente de novo." };

export async function marcarFilme(
  filmeId: number,
  marca: Marca | null,
  voltar: string,
): Promise<{ erro: string } | undefined> {
  if (!Number.isInteger(filmeId) || filmeId <= 0 || (marca !== null && !parseMarca(marca))) return ERRO_SALVAR;

  if (!(await getUsuario())) {
    const params = new URLSearchParams({ voltar: caminhoSeguro(voltar) });
    if (marca) {
      params.set("filme", String(filmeId));
      params.set("marcar", marca);
    }
    redirect(`/entrar?${params}`);
  }

  const falha = await salvarMarca(filmeId, marca);
  if (falha) return falha;
  refresh();
}
