import { act, fireEvent, render, screen } from "@testing-library/react";
import { CountrySelect } from "@/components/CountrySelect";
import { FilterBar } from "@/components/FilterBar";
import { GenreFilter } from "@/components/GenreFilter";
import { ProviderFilter } from "@/components/ProviderFilter";
import { SearchBox } from "@/components/SearchBox";
import { SortSelect } from "@/components/SortSelect";
import type { Filters } from "@/lib/filters";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const base: Filters = { pais: "BR", streamings: [], generos: [], ordem: "popularidade", q: "" };
const providers = [
  { id: 8, name: "Netflix", logoUrl: "https://x/n.jpg" },
  { id: 119, name: "Prime Video", logoUrl: null },
];
const genres = [
  { id: 27, name: "Terror" },
  { id: 35, name: "Comédia" },
];

beforeEach(() => {
  push.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

it("SearchBox navega só após 500 ms", () => {
  vi.useFakeTimers();
  render(<SearchBox filters={{ ...base, generos: [27] }} />);
  fireEvent.change(screen.getByLabelText("Buscar filme"), { target: { value: "bat" } });
  act(() => vi.advanceTimersByTime(499));
  expect(push).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1));
  expect(push).toHaveBeenCalledWith("/?genero=27&q=bat", { scroll: false });
});

it("SearchBox vazia volta para o catálogo", () => {
  vi.useFakeTimers();
  render(<SearchBox filters={{ ...base, q: "duna" }} />);
  fireEvent.change(screen.getByLabelText("Buscar filme"), { target: { value: "" } });
  act(() => vi.advanceTimersByTime(500));
  expect(push).toHaveBeenCalledWith("/", { scroll: false });
});

it("CountrySelect troca país e limpa streamings", () => {
  render(
    <CountrySelect
      filters={{ ...base, streamings: [8], generos: [27] }}
      regions={[
        { code: "BR", name: "Brasil" },
        { code: "US", name: "Estados Unidos" },
      ]}
    />,
  );
  fireEvent.change(screen.getByLabelText("País"), { target: { value: "US" } });
  expect(push).toHaveBeenCalledWith("/?pais=US&genero=27", { scroll: false });
});

it("ProviderFilter alterna seleção", () => {
  const onChange = vi.fn();
  const { rerender } = render(<ProviderFilter providers={providers} selected={[]} onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: "Netflix" }));
  expect(onChange).toHaveBeenLastCalledWith([8]);
  rerender(<ProviderFilter providers={providers} selected={[8]} onChange={onChange} />);
  expect(screen.getByRole("button", { name: "Netflix" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Netflix" }));
  expect(onChange).toHaveBeenLastCalledWith([]);
});

it("GenreFilter alterna seleção", () => {
  const onChange = vi.fn();
  render(<GenreFilter genres={genres} selected={[27]} onChange={onChange} />);
  expect(screen.getByRole("button", { name: "Terror" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Comédia" }));
  expect(onChange).toHaveBeenLastCalledWith([27, 35]);
});

it("SortSelect oferece as quatro ordens", () => {
  const onChange = vi.fn();
  render(<SortSelect value="popularidade" disabled={false} onChange={onChange} />);
  expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
    "Mais populares",
    "Mais bem avaliados",
    "Lançamentos mais recentes",
    "Título A–Z",
  ]);
  fireEvent.change(screen.getByLabelText("Ordenar por"), { target: { value: "nota" } });
  expect(onChange).toHaveBeenCalledWith("nota");
});

it("FilterBar navega ao filtrar", () => {
  render(<FilterBar filters={base} providers={providers} genres={genres} countryName="Brasil" />);
  fireEvent.click(screen.getByRole("button", { name: "Terror" }));
  expect(push).toHaveBeenCalledWith("/?genero=27", { scroll: false });
  expect(screen.queryByText(/Mostrando resultados/)).not.toBeInTheDocument();
});

it("FilterBar desabilita ordenação na busca e mostra aviso", () => {
  render(<FilterBar filters={{ ...base, q: "x" }} providers={providers} genres={genres} countryName="Brasil" />);
  expect(screen.getByLabelText("Ordenar por")).toBeDisabled();
  expect(screen.getByText("Mostrando resultados disponíveis em streaming em Brasil")).toBeInTheDocument();
});
