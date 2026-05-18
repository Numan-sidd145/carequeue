import { buildMapPoints, formatDistance } from "../utils/location.js";
import { isGoogleMapsConfigured } from "../services/googleMaps.js";

export function MapView({ doctors, userLocation }) {
  const points = buildMapPoints(doctors, userLocation);
  const mapsReady = isGoogleMapsConfigured();
  return `
    <section class="map-panel">
      ${
        mapsReady
          ? `<div class="google-map-canvas" data-google-map aria-label="Google map of nearby doctors"></div>`
          : fallbackMap(points)
      }
      <div class="map-legend">
        ${points
          .slice(0, 4)
          .map(
            (item, index) => `
              <button data-action="select-doctor" data-doctor-id="${item.doctor.id}">
                <span>${index + 1}</span>
                <strong>${item.doctor.name.replace("Dr. ", "")}</strong>
                <small>${formatDistance(item.distance)}</small>
              </button>
            `
          )
          .join("")}
      </div>
      <div class="map-provider">
        ${mapsReady ? "Powered by Google Maps" : "Fallback map active. Add a Google Maps key in Admin."}
      </div>
    </section>
  `;
}

function fallbackMap(points) {
  return `
    <div class="map-canvas" aria-label="Nearby doctors map">
      <div class="map-grid"></div>
      <div class="map-user" style="left: 50%; top: 50%;">You</div>
      ${points
        .map(
          (item, index) => `
            <button
              class="map-pin ${item.doctor.available ? "" : "is-muted"}"
              style="left:${item.x}%;top:${item.y}%;"
              data-action="select-doctor"
              data-doctor-id="${item.doctor.id}"
              title="${item.doctor.name}"
            >
              ${index + 1}
            </button>
          `
        )
        .join("")}
    </div>
  `;
}
