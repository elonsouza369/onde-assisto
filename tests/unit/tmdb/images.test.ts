import { imageUrl } from "@/lib/tmdb/images";

it("monta a URL da imagem", () => {
  expect(imageUrl("/a.jpg", "w342")).toBe("https://image.tmdb.org/t/p/w342/a.jpg");
});

it("retorna null sem caminho", () => {
  expect(imageUrl(null, "w342")).toBeNull();
  expect(imageUrl("", "w92")).toBeNull();
  expect(imageUrl(undefined, "w780")).toBeNull();
});
