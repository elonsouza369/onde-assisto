export const ERRO_CONEXAO = "Não foi possível conectar agora. Tente de novo em instantes.";
export const ERRO_EMAIL = "Digite um e-mail válido.";
export const ERRO_SENHA = "A senha precisa ter pelo menos 6 caracteres.";

const MENSAGENS: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  user_already_exists: "Já existe uma conta com esse e-mail. Entre com sua senha.",
  email_exists: "Já existe uma conta com esse e-mail. Entre com sua senha.",
  weak_password: ERRO_SENHA,
  email_address_invalid: ERRO_EMAIL,
};

/** Traduz o código de erro do Supabase Auth para a mensagem mostrada no formulário. */
export function mensagemDeErro(error: { code?: string } | null | undefined): string {
  return (error?.code && MENSAGENS[error.code]) || ERRO_CONEXAO;
}
