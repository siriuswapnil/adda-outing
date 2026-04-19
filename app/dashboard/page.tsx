import outings from "@/data/outings.json";
import BangaloreMap from "./BangaloreMap";

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function Dashboard() {
  const friends = Array.from(new Set(outings.flatMap((o) => o.attendees)));
  const totalKm = outings
    .slice(1)
    .reduce((sum, o, i) => sum + km(outings[i], o), 0);
  const neighborhoodCounts = outings.reduce<Record<string, number>>((acc, o) => {
    acc[o.neighborhood] = (acc[o.neighborhood] || 0) + 1;
    return acc;
  }, {});
  const topNeighborhood = Object.entries(neighborhoodCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const vibeSummary =
    "Filter coffee mornings in Indiranagar, long conversations on Church Street, and lazy Koramangala evenings that stretched past closing time.";

  return (
    <>
      {/* ============ HERO: ONE LANDSCAPE VIEWPORT ============ */}
      <section className="h-screen w-screen p-3 flex flex-col overflow-hidden">
        {/* Eyebrow */}
        <div className="flex items-center justify-between px-2 mb-2 shrink-0">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
            April 2026 · Bangalore
          </p>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
            Hangout Wrapped
          </p>
        </div>

        {/* Bento fills the rest */}
        <div className="grid grid-cols-12 grid-rows-6 gap-2 flex-1 min-h-0">
          {/* Headline — top-left */}
          <div className="col-span-7 row-span-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-6 py-4 flex flex-col justify-center">
            <h1 className="font-[family-name:var(--font-serif)] leading-[0.88] text-[clamp(2.5rem,6.5vw,6.5rem)] text-[var(--foreground)]">
              Your month,
              <br />
              <em className="text-[var(--accent)]">wrapped.</em>
            </h1>
          </div>

          {/* Map — full right column */}
          <div className="col-span-5 row-span-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-2 flex flex-col min-h-0">
            <div className="flex-1 min-h-0">
              <BangaloreMap />
            </div>
          </div>

          {/* Outings stat */}
          <div className="col-span-2 row-span-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3 flex flex-col justify-between">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Outings
            </p>
            <div className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,4.5rem)] leading-none">
              {outings.length}
            </div>
          </div>

          {/* Friends stat */}
          <div className="col-span-2 row-span-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3 flex flex-col justify-between">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Friends
            </p>
            <div className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,4.5rem)] leading-none">
              {friends.length}
            </div>
          </div>

          {/* Km stat — accent */}
          <div className="col-span-3 row-span-2 bg-[var(--accent)] text-white rounded-2xl px-4 py-3 flex flex-col justify-between">
            <p className="text-[9px] uppercase tracking-[0.2em] opacity-80">
              Traveled together
            </p>
            <div className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,4.5rem)] leading-none">
              {Math.round(totalKm)}
              <span className="text-base align-baseline ml-1">km</span>
            </div>
          </div>

          {/* Superlative — Top Spot */}
          <div className="col-span-4 row-span-1 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-2 flex items-center justify-between gap-3">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--muted)] shrink-0">
              Top spot
            </p>
            <p className="font-[family-name:var(--font-serif)] text-[clamp(1rem,1.8vw,1.8rem)] text-[var(--accent)] leading-none text-right truncate">
              {topNeighborhood[0]}
            </p>
          </div>

          {/* Vibe quote */}
          <div className="col-span-3 row-span-1 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-2 flex items-center">
            <p className="font-[family-name:var(--font-serif)] italic leading-tight text-[clamp(0.7rem,0.9vw,0.95rem)] text-[var(--foreground)] line-clamp-2">
              &ldquo;{vibeSummary}&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ============ BELOW THE FOLD ============ */}
      <section className="px-6 md:px-10 py-16 max-w-6xl mx-auto">
        <div className="mb-16">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)] mb-6">
            Moments
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {outings.map((o) => (
              <div
                key={o.id}
                className="aspect-square overflow-hidden rounded-2xl bg-[var(--card)] border border-[var(--border)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={o.photo}
                  alt={o.cafe}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)] mb-6">
            Every outing
          </p>
          <ul className="divide-y divide-[var(--border)]">
            {outings.map((o) => (
              <li
                key={o.id}
                className="py-5 flex items-baseline justify-between gap-6"
              >
                <div>
                  <div className="font-[family-name:var(--font-serif)] text-2xl">
                    {o.cafe}
                  </div>
                  <div className="text-[var(--muted)] text-sm mt-1">
                    {o.neighborhood} · {o.attendees.length} friends
                  </div>
                </div>
                <div className="text-[var(--muted)] text-sm whitespace-nowrap font-mono">
                  {new Date(o.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <footer className="text-center text-sm text-[var(--muted)] pt-8 border-t border-[var(--border)]">
          Hangout Wrapped · April 2026
        </footer>
      </section>
    </>
  );
}
