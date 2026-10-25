import { expect, test } from "@playwright/test";

test("fluxo principal", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Onde Assisto/ })).toBeVisible();
  const cards = page.locator('a[href^="/filme/"]');
  await expect(cards.first()).toBeVisible();

  await page.getByRole("button", { name: /Terror/ }).click();
  await expect(page).toHaveURL(/genero=27/);

  await page.goto("/");
  await page.getByLabel("Buscar filme").fill("batman");
  await expect(page).toHaveURL(/q=batman/);
  await expect(page.getByText(/Mostrando resultados disponíveis/)).toBeVisible();

  await cards.first().click();
  await expect(page.getByText(/Onde assistir ·/)).toBeVisible();
});
