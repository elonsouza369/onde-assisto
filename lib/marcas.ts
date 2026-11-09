export type Marca = "quero" | "assistido";

export type Aba = "quero-assistir" | "assistidos";

export const ABAS: Record<Aba, { marca: Marca; titulo: string }> = {
  "quero-assistir": { marca: "quero", titulo: "Quero assistir" },
  assistidos: { marca: "assistido", titulo: "Já assistidos" },
};

export function parseMarca(value: unknown): Marca | null {
  return value === "quero" || value === "assistido" ? value : null;
}

export function parseAba(value: string | undefined): Aba | null {
  return value === "quero-assistir" || value === "assistidos" ? value : null;
}
