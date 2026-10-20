import { expect, test } from "@playwright/test";

test("home previews two populated event dates and keeps birth input session-only", async ({
  page,
  context,
}) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBe(true);
  await expect(page.locator(".notice")).toContainText(/fixture|stale/i);
  await expect(
    page.getByRole("heading", { name: "Current sky" }),
  ).toBeVisible();
  await expect(
    page.getByText("No bodygraph, type, authority, or interpretation."),
  ).toBeVisible();
  await expect(page.locator(".event-date-group")).toHaveCount(2);
  await expect(
    page.getByRole("link", { name: "See all events" }),
  ).toBeVisible();

  await page.goto("/saturn-return");
  await page.getByLabel("Date").fill("1990-01-01");
  await page.getByLabel("Supported major city").fill("Sydney, Australia");
  expect(await context.cookies()).toEqual([]);
  const stored = await page.evaluate(() =>
    JSON.stringify({
      local: { ...localStorage },
      session: { ...sessionStorage },
    }),
  );
  expect(stored).not.toContain("1990-01-01");
  expect(page.url()).not.toContain("1990-01-01");
  await page.reload();
  await expect(page.getByLabel("Date")).toHaveValue("");
});

test("events route shows full grouped result, filters Moon/quarter events, and supports a copy seam", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (value: string) => {
          (window as Window & { copied?: string }).copied = value;
        },
      },
    });
  });
  await page.goto("/events");
  await expect(
    page.getByRole("heading", { name: "Upcoming events" }),
  ).toBeVisible();
  await expect(page.locator(".event-date-group")).toHaveCount(5);
  await expect(page.getByText("First quarter Moon")).toHaveCount(0);
  await expect(page.getByText(/Moon square/i)).toHaveCount(0);
  const copy = page.getByRole("button", { name: "Copy chart for AI" }).first();
  await copy.focus();
  await expect(copy).toBeFocused();
  await copy.click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { copied?: string }).copied ?? "",
      ),
    )
    .toContain("Data from ASTRO ENGINE by sukara.tech");
});

test("Saturn return renders multiple-pass-capable result states and optional-time disclosure", async ({
  page,
}) => {
  await page.goto("/saturn-return");
  await page.getByLabel("Date").fill("1990-01-01");
  await page.getByLabel("Supported major city").fill("Sydney, Australia");
  await expect(
    page.getByText(/local noon \(12:00\).*approximation/i),
  ).toBeVisible();
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/sky") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Calculate Saturn return" }).click();
  const response = await responsePromise;
  expect(response.headers()["cache-control"]).toContain("no-store");
  await expect(
    page.getByRole("heading", { name: /return/i }).last(),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/This result uses local noon/)).toBeVisible();
  await expect(page.locator(".section-note").last()).toContainText(
    /exact pass/i,
  );
});

test("copy action has one primary control and clipboard failures are announced", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
    }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Copy chart for AI" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Copy chart for AI" }).click();
  await expect(page.locator(".copy-action").getByRole("status")).toContainText(
    "Copy failed",
  );
  await expect(page.getByRole("button", { name: "Text" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "JSON" })).toHaveCount(0);
});

test("events route fails closed when the provider request fails", async ({
  page,
}) => {
  await page.route("**/api/sky", (route) => route.abort());
  await page.goto("/events");
  await expect(page.getByText("Provider unavailable")).toBeVisible();
  await expect(
    page.getByText("No astronomical values are substituted or estimated."),
  ).toBeVisible();
});

test("manifest, security policy, and service worker are available", async ({
  page,
}) => {
  const response = await page.goto("/");
  expect(response?.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(response?.headers()["permissions-policy"]).toContain(
    "geolocation=(self)",
  );
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest",
  );
  await expect
    .poll(() =>
      page.evaluate(() =>
        navigator.serviceWorker.getRegistration().then(Boolean),
      ),
    )
    .toBe(true);
  expect((await page.request.get("/icon")).ok()).toBe(true);
});

test("offline reload presents no cached astronomical result", async ({
  page,
  context,
}) => {
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
  await expect(
    page.getByText(
      "You are offline. No cached astronomical result is being presented as current.",
    ),
  ).toBeVisible();
  await expect(page.getByText("Sun", { exact: true })).toHaveCount(0);
  await context.setOffline(false);
  await page.reload();
  await expect(page.locator(".notice")).toContainText(/fixture|current/i);
});

test("major city lookup fills canonical local context without a network request", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Major city").fill("Sydney, Australia");
  await expect(page.getByLabel("Latitude")).toHaveValue("-33.92001");
  await expect(page.getByLabel("Longitude")).toHaveValue("151.18518");
  await expect(page.getByLabel("Timezone")).toHaveValue("Australia/Sydney");
  await expect(
    page.getByText(/Local context ready · Sydney, Australia/),
  ).toBeVisible();
});

test("390px mobile keeps route controls reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/saturn-return");
  await expect(
    page.getByRole("heading", { name: "Saturn return" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Calculate Saturn return" }),
  ).toBeVisible();
  await page.goto("/events");
  await expect(
    page.getByRole("heading", { name: "Upcoming events" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
});
