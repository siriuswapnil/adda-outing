import cafes from "@/data/cafes.json";

export type LatLng = { lat: number; lng: number };
export type Cafe = {
  name: string;
  neighborhood: string;
  lat: number;
  lng: number;
  photo: string;
  vibe: string;
};

// Haversine distance in km
export function km(a: LatLng, b: LatLng) {
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

// Geometric centroid of N points
export function geometricMidpoint(points: LatLng[]): LatLng {
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  return { lat, lng };
}

// Top N cafés ranked by distance from a point
export function topCafes(point: LatLng, n = 3): { cafe: Cafe; distanceKm: number }[] {
  return (cafes as Cafe[])
    .map((c) => ({ cafe: c, distanceKm: km(point, c) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, n);
}

// Full planning function — returns top 3 café suggestions
export function planMeeting(locations: LatLng[]) {
  const midpoint = geometricMidpoint(locations);
  const suggestions = topCafes(midpoint, 3).map((s) => {
    const travelDistances = locations.map((loc) => km(loc, s.cafe));
    return {
      cafe: s.cafe,
      distanceFromMidpointKm: s.distanceKm,
      travelDistancesKm: travelDistances,
      maxTravelKm: Math.max(...travelDistances),
      avgTravelKm:
        travelDistances.reduce((a, b) => a + b, 0) / travelDistances.length,
    };
  });
  return { midpoint, suggestions };
}
