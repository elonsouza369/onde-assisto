// @vitest-environment node
import { redirect } from "next/navigation";
import { criarConta, entrar, sair } from "@/app/entrar/actions";
import { salvarMarca } from "@/lib/listas";
import { createSupabase } from "@/lib/supabase/server";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  }),
}));
vi.mock("@/lib/supabase/server", () => ({ createSupabase: vi.fn() }));
vi.mock("@/lib/listas", () => ({ salvarMarca: vi.fn() }));

const createMock = vi.mocked(createSupabase);
const salvarMock = vi.mocked(salvarMarca);
const sessao = { data: { session: { access_token: "t" }, user: { id: "u1" } }, error: null };
const auth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
};
const conexao = "Não foi possível conectar agora. Tente de novo em instantes.";

function form(campos: Record<string, string>) {
  const f = new FormData();
  Object.entries({ email: "ana@x.com", senha: "segredo1", voltar: "/filme/5", ...campos }).forEach(([k, v]) =>
    f.set(k, v),
  );
  return f;
}

beforeEach(() => {
  vi.mocked(redirect).mockClear();
  salvarMock.mockReset().mockResolvedValue(null);
  Object.values(auth).forEach((fn) => fn.mockReset());
  auth.signInWithPassword.mockResolvedValue(sessao);
  auth.signUp.mockResolvedValue(sessao);
  auth.signOut.mockResolvedValue({ error: null });
  createMock.mockResolvedValue({ auth } as never);
});

describe.each([
  ["entrar", entrar],
  ["criarConta", criarConta],
] as const)("%s", (_nome, acao) => {
  it("e-mail inválido não chama o Supabase", async () => {
    expect(await acao({}, form({ email: "ana" }))).toEqual({ erro: "Digite um e-mail válido.", email: "ana" });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("senha curta não chama o Supabase", async () => {
    expect(await acao({}, form({ senha: "12345" }))).toEqual({
      erro: "A senha precisa ter pelo menos 6 caracteres.",
      email: "ana@x.com",
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("sucesso volta para a página de origem", async () => {
    await expect(acao({}, form({}))).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/filme/5");
    expect(salvarMock).not.toHaveBeenCalled();
  });

  it("sucesso conclui a marcação pendente", async () => {
    await expect(acao({}, form({ filme: "5", marcar: "quero" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(salvarMock).toHaveBeenCalledWith(5, "quero");
  });

  it("marcação pendente inválida é ignorada", async () => {
    await expect(acao({}, form({ filme: "abc", marcar: "quero" }))).rejects.toThrow("NEXT_REDIRECT");
    await expect(acao({}, form({ filme: "5", marcar: "talvez" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(salvarMock).not.toHaveBeenCalled();
  });

  it("voltar malicioso vai para /", async () => {
    await expect(acao({}, form({ voltar: "//evil.com" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("voltar com tabulação escondida vai para /", async () => {
    await expect(acao({}, form({ voltar: "/\t/evil.com" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("sem Supabase mostra erro de conexão", async () => {
    createMock.mockResolvedValue(null);
    expect(await acao({}, form({}))).toEqual({ erro: conexao, email: "ana@x.com" });
  });
});

it("entrar envia e-mail e senha e traduz o erro", async () => {
  auth.signInWithPassword.mockResolvedValue({ data: { session: null, user: null }, error: { code: "invalid_credentials" } });
  expect(await entrar({}, form({}))).toEqual({ erro: "E-mail ou senha incorretos.", email: "ana@x.com" });
  expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "ana@x.com", password: "segredo1" });
});

it("criarConta traduz e-mail já cadastrado", async () => {
  auth.signUp.mockResolvedValue({ data: { session: null, user: null }, error: { code: "user_already_exists" } });
  expect(await criarConta({}, form({}))).toEqual({
    erro: "Já existe uma conta com esse e-mail. Entre com sua senha.",
    email: "ana@x.com",
  });
  expect(auth.signUp).toHaveBeenCalledWith({ email: "ana@x.com", password: "segredo1" });
});

it("criarConta sem sessão pede confirmação de e-mail", async () => {
  auth.signUp.mockResolvedValue({ data: { session: null, user: { id: "u1" } }, error: null });
  expect(await criarConta({}, form({ filme: "5", marcar: "quero" }))).toEqual({
    erro: "Conta criada. Confirme seu e-mail para entrar.",
    email: "ana@x.com",
  });
  expect(salvarMock).not.toHaveBeenCalled();
  expect(redirect).not.toHaveBeenCalled();
});

it("sair encerra a sessão e volta ao início", async () => {
  await expect(sair()).rejects.toThrow("NEXT_REDIRECT");
  expect(auth.signOut).toHaveBeenCalled();
  expect(redirect).toHaveBeenCalledWith("/");
});
