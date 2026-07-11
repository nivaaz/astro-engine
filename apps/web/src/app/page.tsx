export default function Home() {
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

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Current Sky</h2>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="text-[var(--muted)] text-sm">
            Connect the computation engine to see live planetary positions.
          </p>
          {/* Transit cards will render here */}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Upcoming Events</h2>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="text-[var(--muted)] text-sm">
            Lunations, ingresses, stations, and major aspects will appear here.
          </p>
          {/* Event timeline will render here */}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "MCP Server", desc: "Connect to ChatGPT, Claude, and other AI clients." },
          { title: "Calendar Feed", desc: "Subscribe to transits in Apple Calendar or Google Calendar." },
          { title: "API", desc: "Build your own apps with the REST API." },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6"
          >
            <h3 className="font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-[var(--muted)]">{item.desc}</p>
          </div>
        ))}
      </section>

      <footer className="mt-16 pt-8 border-t border-[var(--border)] text-sm text-[var(--muted)]">
        <p>
          Built by{" "}
          <a href="https://sukara.tech" className="underline">
            Sukara Technology
          </a>{" "}
          ·{" "}
          <a href="https://github.com/nivaaz/astro-engine" className="underline">
            GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
