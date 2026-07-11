import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Astro Engine — Build with the sky",
  description:
    "Open infrastructure for building with astrology. Compute transits, aspects, natal charts, and export to calendars, MCP, and AI-ready context.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
