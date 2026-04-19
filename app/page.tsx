import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="px-8 py-6 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
          Hangout Wrapped
        </p>
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
          Bangalore
        </p>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)] mb-6">
          For friends who meet often
        </p>

        <h1 className="font-[family-name:var(--font-serif)] text-6xl md:text-8xl leading-[0.9] max-w-4xl">
          Plan hangouts.
          <br />
          <em className="text-[var(--accent)]">Keep memories.</em>
        </h1>

        <p className="text-[var(--muted)] text-lg mt-8 max-w-xl leading-relaxed">
          Find the fair meeting spot for your friend group in Bangalore — and at
          month-end, see everywhere you went together.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-10">
          <Link
            href="/plan"
            className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white text-sm font-medium shadow hover:opacity-90 transition"
          >
            Plan a hangout →
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm font-medium hover:bg-[var(--border)]/30 transition"
          >
            See our month
          </Link>
        </div>

        <div className="mt-16 flex items-center gap-8 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          <span>Fair midpoint</span>
          <span className="w-1 h-1 rounded-full bg-[var(--muted)]" />
          <span>Curated cafés</span>
          <span className="w-1 h-1 rounded-full bg-[var(--muted)]" />
          <span>Monthly recap</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 text-center text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
        Made for Bengaluru · 2026
      </footer>
    </main>
  );
}
