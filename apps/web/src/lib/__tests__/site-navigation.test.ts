import { describe, expect, it } from "vitest";
import { SITE_ROUTES } from "../site-navigation";

describe("mobile route navigation", () => {
  it("keeps the three public routes in the intended order and labels", () => {
    expect(SITE_ROUTES).toEqual([
      {
        key: "sky",
        desktopLabel: "Current sky",
        mobileLabel: "Sky",
        href: "/#sky",
      },
      {
        key: "events",
        desktopLabel: "Events",
        mobileLabel: "Events",
        href: "/events",
      },
      {
        key: "saturn",
        desktopLabel: "Saturn return",
        mobileLabel: "Saturn",
        href: "/saturn-return",
      },
    ]);
  });
});
