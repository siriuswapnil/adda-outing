import outings from "@/data/outings.json";

// Bangalore bounding box that frames our pins
const BBOX = {
  minLat: 12.89,
  maxLat: 13.0,
  minLng: 77.55,
  maxLng: 77.68,
};

// Slippy-map tile math
function lngToTileX(lng: number, z: number) {
  return ((lng + 180) / 360) * Math.pow(2, z);
}
function latToTileY(lat: number, z: number) {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, z)
  );
}

const ZOOM = 12;

// Pre-compute tile pixel bounds so we can position pins over the grid
const TILE_SIZE = 256;
const tileXMin = Math.floor(lngToTileX(BBOX.minLng, ZOOM));
const tileXMax = Math.floor(lngToTileX(BBOX.maxLng, ZOOM));
const tileYMin = Math.floor(latToTileY(BBOX.maxLat, ZOOM));
const tileYMax = Math.floor(latToTileY(BBOX.minLat, ZOOM));

const COLS = tileXMax - tileXMin + 1;
const ROWS = tileYMax - tileYMin + 1;

// Total grid pixel size
const GRID_W = COLS * TILE_SIZE;
const GRID_H = ROWS * TILE_SIZE;

// Project lat/lng → pixel position within grid → %
function project(lat: number, lng: number) {
  const px = (lngToTileX(lng, ZOOM) - tileXMin) * TILE_SIZE;
  const py = (latToTileY(lat, ZOOM) - tileYMin) * TILE_SIZE;
  return { x: (px / GRID_W) * 100, y: (py / GRID_H) * 100 };
}

// OpenStreetMap standard tiles — no key needed
function tileUrl(x: number, y: number, z: number) {
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

export default function BangaloreMap() {
  const tiles: { x: number; y: number; url: string }[] = [];
  for (let ty = tileYMin; ty <= tileYMax; ty++) {
    for (let tx = tileXMin; tx <= tileXMax; tx++) {
      tiles.push({ x: tx - tileXMin, y: ty - tileYMin, url: tileUrl(tx, ty, ZOOM) });
    }
  }

  const pins = outings.map((o) => ({
    ...project(o.lat, o.lng),
    id: o.id,
    cafe: o.cafe,
    neighborhood: o.neighborhood,
    date: o.date,
  }));

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-[var(--card)]">
      {/* Tile grid, scaled to fill container */}
      <div
        className="absolute inset-0"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
      >
        {tiles.map((t, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={t.url}
            alt=""
            className="w-full h-full object-cover"
            style={{
              gridColumnStart: t.x + 1,
              gridRowStart: t.y + 1,
              filter: "sepia(0.35) saturate(0.9) brightness(1.02)",
            }}
            loading="eager"
          />
        ))}
      </div>

      {/* Pins */}
      <div className="absolute inset-0">
        {pins.map((p) => {
          const prettyDate = new Date(p.date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          });
          return (
            <div
              key={p.id}
              className="absolute group cursor-pointer"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="relative">
                <div className="absolute w-6 h-6 -left-3 -top-3 rounded-full bg-[var(--accent)] opacity-25 group-hover:opacity-60 group-hover:scale-125 transition-all" />
                <div className="w-3 h-3 rounded-full bg-[var(--accent)] border-2 border-white shadow group-hover:scale-125 transition-transform" />
              </div>

              {/* Tooltip */}
              <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-[var(--foreground)] text-[var(--card)] text-[11px] px-2.5 py-1 rounded-md whitespace-nowrap shadow-lg">
                  <span className="font-medium">{p.cafe}</span>
                  <span className="opacity-60 ml-1.5">· {prettyDate}</span>
                </div>
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[var(--foreground)] mx-auto" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Label */}
      <div className="absolute bottom-2 left-2 text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] bg-[var(--card)]/85 px-2 py-1 rounded">
        Bengaluru · {outings.length} pins
      </div>
    </div>
  );
}
