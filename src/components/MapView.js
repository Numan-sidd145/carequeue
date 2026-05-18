import { buildMapPoints, formatDistance } from "../utils/location.js";

export function MapView({ doctors, userLocation }) {
  const points = buildMapPoints(doctors, userLocation);
  return `
    <section class="map-panel">
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
    </section>
  `;
}
