import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { criarConta, entrar } from "@/app/entrar/actions";
import { LoginForm } from "@/components/LoginForm";

vi.mock("@/app/entrar/actions", () => ({ entrar: vi.fn(), criarConta: vi.fn() }));

const base = { voltar: "/filme/5", filme: "5", marcar: "quero" };

beforeEach(() => {
  vi.mocked(entrar).mockReset();
  vi.mocked(criarConta).mockReset();
});

it("abre na aba Entrar com campos e dados ocultos", () => {
  const { container } = render(<LoginForm modo="entrar" {...base} />);
  expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Criar conta" })).toHaveAttribute(
    "href",
    "/entrar?modo=criar&voltar=%2Ffilme%2F5&filme=5&marcar=quero",
  );
  const email = screen.getByLabelText("E-mail");
  expect(email).toHaveAttribute("type", "email");
  expect(email).toHaveAttribute("autocomplete", "email");
  const senha = screen.getByLabelText("Senha");
  expect(senha).toHaveAttribute("type", "password");
  expect(senha).toHaveAttribute("minlength", "6");
  expect(senha).toHaveAttribute("autocomplete", "current-password");
  expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  const ocultos = Object.fromEntries(
    [...container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].map((i) => [i.name, i.value]),
  );
  expect(ocultos).toEqual(base);
});

it("aba Criar conta usa a senha nova", () => {
  render(<LoginForm modo="criar" {...base} />);
  expect(screen.getByRole("link", { name: "Criar conta" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute(
    "href",
    "/entrar?voltar=%2Ffilme%2F5&filme=5&marcar=quero",
  );
  expect(screen.getByLabelText("Senha")).toHaveAttribute("autocomplete", "new-password");
  expect(screen.getByRole("button", { name: "Criar conta" })).toBeInTheDocument();
});

it("mostra o erro e mantém o e-mail", async () => {
  vi.mocked(entrar).mockResolvedValue({ erro: "E-mail ou senha incorretos.", email: "ana@x.com" });
  render(<LoginForm modo="entrar" voltar="/" filme="" marcar="" />);
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "ana@x.com" } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "errada1" } });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("E-mail ou senha incorretos."));
  expect(screen.getByLabelText("E-mail")).toHaveValue("ana@x.com");
});
