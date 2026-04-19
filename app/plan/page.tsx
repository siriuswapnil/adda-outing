import MapPicker from "./MapPicker";

export default function PlanPage() {
  return (
    <main className="px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)] mb-2">
            Hangout Wrapped · Plan
          </p>
          <h1 className="font-[family-name:var(--font-serif)] text-5xl md:text-6xl leading-[0.95]">
            Where should we <em className="text-[var(--accent)]">meet?</em>
          </h1>
          <p className="text-[var(--muted)] mt-3 max-w-xl">
            Drop a pin for each friend&rsquo;s location. We&rsquo;ll find the
            café nearest to everyone&rsquo;s midpoint.
          </p>
        </header>
      </div>

      <MapPicker />
    </main>
  );
}
