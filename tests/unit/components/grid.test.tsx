import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MovieCard } from "@/components/MovieCard";
import { MovieGrid } from "@/components/MovieGrid";
import type { Movie, MoviePage } from "@/lib/tmdb/types";


function movie(id: number, extra: Partial<Movie> = {}): Movie {
  return { id, title: `Filme ${id}`, year: 2024, posterUrl: null, rating: 7, genreIds: [], providers: [], ...extra };
}

const fetchMock = vi.fn();
const ok = (body: MoviePage) => new Response(JSON.stringify(body), { status: 200 });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe("MovieCard", () => {
  it("mostra título, ano, nota e logos", () => {
    render(
      <MovieCard
        pais="BR"
        movie={movie(1, {
          title: "Duna",
          rating: 8.1,
          posterUrl: "https://image.tmdb.org/t/p/w342/p.jpg",
          providers: [{ id: 8, name: "Netflix", logoUrl: "https://image.tmdb.org/t/p/w92/n.jpg" }],
        })}
      />,
    );
    expect(screen.getByText("Duna")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
    expect(screen.getByText("★ 8,1")).toBeInTheDocument();
    expect(screen.getByAltText("Netflix")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/filme/1?pais=BR");
  });

  it("sem pôster, sem ano e sem nota não quebra", () => {
    const { container } = render(<MovieCard pais="US" movie={movie(2, { year: null, rating: 0 })} />);
    expect(screen.getAllByText("Filme 2").length).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(/null|NaN|undefined|★/);
  });

  it.each([
    ["quero", "Na sua lista Quero assistir"],
    ["assistido", "Você já assistiu"],
  ] as const)("selo de %s", (marca, texto) => {
    render(<MovieCard pais="BR" movie={movie(4)} marca={marca} />);
    expect(screen.getByText(texto)).toBeInTheDocument();
  });

  it("sem marca não mostra selo", () => {
    render(<MovieCard pais="BR" movie={movie(4)} />);
    expect(screen.queryByText("Na sua lista Quero assistir")).not.toBeInTheDocument();
    expect(screen.queryByText("Você já assistiu")).not.toBeInTheDocument();
  });

  it("mostra no máximo 3 logos", () => {
    const providers = [1, 2, 3, 4].map((id) => ({ id, name: `P${id}`, logoUrl: `https://x/${id}.jpg` }));
    render(<MovieCard pais="BR" movie={movie(3, { providers })} />);
    expect(screen.queryByAltText("P4")).not.toBeInTheDocument();
    expect(screen.getByAltText("P3")).toBeInTheDocument();
  });
});

describe("MovieGrid", () => {
  it("carrega mais, deduplica e esconde o botão na última página", async () => {
    fetchMock.mockResolvedValue(ok({ movies: [movie(2), movie(3)], page: 2, totalPages: 2 }));
    render(<MovieGrid endpoint="/api/movies?streaming=8" pais="BR" marcas={{}} initial={{ movies: [movie(1), movie(2)], page: 1, totalPages: 2 }} />);
    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Filme 3" })).toBeInTheDocument());
    expect(fetchMock.mock.calls[0][0]).toBe("/api/movies?streaming=8&pagina=2");
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "Carregar mais" })).not.toBeInTheDocument();
  });

  it("mostra erro e tenta de novo", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("{}", { status: 502 }))
      .mockResolvedValueOnce(ok({ movies: [movie(9)], page: 2, totalPages: 3 }));
    render(<MovieGrid endpoint="/api/movies?streaming=8" pais="BR" marcas={{}} initial={{ movies: [movie(1)], page: 1, totalPages: 3 }} />);
    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    expect(await screen.findByText("Não foi possível carregar os filmes")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByRole("heading", { name: "Filme 9" })).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toBe("/api/movies?streaming=8&pagina=2");
    expect(screen.getByRole("button", { name: "Carregar mais" })).toBeInTheDocument();
  });

  it("lista vazia com mais páginas oferece Carregar mais em vez de EmptyState", () => {
    render(<MovieGrid endpoint="/api/movies?streaming=8" pais="BR" marcas={{}} initial={{ movies: [], page: 3, totalPages: 9 }} />);
    expect(screen.queryByText("Nenhum filme encontrado com esses filtros.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Carregar mais" })).toBeInTheDocument();
  });

  it("vazio mostra EmptyState", () => {
    render(<MovieGrid endpoint="/api/movies?pais=US" pais="US" marcas={{}} initial={{ movies: [], page: 1, totalPages: 0 }} />);
    expect(screen.getByText("Nenhum filme encontrado com esses filtros.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Limpar filtros" })).toHaveAttribute("href", "/?pais=US");
  });

  it("Carregar mais acrescenta a página ao endpoint da lista", async () => {
    fetchMock.mockResolvedValue(ok({ movies: [movie(2)], page: 2, totalPages: 2 }));
    render(
      <MovieGrid
        endpoint="/api/lista?aba=assistidos&pais=BR"
        pais="BR"
        marcas={{}}
        initial={{ movies: [movie(1)], page: 1, totalPages: 2 }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/lista?aba=assistidos&pais=BR&pagina=2");
  });

  it("endpoint sem parâmetros recebe ?pagina", async () => {
    fetchMock.mockResolvedValue(ok({ movies: [movie(2)], page: 2, totalPages: 2 }));
    render(<MovieGrid endpoint="/api/movies" pais="BR" marcas={{}} initial={{ movies: [movie(1)], page: 1, totalPages: 2 }} />);
    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/movies?pagina=2");
  });

  it("repassa as marcas aos cartões", () => {
    render(
      <MovieGrid
        endpoint="/api/movies"
        pais="BR"
        marcas={{ 1: "assistido" }}
        initial={{ movies: [movie(1), movie(2)], page: 1, totalPages: 1 }}
      />,
    );
    expect(screen.getAllByText("Você já assistiu")).toHaveLength(1);
  });

  it("vazio usa a mensagem própria quando informada", () => {
    render(
      <MovieGrid
        endpoint="/api/movies"
        pais="BR"
        marcas={{}}
        empty={<p>Lista vazia</p>}
        initial={{ movies: [], page: 1, totalPages: 1 }}
      />,
    );
    expect(screen.getByText("Lista vazia")).toBeInTheDocument();
    expect(screen.queryByText("Nenhum filme encontrado com esses filtros.")).not.toBeInTheDocument();
  });
});
