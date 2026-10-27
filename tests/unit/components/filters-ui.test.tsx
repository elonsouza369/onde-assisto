import { act, fireEvent, render, screen } from "@testing-library/react";
import { CountrySelect } from "@/components/CountrySelect";
import { FilterBar } from "@/components/FilterBar";
import { GenreFilter } from "@/components/GenreFilter";
import { ProviderFilter } from "@/components/ProviderFilter";
import { RatingFilter } from "@/components/RatingFilter";
import { SearchBox } from "@/components/SearchBox";
import { SortSelect } from "@/components/SortSelect";
import type { Filters } from "@/lib/filters";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const base: Filters = { pais: "BR", streamings: [], generos: [], ordem: "popularidade", q: "", nota: null };
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

it("RatingFilter escolhe, troca e desliga a nota mínima", () => {
  const onChange = vi.fn();
  const { rerender } = render(<RatingFilter value={null} onChange={onChange} />);
  expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["7+", "8+", "9+"]);
  fireEvent.click(screen.getByRole("button", { name: "Nota 8 ou mais" }));
  expect(onChange).toHaveBeenLastCalledWith(8);

  rerender(<RatingFilter value={8} onChange={onChange} />);
  expect(screen.getByRole("button", { name: "Nota 8 ou mais" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Nota 9 ou mais" })).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(screen.getByRole("button", { name: "Nota 9 ou mais" }));
  expect(onChange).toHaveBeenLastCalledWith(9);
  fireEvent.click(screen.getByRole("button", { name: "Nota 8 ou mais" }));
  expect(onChange).toHaveBeenLastCalledWith(null);
});

it("FilterBar navega ao escolher nota", () => {
  render(<FilterBar filters={{ ...base, generos: [27] }} providers={providers} genres={genres} countryName="Brasil" />);
  fireEvent.click(screen.getByRole("button", { name: "Nota 8 ou mais" }));
  expect(push).toHaveBeenCalledWith("/?genero=27&nota=8", { scroll: false });
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

it("SearchBox acompanha a busca da URL (ex.: Limpar filtros)", () => {
  const { rerender } = render(<SearchBox filters={{ ...base, q: "duna" }} />);
  expect(screen.getByLabelText("Buscar filme")).toHaveValue("duna");
  rerender(<SearchBox filters={base} />);
  expect(screen.getByLabelText("Buscar filme")).toHaveValue("");
});

it("SearchBox não apaga o espaço final quando a URL volta aparada", () => {
  vi.useFakeTimers();
  const { rerender } = render(<SearchBox filters={base} />);
  const input = screen.getByLabelText("Buscar filme");
  fireEvent.change(input, { target: { value: "star " } });
  act(() => vi.advanceTimersByTime(500));
  expect(push).toHaveBeenLastCalledWith("/?q=star", { scroll: false });
  rerender(<SearchBox filters={{ ...base, q: "star" }} />);
  expect(input).toHaveValue("star ");
});

it("SearchBox mantém o que foi digitado enquanto a busca carregava", () => {
  vi.useFakeTimers();
  const { rerender } = render(<SearchBox filters={base} />);
  const input = screen.getByLabelText("Buscar filme");
  fireEvent.change(input, { target: { value: "bat" } });
  act(() => vi.advanceTimersByTime(500));
  fireEvent.change(input, { target: { value: "batman" } });
  rerender(<SearchBox filters={{ ...base, q: "bat" }} />);
  expect(input).toHaveValue("batman");
});

it("SearchBox usa os filtros atuais quando a espera termina", () => {
  vi.useFakeTimers();
  const { rerender } = render(<SearchBox filters={base} />);
  fireEvent.change(screen.getByLabelText("Buscar filme"), { target: { value: "x" } });
  rerender(<SearchBox filters={{ ...base, generos: [27] }} />);
  act(() => vi.advanceTimersByTime(500));
  expect(push).toHaveBeenLastCalledWith("/?genero=27&q=x", { scroll: false });
});
