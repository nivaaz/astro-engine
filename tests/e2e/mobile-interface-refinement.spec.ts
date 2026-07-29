import { expect, test } from "@playwright/test";

const viewports = [
  { name: "320", width: 320, height: 720 },
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
] as const;

const routes = [
  { path: "/", heading: "Current sky" },
  { path: "/events", heading: "Upcoming events" },
  { path: "/saturn-return", heading: "Saturn return" },
] as const;

test("responsive routes keep navigation, hierarchy, and touch targets usable", async ({
  page,
}) => {
  for (const viewport of viewports) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    for (const route of routes) {
      await page.goto(route.path);
      await expect(
        page.getByRole("heading", { name: route.heading }),
      ).toBeVisible();
      if (route.path !== "/saturn-return") {
        await expect(page.locator(".notice")).toContainText(/fixture|current/i);
      }
      await expect(page.locator(".primary-nav")).toBeVisible();
      await expect(page.locator(".primary-nav > a").nth(0)).toBeVisible();
      await expect(page.locator(".primary-nav > a").nth(1)).toBeVisible();
      await expect(page.locator(".primary-nav > a").nth(2)).toBeVisible();
      await expect(
        page.locator('.primary-nav a[aria-current="page"]'),
      ).toHaveCount(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
      ).toBe(true);

      const undersized = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("a, button, input, summary")]
          .filter((element) => {
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return (
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              rect.width > 0 &&
              rect.height > 0 &&
              (rect.width < 44 || rect.height < 44)
            );
          })
          .map((element) => ({
            label:
              element.getAttribute("aria-label") ?? element.textContent?.trim(),
            width: Math.round(element.getBoundingClientRect().width),
            height: Math.round(element.getBoundingClientRect().height),
          })),
      );
      expect(undersized, `${viewport.name}px ${route.path}`).toEqual([]);

      await page.screenshot({
        path: `/tmp/astro-engine-interface-evidence/${viewport.name}-${route.path === "/" ? "home" : route.path.slice(1)}.png`,
        fullPage: true,
      });

      if (viewport.name === "390" && route.path === "/") {
        const height = await page.evaluate(
          () => document.documentElement.scrollHeight,
        );
        expect(
          height,
          "home should be at least 20% shorter than the 5,636px baseline",
        ).toBeLessThanOrEqual(4508);
        const skyTop = await page
          .locator("#sky")
          .evaluate(
            (element) => element.getBoundingClientRect().top + window.scrollY,
          );
        expect(
          skyTop,
          "Current sky should begin near the top of the mobile journey",
        ).toBeLessThanOrEqual(1250);
      }
    }
  }
});

test("Saturn validation, result, unavailable, and copy feedback states are designed", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined },
    });
  });
  await page.goto("/saturn-return");
  await page.getByRole("button", { name: "Calculate Saturn return" }).click();
  await expect(page.getByText("Enter your birth date.")).toBeVisible();
  await expect(
    page.getByText("Choose a supported major city from the list."),
  ).toBeVisible();
  await expect(page.getByLabel("Date")).toBeFocused();
  await page.screenshot({
    path: "/tmp/astro-engine-interface-evidence/390-saturn-validation.png",
    fullPage: true,
  });

  await page.getByLabel("Date").fill("1990-01-01");
  await page.getByLabel("Supported major city").fill("Not a supported city");
  await page.getByRole("button", { name: "Calculate Saturn return" }).click();
  await expect(
    page.getByText("Choose a supported major city from the list."),
  ).toBeVisible();
  await expect(page.getByLabel("Supported major city")).toBeFocused();

  await page.getByLabel("Supported major city").fill("Sydney, Australia");
  await page.getByRole("button", { name: "Calculate Saturn return" }).click();
  await expect(
    page.getByRole("heading", { name: /return/i }).last(),
  ).toBeVisible({ timeout: 30_000 });
  await page.screenshot({
    path: "/tmp/astro-engine-interface-evidence/390-saturn-result.png",
    fullPage: true,
  });

  await page.goto("/");
  await expect(page.locator(".notice")).toContainText(/fixture|current/i);
  await page.getByRole("button", { name: "Copy chart for AI" }).click();
  await expect(page.locator(".copy-action").getByRole("status")).toContainText(
    "Copied for AI",
  );
  await page.screenshot({
    path: "/tmp/astro-engine-interface-evidence/390-copy-success.png",
    fullPage: true,
  });

  await page.route("**/api/sky", (route) => route.abort());
  await page.reload();
  await expect(
    page.getByText(/licensed calculation provider is not configured/i),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/astro-engine-interface-evidence/390-unavailable.png",
    fullPage: true,
  });

  await page.unroute("**/api/sky");
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".notice")).toContainText("Offline");
  await page.screenshot({
    path: "/tmp/astro-engine-interface-evidence/390-offline.png",
    fullPage: true,
  });
});
