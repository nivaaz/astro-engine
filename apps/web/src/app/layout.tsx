import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { PwaRegistration } from "./pwa-registration";

export const metadata: Metadata = {
  title: "Astro Engine — The sky, without the story",
  description:
    "Deterministic tropical coordinates, Whole Sign structure, and Human Design transit gates for builders and AI workflows.",
  manifest: "/manifest.webmanifest",
  applicationName: "Astro Engine",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Astro Engine",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#11110f",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Astro Engine",
  description:
    "Deterministic tropical coordinates, Whole Sign structure, bounded events, and session-only Saturn-return timing.",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <PwaRegistration />
        {children}
      </body>
    </html>
  );
}
