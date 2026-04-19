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
  const results = await searchGeocode(query, 1);
  return results[0] ?? null;
}

export async function searchGeocode(
  query: string,
  limit = 5,
  signal?: AbortSignal
): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];
  const biased = `${query}, Bangalore`;
  const url =
    `https://nominatim.openstreetmap.org/search?` +
    new URLSearchParams({
      q: biased,
      format: "json",
      limit: String(limit),
      viewbox: VIEWBOX,
      bounded: "1",
      countrycodes: "in",
      addressdetails: "0",
    }).toString();

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    return data.map((hit) => ({
      lat: parseFloat(hit.lat),
      lng: parseFloat(hit.lon),
      displayName: hit.display_name,
    }));
  } catch {
    return [];
  }
}
