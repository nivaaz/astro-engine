import { expect, test, type Page } from "@playwright/test";
import type {
  CurrentSky,
  EventSearchResult,
  HumanDesignTransitResult,
} from "@sukara/astro-schema";

/** Synthetic provider envelopes exercise UI states, not astronomical accuracy. */
async function providerPresentation(page: Page): Promise<void> {
  const fixture = (await (
    await page.request.get("/api/sky")
  ).json()) as Readonly<{
    currentSky: CurrentSky;
    upcomingEvents: EventSearchResult;
    humanDesign: HumanDesignTransitResult;
  }>;
  await page.clock.install({
    time: new Date(Date.parse(fixture.currentSky.metadata.calculatedAt) + 10),
  });
  await page.route("**/api/sky", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        json: { ok: true, operation: "current-sky", value: fixture.currentSky },
      });
      return;
    }
    const input = route.request().postDataJSON() as {
      operation: string;
      request?: { limit: number };
    };
    if (input.operation === "events") {
      expect(input.request?.limit).toBe(500);
      await route.fulfill({
        json: {
          ok: true,
          operation: "events",
          value: {
            ...fixture.upcomingEvents,
            complete: false,
            truncatedAtLimit: true,
          },
        },
      });
    } else if (input.operation === "human-design") {
      await route.fulfill({
        json: {
          ok: true,
          operation: input.operation,
          value: fixture.humanDesign,
        },
      });
    } else await route.continue();
  });
}

test("provider freshness, incomplete coverage, and local result layout remain honest", async ({
  page,
}) => {
  await providerPresentation(page);
  await page.goto("/");
  await expect(page.locator(".notice")).toContainText("Current");
  await expect(page.locator(".notice")).not.toContainText(/stale|fixture/i);
  await expect(page.locator("#events .event-coverage")).toContainText(
    "Later events",
  );
  await page
    .getByLabel("Major city", { exact: true })
    .fill("Sydney, Australia");
  await page.getByRole("button", { name: "Calculate Whole Sign" }).click();
  await expect(
    page.getByText("Whole Sign calculation complete.", { exact: true }),
  ).toBeVisible();
  const result = page.getByRole("definition");
  await expect(result).toHaveCount(3);
  for (const width of [390, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const feedback = page.locator(".location-feedback");
    const note = await feedback.getByRole("status").boundingBox();
    const chart = await feedback.locator("dl").boundingBox();
    expect(note).not.toBeNull();
    expect(chart).not.toBeNull();
    expect(chart!.y).toBeGreaterThanOrEqual(note!.y + note!.height);
    expect(
      await feedback.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
  }
  await page.clock.fastForward(5 * 60_000);
  await expect(page.locator(".notice")).toContainText("Stale");
  await page.goto("/events");
  await expect(page.locator(".event-coverage")).toContainText(
    "Result limit reached",
  );
});

test("skipped times never transmit and repeated times require an explicit occurrence", async ({
  page,
}) => {
  const sent: string[] = [];
  await page.route("**/api/sky", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const input = route.request().postDataJSON() as {
      operation: string;
      birthInstant?: string;
    };
    if (input.operation !== "saturn-return") return route.continue();
    sent.push(input.birthInstant!);
    await route.fulfill({
      status: 503,
      json: { ok: false, error: "provider-unavailable" },
    });
  });
  await page.goto("/saturn-return");
  await page.getByLabel("Supported major city").fill("Sydney, Australia");
  await page.getByLabel("Date", { exact: true }).fill("2026-10-04");
  await page.getByLabel(/Local time/).fill("02:30");
  await page.getByRole("button", { name: "Calculate Saturn return" }).click();
  await expect(page.locator("#time-error")).toContainText("do not exist");
  expect(sent).toEqual([]);
  await page.getByLabel("Date", { exact: true }).fill("2026-04-05");
  await page.getByRole("button", { name: "Calculate Saturn return" }).click();
  await expect(page.locator("#time-error")).toContainText("occurs twice");
  expect(sent).toEqual([]);
  await page.getByLabel("Repeated local time").selectOption("later");
  await page.getByRole("button", { name: "Calculate Saturn return" }).click();
  await expect(
    page.getByText(/unavailable without a configured licensed provider/),
  ).toBeVisible();
  expect(sent).toEqual(["2026-04-04T16:30:00.000Z"]);
});

test("editing a pending fold choice cannot display the previous calculation", async ({
  page,
}) => {
  let started!: () => void;
  let release!: () => void;
  let finished!: () => void;
  const startedPromise = new Promise<void>((resolve) => {
    started = resolve;
  });
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const finishedPromise = new Promise<void>((resolve) => {
    finished = resolve;
  });
  await page.route("**/api/sky", async (route) => {
    if (
      route.request().method() !== "POST" ||
      route.request().postDataJSON().operation !== "saturn-return"
    )
      return route.continue();
    const response = await route.fetch();
    started();
    await held;
    try {
      await route.fulfill({ response });
    } catch {
      /* Browser may have cancelled the route. */
    } finally {
      finished();
    }
  });
  await page.goto("/saturn-return");
  await page.getByLabel("Supported major city").fill("Sydney, Australia");
  await page.getByLabel("Date", { exact: true }).fill("2026-04-05");
  await page.getByLabel(/Local time/).fill("02:30");
  await page.getByRole("button", { name: "Calculate Saturn return" }).click();
  await page.getByLabel("Repeated local time").selectOption("earlier");
  await page.getByRole("button", { name: "Calculate Saturn return" }).click();
  await startedPromise;
  await page.getByLabel("Repeated local time").selectOption("later");
  release();
  await finishedPromise;
  await expect(page.getByLabel("Repeated local time")).toHaveValue("later");
  await expect(
    page.getByRole("button", { name: "Calculate Saturn return" }),
  ).toBeEnabled();
  await expect(
    page.getByText(
      "Saturn-return calculation complete. Exact passes are shown below.",
    ),
  ).toHaveCount(0);
  await expect(page.locator("#saturn-results-title")).toHaveCount(0);
});
