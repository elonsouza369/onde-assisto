// @vitest-environment node
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { marcarFilme } from "@/app/filme/actions";
import { salvarMarca } from "@/lib/listas";
import { getUsuario } from "@/lib/supabase/auth";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  }),
}));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ getUsuario: vi.fn() }));
vi.mock("@/lib/listas", () => ({ salvarMarca: vi.fn() }));

const userMock = vi.mocked(getUsuario);
const salvarMock = vi.mocked(salvarMarca);
const erro = { erro: "Não foi possível salvar. Tente de novo." };

beforeEach(() => {
  vi.mocked(redirect).mockClear();
  vi.mocked(refresh).mockClear();
  salvarMock.mockReset();
  userMock.mockResolvedValue({ id: "u1", email: "a@b.com" });
});

it("sem login leva ao login guardando a marcação", async () => {
  userMock.mockResolvedValue(null);
  await expect(marcarFilme(5, "quero", "/filme/5")).rejects.toThrow("NEXT_REDIRECT");
  expect(redirect).toHaveBeenCalledWith("/entrar?voltar=%2Ffilme%2F5&filme=5&marcar=quero");
  expect(salvarMock).not.toHaveBeenCalled();
});

it("sem login e desmarcando só leva ao login", async () => {
  userMock.mockResolvedValue(null);
  await expect(marcarFilme(5, null, "/filme/5")).rejects.toThrow("NEXT_REDIRECT");
  expect(redirect).toHaveBeenCalledWith("/entrar?voltar=%2Ffilme%2F5");
});

it("sem login com voltar malicioso volta para /", async () => {
  userMock.mockResolvedValue(null);
  await expect(marcarFilme(5, "quero", "//evil.com")).rejects.toThrow("NEXT_REDIRECT");
  expect(redirect).toHaveBeenCalledWith("/entrar?voltar=%2F&filme=5&marcar=quero");
});

it("com login salva e atualiza a página", async () => {
  salvarMock.mockResolvedValue(null);
  expect(await marcarFilme(5, "quero", "/filme/5")).toBeUndefined();
  expect(salvarMock).toHaveBeenCalledWith(5, "quero");
  expect(refresh).toHaveBeenCalled();
});

it("desmarcar salva null", async () => {
  salvarMock.mockResolvedValue(null);
  await marcarFilme(5, null, "/");
  expect(salvarMock).toHaveBeenCalledWith(5, null);
});

it.each([
  [0, "quero"],
  [1.5, "quero"],
  [5, "talvez"],
])("recusa filme %s / marca %s sem salvar", async (id, marca) => {
  expect(await marcarFilme(id, marca as never, "/")).toEqual(erro);
  expect(salvarMock).not.toHaveBeenCalled();
});

it("devolve o erro de salvar sem atualizar", async () => {
  salvarMock.mockResolvedValue(erro);
  expect(await marcarFilme(5, "assistido", "/")).toEqual(erro);
  expect(refresh).not.toHaveBeenCalled();
});
