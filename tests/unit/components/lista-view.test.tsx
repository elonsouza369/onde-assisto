import { render, screen } from "@testing-library/react";
import { ListaView } from "@/components/ListaView";
import { getLista, getMarcas } from "@/lib/listas";
import type { Movie } from "@/lib/tmdb/types";

vi.mock("@/lib/listas", () => ({ getLista: vi.fn(), getMarcas: vi.fn() }));

const listaMock = vi.mocked(getLista);

function movie(id: number): Movie {
  return { id, title: `Filme ${id}`, year: 2024, posterUrl: null, rating: 7, genreIds: [], providers: [] };
}

beforeEach(() => {
  listaMock.mockReset();
  vi.mocked(getMarcas).mockResolvedValue({ 1: "quero" });
});

it("mostra título, contagem e os filmes da aba", async () => {
  listaMock.mockResolvedValue({ movies: [movie(1)], page: 1, totalPages: 1, total: 12 });
  render(await ListaView({ aba: "quero-assistir", pais: "US" }));
  expect(listaMock).toHaveBeenCalledWith("quero", 1, "US");
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Quero assistir · 12 filmes");
  expect(screen.getByRole("heading", { name: "Filme 1" })).toBeInTheDocument();
  expect(screen.getByText("Na sua lista Quero assistir")).toBeInTheDocument();
});

it("contagem no singular", async () => {
  listaMock.mockResolvedValue({ movies: [movie(1)], page: 1, totalPages: 1, total: 1 });
  render(await ListaView({ aba: "assistidos", pais: "BR" }));
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Já assistidos · 1 filme");
});

it.each([
  ["quero-assistir", "Nenhum filme aqui ainda. Encontre algo no catálogo e toque em + Quero assistir."],
  ["assistidos", "Nenhum filme aqui ainda. Quando terminar um filme, toque em ✓ Já assisti na página dele."],
] as const)("aba %s vazia convida a explorar", async (aba, mensagem) => {
  listaMock.mockResolvedValue({ movies: [], page: 1, totalPages: 1, total: 0 });
  render(await ListaView({ aba, pais: "BR" }));
  expect(screen.getByText(mensagem)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Explorar catálogo" })).toHaveAttribute("href", "/");
});

it("trocar de aba mostra os filmes da nova aba, não os da anterior", async () => {
  listaMock.mockResolvedValueOnce({ movies: [], page: 1, totalPages: 1, total: 0 });
  const { rerender } = render(await ListaView({ aba: "quero-assistir", pais: "BR" }));
  listaMock.mockResolvedValueOnce({ movies: [movie(7)], page: 1, totalPages: 1, total: 1 });
  rerender(await ListaView({ aba: "assistidos", pais: "BR" }));
  expect(screen.getByRole("heading", { name: "Filme 7" })).toBeInTheDocument();
});
