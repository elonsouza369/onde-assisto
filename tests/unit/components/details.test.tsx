import { fireEvent, render, screen } from "@testing-library/react";
import { MovieHero } from "@/components/MovieHero";
import { TrailerModal } from "@/components/TrailerModal";
import { WatchProviders } from "@/components/WatchProviders";
import type { MovieDetails } from "@/lib/tmdb/types";

const details: MovieDetails = {
  id: 1,
  title: "Duna: Parte Dois",
  year: 2024,
  runtime: 166,
  overview: "Paul Atreides se une aos Fremen.",
  rating: 8.1,
  posterUrl: "https://image.tmdb.org/t/p/w342/p.jpg",
  backdropUrl: "https://image.tmdb.org/t/p/w1280/b.jpg",
  genres: [
    { id: 878, name: "Ficção científica" },
    { id: 12, name: "Aventura" },
  ],
  trailerKey: "abc",
  providers: [],
  watchLink: null,
};

it("MovieHero mostra dados e duração formatada", () => {
  render(<MovieHero movie={details} />);
  expect(screen.getByRole("heading", { name: "Duna: Parte Dois" })).toBeInTheDocument();
  expect(screen.getByText("2024")).toBeInTheDocument();
  expect(screen.getByText("2h46")).toBeInTheDocument();
  expect(screen.getByText("★ 8,1")).toBeInTheDocument();
  expect(screen.getByText("Ficção científica")).toBeInTheDocument();
  expect(screen.getByText("Paul Atreides se une aos Fremen.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Ver trailer" })).toBeInTheDocument();
});

it("MovieHero sem backdrop, runtime, ano e trailer", () => {
  const { container } = render(
    <MovieHero movie={{ ...details, backdropUrl: null, runtime: null, year: null, trailerKey: null, posterUrl: null }} />,
  );
  expect(container.textContent).not.toMatch(/null|NaN|undefined/);
  expect(screen.queryByRole("button", { name: "Ver trailer" })).not.toBeInTheDocument();
});

it("MovieHero mostra só a duração quando não há ano", () => {
  render(<MovieHero movie={{ ...details, year: null, runtime: 90 }} />);
  expect(screen.getByText("1h30")).toBeInTheDocument();
});

it("TrailerModal abre e fecha com Esc, botão e clique fora", () => {
  render(<TrailerModal trailerKey="abc" />);
  const open = () => fireEvent.click(screen.getByRole("button", { name: "Ver trailer" }));
  const frame = () => screen.queryByTitle("Trailer");

  open();
  expect(frame()).toHaveAttribute("src", expect.stringContaining("/embed/abc"));
  fireEvent.keyDown(document, { key: "Escape" });
  expect(frame()).not.toBeInTheDocument();

  open();
  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
  expect(frame()).not.toBeInTheDocument();

  open();
  fireEvent.click(screen.getByRole("dialog"));
  expect(frame()).not.toBeInTheDocument();
});

it("WatchProviders lista provedores e link", () => {
  render(
    <WatchProviders
      countryName="Brasil"
      watchLink="https://www.themoviedb.org/movie/1/watch"
      providers={[{ id: 8, name: "Netflix", logoUrl: "https://x/n.jpg" }]}
    />,
  );
  expect(screen.getByRole("heading", { name: "Onde assistir · Brasil" })).toBeInTheDocument();
  expect(screen.getByText("Netflix")).toBeInTheDocument();
  const link = screen.getByRole("link", { name: "Ver no JustWatch" });
  expect(link).toHaveAttribute("href", "https://www.themoviedb.org/movie/1/watch");
  expect(link).toHaveAttribute("target", "_blank");
});

it("WatchProviders sem provedores mostra aviso", () => {
  render(<WatchProviders countryName="Brasil" watchLink={null} providers={[]} />);
  expect(screen.getByText("Não disponível em streaming em Brasil no momento")).toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
