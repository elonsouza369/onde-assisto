import { expect, test } from "@playwright/test";

test("listas: criar conta, marcar, mover e desmarcar", async ({ page }) => {
  test.skip(!process.env.SUPABASE_URL, "Supabase não configurado");

  await page.goto("/entrar?modo=criar");
  await page.getByLabel("E-mail").fill(`e2e+${Date.now()}@exemplo.com`);
  await page.getByLabel("Senha").fill("senha-e2e-123");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByRole("link", { name: "Quero assistir" })).toBeVisible();

  const cards = page.locator('main a[href^="/filme/"]');
  await cards.first().click();
  await expect(page).toHaveURL(/\/filme\/\d+/);
  const filme = page.url();

  await page.getByRole("button", { name: "+ Quero assistir" }).click();
  await expect(page.getByRole("button", { name: "+ Quero assistir" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("link", { name: "Quero assistir" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("1 filme");
  await expect(cards).toHaveCount(1);

  await page.goto(filme);
  await page.getByRole("button", { name: "✓ Já assisti" }).click();
  await expect(page.getByRole("button", { name: "✓ Já assisti" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("link", { name: "Quero assistir" }).click();
  await expect(page.getByText(/Nenhum filme aqui ainda/)).toBeVisible();
  await page.getByRole("link", { name: "Já assistidos" }).click();
  await expect(cards).toHaveCount(1);

  await page.goto(filme);
  await page.getByRole("button", { name: "✓ Já assisti" }).click();
  await expect(page.getByRole("button", { name: "✓ Já assisti" })).toHaveAttribute("aria-pressed", "false");

  await page.getByLabel("Sua conta").click();
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();
});
