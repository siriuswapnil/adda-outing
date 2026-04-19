// Thin wrapper around OpenStreetMap Nominatim.
// Bangalore-biased search, no API key.

export type GeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
};

// Bangalore bounding box (lon_min, lat_max, lon_max, lat_min)
const VIEWBOX = "77.40,13.20,77.90,12.70";

export async function geocode(query: string): Promise<GeocodeResult | null> {
  if (!query.trim()) return null;
  const biased = `${query}, Bangalore`;
  const url =
    `https://nominatim.openstreetmap.org/search?` +
    new URLSearchParams({
      q: biased,
      format: "json",
      limit: "1",
      viewbox: VIEWBOX,
      bounded: "1",
      countrycodes: "in",
    }).toString();

  try {
    const res = await fetch(url, {
      headers: {
        // Nominatim ToS requires a UA; browsers set this automatically
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    if (!data.length) return null;
    const hit = data[0];
    return {
      lat: parseFloat(hit.lat),
      lng: parseFloat(hit.lon),
      displayName: hit.display_name,
    };
  } catch {
    return null;
  }
}
