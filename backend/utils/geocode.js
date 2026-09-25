/**
 * Forward geocoding via OpenStreetMap Nominatim (free, no API key).
 * Converts an address string into { lat, lng } so donations can be
 * located on a map / queried by distance. Falls back to null on failure.
 */
const geocodeAddress = async (address) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FoodBridge/1.0 (food donation network)' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.length) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
};

module.exports = { geocodeAddress };
