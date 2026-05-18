export function distanceInKm(a, b) {
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function toRad(value) {
  return (value * Math.PI) / 180;
}

export function findLocationBySearch(locations, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;
  return locations.find((location) => {
    const text = `${location.label} ${location.city} ${location.area}`.toLowerCase();
    return text.includes(normalized);
  });
}

export function fallbackManualLocation(locations, query, currentLocation) {
  const existing = findLocationBySearch(locations, query);
  if (existing) return existing;
  const normalized = query.trim();
  const lower = normalized.toLowerCase();
  const knownAreas = [
    {
      area: "MG Road",
      city: "Bengaluru",
      lat: 12.9757,
      lng: 77.6053,
      keywords: ["mg road", "mahatma gandhi road"],
    },
    {
      area: "Jayanagar",
      city: "Bengaluru",
      lat: 12.925,
      lng: 77.5938,
      keywords: ["jayanagar"],
    },
    {
      area: "HSR Layout",
      city: "Bengaluru",
      lat: 12.9116,
      lng: 77.6389,
      keywords: ["hsr", "hsr layout"],
    },
    {
      area: "Electronic City",
      city: "Bengaluru",
      lat: 12.8399,
      lng: 77.677,
      keywords: ["electronic city", "electronics city"],
    },
  ];
  const known = knownAreas.find((location) =>
    location.keywords.some((keyword) => lower.includes(keyword))
  );
  if (known) {
    return {
      id: `manual-${Date.now()}`,
      label: `${known.area}, ${known.city}`,
      area: known.area,
      city: known.city,
      lat: known.lat,
      lng: known.lng,
      source: "Local estimate",
    };
  }

  return {
    id: `manual-${Date.now()}`,
    label: normalized,
    area: normalized,
    city: currentLocation.city || "Manual location",
    lat: currentLocation.lat,
    lng: currentLocation.lng,
    source: "Manual label",
  };
}

export function buildMapPoints(doctorsWithClinics, userLocation) {
  const lats = doctorsWithClinics.map((item) => item.clinic.lat).concat(userLocation.lat);
  const lngs = doctorsWithClinics.map((item) => item.clinic.lng).concat(userLocation.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;

  return doctorsWithClinics.map((item) => ({
    ...item,
    x: 8 + ((item.clinic.lng - minLng) / lngRange) * 84,
    y: 92 - ((item.clinic.lat - minLat) / latRange) * 84,
  }));
}
