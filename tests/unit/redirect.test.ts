import { caminhoSeguro } from "@/lib/redirect";

it.each(["/filme/1?pais=BR", "/?aba=assistidos", "/"])("caminhoSeguro mantém caminho interno %s", (v) => {
  expect(caminhoSeguro(v)).toBe(v);
});

it.each(["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", "evil.com", "", null, undefined])(
  "caminhoSeguro troca %s por /",
  (v) => {
    expect(caminhoSeguro(v)).toBe("/");
  },
);

// O parser de URL do navegador descarta tab e quebra de linha: "/\t/evil.com" vira "//evil.com".
it.each(["/\t/evil.com", "/\n/evil.com", "/\r/evil.com", "/\t\\evil.com", "/a\\b"])(
  "caminhoSeguro recusa caracteres de controle e barra invertida (%j)",
  (v) => {
    expect(caminhoSeguro(v)).toBe("/");
  },
);

it("caminhoSeguro preserva busca e âncora", () => {
  expect(caminhoSeguro("/?aba=assistidos&pais=US#topo")).toBe("/?aba=assistidos&pais=US#topo");
});
