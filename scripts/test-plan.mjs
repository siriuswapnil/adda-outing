// Quick sanity check: run `node scripts/test-plan.mjs`
import { readFileSync } from "node:fs";

const cafes = JSON.parse(
  readFileSync(new URL("../data/cafes.json", import.meta.url), "utf8")
);

function km(a, b) {
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

function midpoint(points) {
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
  };
}

function nearestCafe(p) {
  let best = cafes[0], bestD = Infinity;
  for (const c of cafes) {
    const d = km(p, c);
    if (d < bestD) { bestD = d; best = c; }
  }
  return { cafe: best, d: bestD };
}

// 4 friends across Bangalore
const locations = [
  { lat: 12.9352, lng: 77.6245, name: "Aarav (Koramangala)" },
  { lat: 12.9719, lng: 77.6412, name: "Diya (Indiranagar)" },
  { lat: 12.9250, lng: 77.5938, name: "Kabir (Jayanagar)" },
  { lat: 12.9116, lng: 77.6473, name: "Meera (HSR)" },
];

const mid = midpoint(locations);
const { cafe, d } = nearestCafe(mid);

console.log("\n=== Hangout Wrapped — Planning Test ===\n");
console.log("Friends:");
locations.forEach((l) => console.log(`  - ${l.name}  (${l.lat}, ${l.lng})`));
console.log(`\nMidpoint: ${mid.lat.toFixed(4)}, ${mid.lng.toFixed(4)}`);
console.log(`\nRecommended café: ${cafe.name} (${cafe.neighborhood})`);
console.log(`  ${d.toFixed(2)} km from midpoint`);
console.log("\nTravel distances per friend:");
locations.forEach((l) =>
  console.log(`  - ${l.name}: ${km(l, cafe).toFixed(2)} km`)
);
console.log("");
