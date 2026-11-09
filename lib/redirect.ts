/** Só aceita caminhos deste site; qualquer outra coisa (outro domínio, esquema, vazio) vira "/". */
export function caminhoSeguro(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}
