import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/Footer";

it("mostra os créditos do TMDB e do JustWatch", () => {
  render(<Footer />);
  expect(
    screen.getByText("Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB."),
  ).toBeInTheDocument();
  expect(screen.getByText("Dados de disponibilidade: JustWatch.")).toBeInTheDocument();
  expect(screen.getByAltText("TMDB").closest("a")).toHaveAttribute("href", "https://www.themoviedb.org");
});
