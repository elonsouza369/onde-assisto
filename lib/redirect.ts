const ORIGEM_INTERNA = "http://interno.invalid";

/**
 * Só aceita caminhos deste site; qualquer outra coisa (outro domínio, esquema, vazio) vira "/".
 * Recusa caracteres de controle e "\" porque o parser de URL do navegador os descarta ou trata
 * como "/": "/\t/evil.com" viraria "//evil.com". A conferência final é feita com o próprio parser.
 */
export function caminhoSeguro(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || /[\x00-\x1f\x7f\\]/.test(value)) return "/";
  const url = new URL(value, ORIGEM_INTERNA);
  return url.origin === ORIGEM_INTERNA ? url.pathname + url.search + url.hash : "/";
}
