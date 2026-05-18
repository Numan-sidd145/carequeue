import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_MAP_ID } from "../config.js";

let mapsPromise = null;
let geocoderPromise = null;

export function getGoogleMapsApiKey() {
  return normalizeGoogleMapsApiKey(
    window.CAREQUEUE_GOOGLE_MAPS_API_KEY ||
      window.localStorage.getItem("carequeue-google-maps-api-key") ||
      GOOGLE_MAPS_API_KEY ||
      ""
  );
}

export function getGoogleMapsMapId() {
  return (
    window.CAREQUEUE_GOOGLE_MAPS_MAP_ID ||
    window.localStorage.getItem("carequeue-google-maps-map-id") ||
    GOOGLE_MAPS_MAP_ID ||
    ""
  ).trim();
}

export function isGoogleMapsConfigured() {
  return Boolean(getGoogleMapsApiKey());
}

export function normalizeGoogleMapsApiKey(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    return normalizeGoogleMapsApiKey(url.searchParams.get("key") || raw);
  } catch {
    // The value may be just a query string or a raw key.
  }

  const keyParam = raw.match(/(?:^|[?&])key=([^&]+)/);
  if (keyParam) return decodeURIComponent(keyParam[1]).trim();

  const keyLike = raw.match(/AIza[0-9A-Za-z_-]+/);
  if (keyLike) return keyLike[0];

  return raw.split(/[&#?]/)[0].trim();
}

export function saveGoogleMapsSettings(apiKey, mapId = "") {
  window.localStorage.setItem("carequeue-google-maps-api-key", normalizeGoogleMapsApiKey(apiKey));
  window.localStorage.setItem("carequeue-google-maps-map-id", mapId.trim());
  document.querySelector("script[data-carequeue-google-maps]")?.remove();
  window.__carequeueGoogleMapsAuthError = "";
  mapsPromise = null;
  geocoderPromise = null;
}

export function clearGoogleMapsSettings() {
  window.localStorage.removeItem("carequeue-google-maps-api-key");
  window.localStorage.removeItem("carequeue-google-maps-map-id");
  document.querySelector("script[data-carequeue-google-maps]")?.remove();
  window.__carequeueGoogleMapsAuthError = "";
  mapsPromise = null;
  geocoderPromise = null;
}

export async function loadGoogleMaps() {
  if (!isGoogleMapsConfigured()) {
    throw new Error("Google Maps API key is not configured.");
  }
  if (window.google?.maps?.importLibrary) return window.google.maps;
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-carequeue-google-maps]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google.maps), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Google Maps.")), {
        once: true,
      });
      return;
    }

    window.__carequeueGoogleMapsAuthError = "";
    window.gm_authFailure = () => {
      window.__carequeueGoogleMapsAuthError =
        "Google Maps rejected this API key. Enable billing, enable Maps JavaScript API, and check website restrictions.";
    };

    const script = document.createElement("script");
    script.dataset.carequeueGoogleMaps = "true";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      getGoogleMapsApiKey()
    )}&v=weekly&libraries=places,marker&loading=async`;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error("Unable to load Google Maps."));
    document.head.appendChild(script);
  });

  return mapsPromise;
}

export async function geocodeAddress(address) {
  const query = address.trim();
  if (!query) throw new Error("Enter a location to search.");

  const maps = await loadGoogleMaps();
  if (!geocoderPromise) {
    geocoderPromise = maps.importLibrary("geocoding").then(({ Geocoder }) => new Geocoder());
  }
  const geocoder = await geocoderPromise;
  const response = await geocoder.geocode({ address: query });
  const result = response.results?.[0];
  if (!result) throw new Error("We could not find that location.");

  const latLng = result.geometry.location;
  const components = result.address_components || [];
  const area =
    componentFor(components, "sublocality_level_1") ||
    componentFor(components, "locality") ||
    result.formatted_address.split(",")[0];
  const city =
    componentFor(components, "locality") ||
    componentFor(components, "administrative_area_level_2") ||
    "Selected area";

  return {
    id: `manual-${Date.now()}`,
    label: result.formatted_address,
    area,
    city,
    address: result.formatted_address,
    lat: typeof latLng.lat === "function" ? latLng.lat() : latLng.lat,
    lng: typeof latLng.lng === "function" ? latLng.lng() : latLng.lng,
    source: "Google Maps",
  };
}

export async function renderGoogleDoctorMap(container, userLocation, doctors) {
  const maps = await loadGoogleMaps();
  throwIfAuthError();
  const [{ Map }, markerLibrary] = await Promise.all([
    maps.importLibrary("maps"),
    maps.importLibrary("marker"),
  ]);
  throwIfAuthError();
  const { AdvancedMarkerElement } = markerLibrary;
  const mapId = getGoogleMapsMapId();
  const map = new Map(container, {
    center: { lat: userLocation.lat, lng: userLocation.lng },
    zoom: 12,
    mapId: mapId || undefined,
    clickableIcons: false,
    fullscreenControl: false,
    mapTypeControl: false,
    streetViewControl: false,
  });
  const bounds = new maps.LatLngBounds();
  bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });

  placeMarker({
    maps,
    AdvancedMarkerElement,
    map,
    mapId,
    position: { lat: userLocation.lat, lng: userLocation.lng },
    title: "Your selected location",
    label: "You",
    className: "map-marker-user",
  });

  doctors.forEach((item, index) => {
    const position = { lat: item.clinic.lat, lng: item.clinic.lng };
    bounds.extend(position);
    const marker = placeMarker({
      maps,
      AdvancedMarkerElement,
      map,
      mapId,
      position,
      title: item.doctor.name,
      label: String(index + 1),
      className: item.doctor.available ? "map-marker" : "map-marker-muted",
    });
    marker.addListener("click", () => {
      document
        .querySelector(`[data-action="select-doctor"][data-doctor-id="${item.doctor.id}"]`)
        ?.click();
    });
  });

  map.fitBounds(bounds, 64);
  await waitForGoogleAuth();
  throwIfAuthError();
  return map;
}

function componentFor(components, type) {
  return components.find((component) => component.types?.includes(type))?.long_name || "";
}

function markerNode(label, className) {
  const node = document.createElement("div");
  node.className = className;
  node.textContent = label;
  return node;
}

function placeMarker({ maps, AdvancedMarkerElement, map, mapId, position, title, label, className }) {
  if (mapId && AdvancedMarkerElement) {
    return new AdvancedMarkerElement({
      map,
      position,
      title,
      content: markerNode(label, className),
    });
  }

  return new maps.Marker({
    map,
    position,
    title,
    label: label.length <= 2 ? label : undefined,
  });
}

function throwIfAuthError() {
  if (window.__carequeueGoogleMapsAuthError) {
    throw new Error(window.__carequeueGoogleMapsAuthError);
  }
}

function waitForGoogleAuth() {
  return new Promise((resolve) => window.setTimeout(resolve, 800));
}
