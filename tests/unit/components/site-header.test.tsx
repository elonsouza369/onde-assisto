import { render, screen } from "@testing-library/react";
import { SiteHeader } from "@/components/SiteHeader";

const nav = vi.hoisted(() => ({ pathname: "/", query: "" }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.query),
}));
vi.mock("@/app/entrar/actions", () => ({ sair: vi.fn() }));

const usuario = { email: "ana@x.com" };
const link = (name: string) => screen.queryByRole("link", { name });

beforeEach(() => {
  nav.pathname = "/";
  nav.query = "";
});

describe("sem login", () => {
  it("mostra Entrar com a página atual e nenhuma aba", () => {
    nav.query = "aba=assistidos";
    render(<SiteHeader usuario={null} />);
    expect(link("Entrar")).toHaveAttribute("href", "/entrar?voltar=%2F%3Faba%3Dassistidos");
    expect(link("Quero assistir")).toBeNull();
    expect(screen.queryByRole("button", { name: "Sair" })).toBeNull();
  });

  it("não mostra Entrar na própria tela de login", () => {
    nav.pathname = "/entrar";
    render(<SiteHeader usuario={null} />);
    expect(link("Entrar")).toBeNull();
  });
});

describe("com login", () => {
  it("mostra as abas, a inicial e Sair", () => {
    render(<SiteHeader usuario={usuario} />);
    expect(link("Catálogo")).toHaveAttribute("href", "/");
    expect(link("Quero assistir")).toHaveAttribute("href", "/?aba=quero-assistir");
    expect(link("Já assistidos")).toHaveAttribute("href", "/?aba=assistidos");
    expect(link("Catálogo")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("ana@x.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
    expect(link("Entrar")).toBeNull();
  });

  it("marca a aba da URL e mantém o país", () => {
    nav.query = "aba=assistidos&pais=US";
    render(<SiteHeader usuario={usuario} />);
    expect(link("Já assistidos")).toHaveAttribute("aria-current", "page");
    expect(link("Catálogo")).not.toHaveAttribute("aria-current");
    expect(link("Catálogo")).toHaveAttribute("href", "/?pais=US");
    expect(link("Quero assistir")).toHaveAttribute("href", "/?aba=quero-assistir&pais=US");
  });

  it("fora da página inicial nenhuma aba fica ativa", () => {
    nav.pathname = "/filme/5";
    render(<SiteHeader usuario={usuario} />);
    expect(screen.queryAllByRole("link", { current: "page" })).toHaveLength(0);
  });
});
