export type SiteRoute = "sky" | "events" | "saturn";

export const SITE_ROUTES: ReadonlyArray<{
  key: SiteRoute;
  desktopLabel: string;
  mobileLabel: string;
  href: string;
}> = [
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
];
