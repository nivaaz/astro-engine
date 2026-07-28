import { expect, test } from "@playwright/test";

test("fixture-labelled public V1 does not persist personal inputs", async ({
  page,
  context,
}) => {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET")
      writes.push(
        `${request.method()} ${request.url()} ${request.postData() ?? ""}`,
      );
  });
  const response = await page.goto("/");
  expect(response?.ok()).toBe(true);
  await expect(page.locator(".notice")).toContainText(/fixture|stale/i);
  await expect(
    page.getByRole("heading", { name: "Current sky" }),
  ).toBeVisible();
  await expect(
    page.getByText("No bodygraph, type, authority, or interpretation."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Enter birth data" }).click();
  await page.getByLabel("Date").fill("1990-01-01");
  await page.getByLabel("Local time").fill("12:00");
  expect(await context.cookies()).toEqual([]);
  const stored = await page.evaluate(() =>
    JSON.stringify({
      local: { ...localStorage },
      session: { ...sessionStorage },
    }),
  );
  expect(stored).not.toContain("1990-01-01");
  expect(stored).not.toContain("12:00");
  expect(page.url()).not.toContain("1990-01-01");
  expect(writes.join("\n")).not.toContain("1990-01-01");
  const cachedUrls = await page.evaluate(async () => {
    const names = await caches.keys();
    return (
      await Promise.all(
        names.map(async (name) =>
          (await (await caches.open(name)).keys()).map(
            (request) => request.url,
          ),
        ),
      )
    ).flat();
  });
  expect(
    cachedUrls.some((url) => new URL(url).pathname.startsWith("/api/")),
  ).toBe(false);
  await page.reload();
  await page.getByRole("button", { name: "Enter birth data" }).click();
  await expect(page.getByLabel("Date")).toHaveValue("");
});

test("manifest and service worker are available", async ({ page }) => {
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
});

test("invalid local context is not labelled ready and clipboard failures are announced", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
    }),
  );
  await page.goto("/");
  await page.getByLabel("Latitude").first().fill("999");
  await page.getByLabel("Longitude").first().fill("151.2");
  await page.getByLabel("Timezone").first().fill("Not/AZone");
  await expect(
    page.getByText(
      "Choose a major city, enter coordinates, or use browser geolocation",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Text" }).click();
  await expect(page.locator(".copy-group").getByRole("status")).toContainText(
    "Copy failed",
  );
});

test("major city lookup fills canonical local context without a network request", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Major city").first().fill("Sydney, Australia");
  await expect(page.getByLabel("Latitude").first()).toHaveValue("-33.92001");
  await expect(page.getByLabel("Longitude").first()).toHaveValue("151.18518");
  await expect(page.getByLabel("Timezone").first()).toHaveValue(
    "Australia/Sydney",
  );
  await expect(
    page.getByText(/Local context ready · Sydney, Australia/),
  ).toBeVisible();
});

test("fixture provider executes Whole Sign and Saturn-return session flows", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Latitude").first().fill("-33.8688");
  await page.getByLabel("Longitude").first().fill("151.2093");
  await page.getByLabel("Timezone").first().fill("Australia/Sydney");
  await page.getByRole("button", { name: "Calculate Whole Sign" }).click();
  await expect(page.getByText(/Ascendant .* first house/i)).toBeVisible();

  await page.getByRole("button", { name: "Enter birth data" }).click();
  await page.getByLabel("Date").fill("1996-01-01");
  await page.getByLabel("Local time").fill("12:00");
  await page.getByLabel("Latitude").last().fill("-33.8688");
  await page.getByLabel("Longitude").last().fill("151.2093");
  await page.getByLabel("Timezone").last().fill("Australia/Sydney");
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/sky") &&
      response.request().method() === "POST" &&
      response.request().postData()?.includes("saturn-return") === true,
  );
  await page.getByRole("button", { name: "Calculate Saturn return" }).click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);
  expect(response.headers()["cache-control"]).toContain("no-store");
  await expect(
    page.getByText("Saturn-return fixture calculation complete."),
  ).toBeVisible();
  await expect(page.getByText(/bounded window/i)).toBeVisible();
});
