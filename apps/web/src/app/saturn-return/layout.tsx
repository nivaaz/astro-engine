import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Saturn return | Astro Engine",
  description:
    "A bounded tropical Saturn-return search with exact windows and passes, using session-only birth input.",
};

export default function SaturnReturnLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
