import { expect, test } from "@playwright/test";

test("foundation shell loads without exposing product claims", async ({
  page,
}) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "Foundation gate in progress",
  );
  await expect(page.getByText(/never interpretations/i)).toBeVisible();
});
