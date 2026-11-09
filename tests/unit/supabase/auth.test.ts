// @vitest-environment node
import { getUsuario } from "@/lib/supabase/auth";
import { createSupabase } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({ createSupabase: vi.fn() }));
const createMock = vi.mocked(createSupabase);

function clientWith(getUser: () => Promise<unknown>) {
  return { auth: { getUser: vi.fn(getUser) } } as unknown as Awaited<ReturnType<typeof createSupabase>>;
}

beforeEach(() => createMock.mockReset());

it("getUsuario devolve null sem Supabase configurado", async () => {
  createMock.mockResolvedValue(null);
  expect(await getUsuario()).toBeNull();
});

it("getUsuario devolve id e e-mail", async () => {
  createMock.mockResolvedValue(
    clientWith(async () => ({ data: { user: { id: "u1", email: "a@b.com" } }, error: null })),
  );
  expect(await getUsuario()).toEqual({ id: "u1", email: "a@b.com" });
});

it("getUsuario devolve null em erro ou exceção", async () => {
  createMock.mockResolvedValue(clientWith(async () => ({ data: { user: null }, error: { message: "x" } })));
  expect(await getUsuario()).toBeNull();
  createMock.mockResolvedValue(
    clientWith(async () => {
      throw new Error("fora do ar");
    }),
  );
  expect(await getUsuario()).toBeNull();
});
