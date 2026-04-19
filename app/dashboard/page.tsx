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

  // Featured photos for the collage tile (4 picks)
  const featuredPhotos = [outings[0], outings[2], outings[4], outings[7]];

  return (
    <section className="h-[100dvh] w-screen p-4 flex flex-col overflow-hidden">
      {/* Eyebrow */}
      <div className="flex items-center justify-between px-1 mb-3 shrink-0">
        <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
          April 2026 · Bangalore
        </p>
        <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
          Hangout Wrapped
        </p>
      </div>

      {/* Bento — 12 col x 10 row grid */}
      <div className="grid grid-cols-12 grid-rows-10 gap-3 flex-1 min-h-0 auto-rows-fr">
        {/* Headline tile — top-left 5x5 */}
        <div className="col-start-1 col-span-5 row-start-1 row-span-5 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
            A recap
          </p>
          <h1 className="font-[family-name:var(--font-serif)] leading-[0.88] text-[clamp(2.75rem,5.5vw,5.5rem)]">
            Your month,
            <br />
            <em className="text-[var(--accent)]">wrapped.</em>
          </h1>
          <p className="text-xs text-[var(--muted)]">
            A love letter to {friends.length} friends and{" "}
            {outings.length} cafés.
          </p>
        </div>

        {/* Map tile — top-right 7x6 (cols 6-12, rows 1-6) */}
        <div className="col-start-6 col-span-7 row-start-1 row-span-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-2 pb-2 shrink-0">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
              Where you went
            </p>
            <p className="text-[10px] text-[var(--muted)]">
              {outings.length} pins
            </p>
          </div>
          <div className="flex-1 min-h-0">
            <BangaloreMap />
          </div>
        </div>

        {/* Outings stat — row 6-7, col 1-2 */}
        <div className="col-start-1 col-span-2 row-start-6 row-span-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3 flex flex-col gap-1">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
            Outings
          </p>
          <div className="font-[family-name:var(--font-serif)] text-[clamp(2rem,4.5vw,4rem)] leading-none">
            {outings.length}
          </div>
        </div>

        {/* Friends stat — row 6-7, col 3-4 */}
        <div className="col-start-3 col-span-2 row-start-6 row-span-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3 flex flex-col gap-1">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
            Friends
          </p>
          <div className="font-[family-name:var(--font-serif)] text-[clamp(2rem,4.5vw,4rem)] leading-none">
            {friends.length}
          </div>
        </div>

        {/* Km stat — row 6-7, col 5 */}
        <div className="col-start-5 col-span-1 row-start-6 row-span-2 bg-[var(--accent)] text-white rounded-2xl px-3 py-3 flex flex-col gap-1">
          <p className="text-[9px] uppercase tracking-[0.2em] opacity-80">
            Km together
          </p>
          <div className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,3vw,2.5rem)] leading-none">
            {Math.round(totalKm)}
          </div>
        </div>

        {/* Top spot — row 8, col 1-5 */}
        <div className="col-start-1 col-span-5 row-start-8 row-span-1 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
            Top spot
          </p>
          <p className="font-[family-name:var(--font-serif)] text-[clamp(1.25rem,2vw,1.75rem)] text-[var(--accent)] leading-none truncate">
            {topNeighborhood[0]}
          </p>
        </div>

        {/* Vibe quote tile — row 9-10, col 1-5 */}
        <div className="col-start-1 col-span-5 row-start-9 row-span-2 bg-[var(--foreground)] text-[var(--card)] rounded-2xl px-5 py-4 flex flex-col justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.25em] opacity-60">
            The vibe
          </p>
          <p className="font-[family-name:var(--font-serif)] italic leading-tight text-[clamp(1rem,1.5vw,1.4rem)]">
            &ldquo;{vibeSummary}&rdquo;
          </p>
        </div>

        {/* Photo collage tile — row 7-10, col 6-12 */}
        <div className="col-start-6 col-span-7 row-start-7 row-span-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3 flex flex-col min-h-0">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)] px-1 pb-2 shrink-0">
            Moments
          </p>
          <div className="grid grid-cols-4 grid-rows-2 gap-2 flex-1 min-h-0">
            {outings.slice(0, 8).map((o) => (
              <div key={o.id} className="relative rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={o.photo}
                  alt={o.cafe}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
