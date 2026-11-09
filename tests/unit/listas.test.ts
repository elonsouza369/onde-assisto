// @vitest-environment node
import { getLista, getMarcas, salvarMarca } from "@/lib/listas";
import { getUsuario } from "@/lib/supabase/auth";
import { createSupabase } from "@/lib/supabase/server";
import { getMovieDetails } from "@/lib/tmdb";
import type { MovieDetails } from "@/lib/tmdb/types";
import { fakeSupabase } from "./supabase/fake";

vi.mock("@/lib/supabase/server", () => ({ createSupabase: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ getUsuario: vi.fn() }));
vi.mock("@/lib/tmdb", () => ({ getMovieDetails: vi.fn() }));

const createMock = vi.mocked(createSupabase);
const userMock = vi.mocked(getUsuario);
const detailsMock = vi.mocked(getMovieDetails);

function details(id: number): MovieDetails {
  return {
    id,
    title: `Filme ${id}`,
    year: 2024,
    runtime: 100,
    overview: "",
    rating: 7.5,
    posterUrl: `https://image.tmdb.org/t/p/w342/${id}.jpg`,
    backdropUrl: null,
    genres: [{ id: 27, name: "Terror" }],
    trailerKey: null,
    providers: [{ id: 8, name: "Netflix", logoUrl: null }],
    watchLink: null,
  };
}

beforeEach(() => {
  createMock.mockReset();
  detailsMock.mockReset();
  userMock.mockResolvedValue({ id: "u1", email: "a@b.com" });
});

describe("getMarcas", () => {
  it("getMarcas devolve {} sem usuário", async () => {
    userMock.mockResolvedValue(null);
    expect(await getMarcas()).toEqual({});
    expect(createMock).not.toHaveBeenCalled();
  });

  it("getMarcas devolve {} se o Supabase falhar", async () => {
    createMock.mockResolvedValue(fakeSupabase({ data: null, error: { message: "x" } }).client);
    expect(await getMarcas()).toEqual({});
    createMock.mockResolvedValue(null);
    expect(await getMarcas()).toEqual({});
  });

  it("getMarcas mapeia filme_id para status", async () => {
    const fake = fakeSupabase({
      data: [
        { filme_id: 1, status: "quero" },
        { filme_id: 2, status: "assistido" },
      ],
      error: null,
    });
    createMock.mockResolvedValue(fake.client);
    expect(await getMarcas()).toEqual({ 1: "quero", 2: "assistido" });
    expect(fake.called("from")).toEqual([["lista_filmes"]]);
  });
});

describe("getLista", () => {
  it("getLista pede a página certa em ordem recente", async () => {
    const fake = fakeSupabase({ data: [], error: null, count: 0 });
    createMock.mockResolvedValue(fake.client);
    await getLista("quero", 2, "BR");
    expect(fake.called("select")).toEqual([["filme_id", { count: "exact" }]]);
    expect(fake.called("eq")).toEqual([["status", "quero"]]);
    expect(fake.called("order")).toEqual([["atualizado_em", { ascending: false }]]);
    expect(fake.called("range")).toEqual([[24, 47]]);
  });

  it("getLista pula filme que falhou no TMDB", async () => {
    createMock.mockResolvedValue(
      fakeSupabase({ data: [{ filme_id: 10 }, { filme_id: 20 }], error: null, count: 30 }).client,
    );
    detailsMock.mockImplementation(async (id) => {
      if (id === 20) throw new Error("404");
      return details(id);
    });
    const page = await getLista("assistido", 1, "US");
    expect(detailsMock).toHaveBeenCalledWith(10, "US");
    expect(page.movies.map((m) => m.id)).toEqual([10]);
    expect(page.movies[0]).toMatchObject({ title: "Filme 10", genreIds: [27], rating: 7.5 });
    expect(page).toMatchObject({ page: 1, totalPages: 2, total: 30 });
  });

  it("getLista vazia tem uma página", async () => {
    createMock.mockResolvedValue(fakeSupabase({ data: [], error: null, count: 0 }).client);
    expect(await getLista("quero", 1, "BR")).toEqual({ movies: [], page: 1, totalPages: 1, total: 0 });
  });

  it("getLista lança se o Supabase falhar", async () => {
    createMock.mockResolvedValue(fakeSupabase({ data: null, error: { message: "x" }, count: null }).client);
    await expect(getLista("quero", 1, "BR")).rejects.toThrow();
  });
});

describe("salvarMarca", () => {
  it("salvarMarca faz upsert por usuário e filme", async () => {
    const fake = fakeSupabase();
    createMock.mockResolvedValue(fake.client);
    expect(await salvarMarca(7, "assistido")).toBeNull();
    expect(fake.called("upsert")).toEqual([
      [{ filme_id: 7, status: "assistido", atualizado_em: expect.any(String) }, { onConflict: "user_id,filme_id" }],
    ]);
  });

  it("salvarMarca com null apaga a linha", async () => {
    const fake = fakeSupabase();
    createMock.mockResolvedValue(fake.client);
    expect(await salvarMarca(7, null)).toBeNull();
    expect(fake.called("delete")).toHaveLength(1);
    expect(fake.called("eq")).toEqual([["filme_id", 7]]);
  });

  it("salvarMarca devolve erro em falha", async () => {
    const erro = { erro: "Não foi possível salvar. Tente de novo." };
    createMock.mockResolvedValue(fakeSupabase({ data: null, error: { message: "x" } }).client);
    expect(await salvarMarca(7, "quero")).toEqual(erro);
    createMock.mockResolvedValue(null);
    expect(await salvarMarca(7, "quero")).toEqual(erro);
  });
});
