import { ABAS, parseAba, parseMarca } from "@/lib/marcas";

it.each(["quero", "assistido"])("parseMarca aceita %s", (v) => {
  expect(parseMarca(v)).toBe(v);
});

it.each(["x", "", null, undefined, 1])("parseMarca recusa %s", (v) => {
  expect(parseMarca(v)).toBeNull();
});

it.each(["quero-assistir", "assistidos"])("parseAba aceita %s", (v) => {
  expect(parseAba(v)).toBe(v);
});

it.each(["x", "", undefined, "quero"])("parseAba recusa %s", (v) => {
  expect(parseAba(v)).toBeNull();
});

it("ABAS liga cada aba à sua marca e título", () => {
  expect(ABAS).toEqual({
    "quero-assistir": { marca: "quero", titulo: "Quero assistir" },
    assistidos: { marca: "assistido", titulo: "Já assistidos" },
  });
});
