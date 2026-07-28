import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Upcoming events | Astro Engine",
  description:
    "A deterministic 30-day tropical major-event result grouped by local calendar date.",
};

export default function EventsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
