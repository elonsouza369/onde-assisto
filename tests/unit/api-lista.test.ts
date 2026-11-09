// @vitest-environment node
import { GET } from "@/app/api/lista/route";
import { getLista } from "@/lib/listas";
import { getUsuario } from "@/lib/supabase/auth";

vi.mock("@/lib/listas", () => ({ getLista: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ getUsuario: vi.fn() }));

const listaMock = vi.mocked(getLista);
const userMock = vi.mocked(getUsuario);
const pagina = { movies: [], page: 2, totalPages: 3, total: 60 };

const call = (query: string) => GET(new Request(`http://localhost/api/lista?${query}`));

beforeEach(() => {
  listaMock.mockReset();
  userMock.mockResolvedValue({ id: "u1", email: "a@b.com" });
});

it("devolve a página da aba pedida", async () => {
  listaMock.mockResolvedValue(pagina);
  const response = await call("aba=assistidos&pagina=2&pais=us");
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(pagina);
  expect(listaMock).toHaveBeenCalledWith("assistido", 2, "US");
});

it("usa BR quando o país falta", async () => {
  listaMock.mockResolvedValue(pagina);
  await call("aba=quero-assistir&pagina=1");
  expect(listaMock).toHaveBeenCalledWith("quero", 1, "BR");
});

it.each(["aba=x&pagina=1", "aba=assistidos&pagina=0", "aba=assistidos&pagina=abc", "aba=assistidos", "pagina=1"])(
  "rejeita %s",
  async (query) => {
    const response = await call(query);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "parâmetros inválidos" });
    expect(listaMock).not.toHaveBeenCalled();
  },
);

it("sem login responde 401", async () => {
  userMock.mockResolvedValue(null);
  const response = await call("aba=assistidos&pagina=1");
  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ error: "faça login" });
});

it("responde 502 se a lista falhar", async () => {
  listaMock.mockRejectedValue(new Error("fora do ar"));
  const response = await call("aba=assistidos&pagina=1");
  expect(response.status).toBe(502);
  expect(await response.json()).toEqual({ error: "Não foi possível carregar a lista" });
});
