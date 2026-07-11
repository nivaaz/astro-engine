"use client";

import { useEffect, useState } from "react";
import { getCurrentSky } from "./actions";

interface PlanetDisplay {
  symbol: string;
  name: string;
  sign: string;
  signSymbol: string;
  degree: number;
  minute: number;
  isRetrograde: boolean;
}

interface AspectDisplay {
  bodyA: string;
  bodyB: string;
  type: string;
  orb: number;
  applying: boolean;
  symbol: string;
}

interface CurrentSky {
  timestamp: string;
  julianDay: number;
  planets: PlanetDisplay[];
  aspects: AspectDisplay[];
}

export default function Home() {
  const [sky, setSky] = useState<CurrentSky | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentSky()
      .then(setSky)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-16">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Astro Engine
        </h1>
        <p className="text-xl text-[var(--muted)]">
          Open infrastructure for building with astrology.
        </p>
      </header>

      {/* Current Sky Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Current Sky</h2>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
          {loading ? (
            <p className="text-[var(--muted)]">Computing planetary positions...</p>
          ) : error ? (
            <p className="text-red-400">Error: {error}</p>
          ) : sky ? (
            <>
              <p className="text-sm text-[var(--muted)] mb-4">
                {new Date(sky.timestamp).toLocaleString("en-AU", {
                  timeZone: "Australia/Sydney",
                  dateStyle: "full",
                  timeStyle: "long",
                })}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {sky.planets.map((planet) => (
                  <div
                    key={planet.name}
                    className="flex items-center gap-3 p-3 rounded-md bg-[var(--background)]"
                  >
                    <span className="text-2xl">{planet.symbol}</span>
                    <div>
                      <p className="font-medium">
                        {planet.signSymbol} {planet.degree}°{String(planet.minute).padStart(2, "0")}'
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {planet.sign}
                        {planet.isRetrograde && " ℞"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>

      {/* Aspects Section */}
      {sky && sky.aspects.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Active Aspects</h2>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="space-y-3">
              {sky.aspects.map((aspect, i) => {
                const planetA = sky.planets.find((p) => p.name.toLowerCase().replace(" ", "_") === aspect.bodyA);
                const planetB = sky.planets.find((p) => p.name.toLowerCase().replace(" ", "_") === aspect.bodyB);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-md bg-[var(--background)]"
                  >
                    <span className="text-xl">{planetA?.symbol}</span>
                    <span className="text-[var(--accent-light)]">{aspect.symbol}</span>
                    <span className="text-xl">{planetB?.symbol}</span>
                    <div className="flex-1">
                      <p className="text-sm">
                        {aspect.type.charAt(0).toUpperCase() + aspect.type.slice(1)}
                        <span className="text-[var(--muted)] ml-2">
                          {aspect.orb}° {aspect.applying ? "applying" : "separating"}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { title: "MCP Server", desc: "Connect to ChatGPT, Claude, and other AI clients.", href: "#mcp" },
          { title: "Calendar Feed", desc: "Subscribe to transits in Apple Calendar or Google Calendar.", href: "#calendar" },
          { title: "API", desc: "Build your own apps with the REST API.", href: "#api" },
        ].map((item) => (
          <a
            key={item.title}
            href={item.href}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-[var(--accent)] transition-colors"
          >
            <h3 className="font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-[var(--muted)]">{item.desc}</p>
          </a>
        ))}
      </section>

      {/* Quick Start */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Quick Start</h2>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
          <pre className="text-sm overflow-x-auto">
            <code>{`# Clone and install
git clone https://github.com/nivaaz/astro-engine.git
cd astro-engine
npm install

# Run the CLI
npx tsx packages/astro-engine-cli/src/cli.ts

# Start the MCP server
npx tsx packages/astro-mcp/src/server.ts`}</code>
          </pre>
        </div>
      </section>

      <footer className="mt-16 pt-8 border-t border-[var(--border)] text-sm text-[var(--muted)]">
        <p>
          Built by{" "}
          <a href="https://sukara.tech" className="underline hover:text-[var(--foreground)]">
            Sukara Technology
          </a>{" "}
          ·{" "}
          <a href="https://github.com/nivaaz/astro-engine" className="underline hover:text-[var(--foreground)]">
            GitHub
          </a>{" "}
          ·{" "}
          <a href="https://github.com/nivaaz/astro-engine/tree/main/packages/astro-mcp" className="underline hover:text-[var(--foreground)]">
            MCP Server
          </a>
        </p>
      </footer>
    </main>
  );
}
