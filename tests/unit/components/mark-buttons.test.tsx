import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { marcarFilme } from "@/app/filme/actions";
import { MarkButtons } from "@/components/MarkButtons";

vi.mock("@/app/filme/actions", () => ({ marcarFilme: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/filme/5",
  useSearchParams: () => new URLSearchParams("pais=BR"),
}));

const marcarMock = vi.mocked(marcarFilme);
const quero = () => screen.getByRole("button", { name: "+ Quero assistir" });
const assisti = () => screen.getByRole("button", { name: "✓ Já assisti" });

// Ações pendentes que o teste observa no meio do caminho e resolve ao final.
let pendentes: (() => void)[] = [];
function pendente() {
  marcarMock.mockImplementation(() => new Promise((resolve) => pendentes.push(() => resolve(undefined))));
}

beforeEach(() => {
  marcarMock.mockReset();
  pendentes = [];
});

afterEach(async () => {
  await act(async () => pendentes.forEach((resolve) => resolve()));
});

it("marca na hora e chama a ação com o caminho atual", async () => {
  pendente();
  render(<MarkButtons filmeId={5} marca={null} />);
  expect(quero()).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(quero());
  expect(quero()).toHaveAttribute("aria-pressed", "true");
  expect(assisti()).toHaveAttribute("aria-pressed", "false");
  expect(marcarMock).toHaveBeenCalledWith(5, "quero", "/filme/5?pais=BR");
});

it("clicar no botão ativo desmarca", async () => {
  pendente();
  render(<MarkButtons filmeId={5} marca="quero" />);
  expect(quero()).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(quero());
  expect(marcarMock).toHaveBeenLastCalledWith(5, null, "/filme/5?pais=BR");
  expect(quero()).toHaveAttribute("aria-pressed", "false");
});

it("troca rápida termina no último clique", async () => {
  pendente();
  render(<MarkButtons filmeId={5} marca={null} />);
  fireEvent.click(quero());
  fireEvent.click(assisti());
  expect(marcarMock).toHaveBeenLastCalledWith(5, "assistido", "/filme/5?pais=BR");
  expect(assisti()).toHaveAttribute("aria-pressed", "true");
  expect(quero()).toHaveAttribute("aria-pressed", "false");
});

it("erro volta ao estado anterior e avisa", async () => {
  marcarMock.mockResolvedValue({ erro: "Não foi possível salvar. Tente de novo." });
  render(<MarkButtons filmeId={5} marca={null} />);
  fireEvent.click(quero());
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("Não foi possível salvar. Tente de novo."),
  );
  await waitFor(() => expect(quero()).toHaveAttribute("aria-pressed", "false"));
});
