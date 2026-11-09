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
