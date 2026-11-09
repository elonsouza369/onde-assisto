import { mensagemDeErro } from "@/lib/supabase/erros";

it.each([
  ["invalid_credentials", "E-mail ou senha incorretos."],
  ["user_already_exists", "Já existe uma conta com esse e-mail. Entre com sua senha."],
  ["email_exists", "Já existe uma conta com esse e-mail. Entre com sua senha."],
  ["weak_password", "A senha precisa ter pelo menos 6 caracteres."],
  ["email_address_invalid", "Digite um e-mail válido."],
  ["unexpected_failure", "Não foi possível conectar agora. Tente de novo em instantes."],
])("mensagemDeErro(%s)", (code, mensagem) => {
  expect(mensagemDeErro({ code })).toBe(mensagem);
});

it("mensagemDeErro sem código cai na mensagem de conexão", () => {
  expect(mensagemDeErro({})).toBe("Não foi possível conectar agora. Tente de novo em instantes.");
  expect(mensagemDeErro(null)).toBe("Não foi possível conectar agora. Tente de novo em instantes.");
});
