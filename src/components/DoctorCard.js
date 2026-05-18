import { icon } from "./icons.js";
import { formatDistance } from "../utils/location.js";
import { getDoctorQueueSummary } from "../utils/queue.js";

export function DoctorCard({ state, doctor, clinic, distance }) {
  const queue = getDoctorQueueSummary(state, doctor.id);
  const availabilityLabel = !doctor.available
    ? "Unavailable"
    : doctor.availableToday
      ? "Available today"
      : "Next visit";
  const slots = doctor.slots
    .slice(0, 3)
    .map((slot) => `<span class="slot-chip">${slot.time}</span>`)
    .join("");

  return `
    <article class="doctor-card ${doctor.available ? "" : "is-muted"}" data-doctor-card="${doctor.id}">
      <div class="doctor-card__top">
        <div>
          <div class="doctor-card__avatar">${doctor.name.split(" ").slice(1, 2).join("").slice(0, 1)}</div>
        </div>
        <div class="doctor-card__main">
          <div class="doctor-card__heading">
            <div>
              <h3>${doctor.name}</h3>
              <p>${doctor.specialty}</p>
            </div>
            <span class="status-pill ${doctor.available && doctor.availableToday ? "status-pill--green" : "status-pill--red"}">
              ${availabilityLabel}
            </span>
          </div>
          <div class="doctor-meta">
            <span>${icon("mapPin")} ${clinic.name}</span>
            <span>${formatDistance(distance)}</span>
            <span>${doctor.experience} yrs exp</span>
          </div>
        </div>
      </div>
      <div class="doctor-card__stats">
        <div>
          <span class="stat-label">Now serving</span>
          <strong>${queue.currentOngoingNumber}</strong>
        </div>
        <div>
          <span class="stat-label">Wait</span>
          <strong>${queue.estimatedWaitForNext} min</strong>
        </div>
        <div>
          <span class="stat-label">Fee</span>
          <strong>Rs ${doctor.fee}</strong>
        </div>
      </div>
      <div class="doctor-card__bottom">
        <div class="rating-line">${icon("star")} <strong>${doctor.rating}</strong> <span>${doctor.reviewCount} reviews</span></div>
        <div class="slot-row">${doctor.availableToday ? slots : `<span class="slot-chip">${doctor.nextAvailable}</span>`}</div>
      </div>
      <button class="button button--primary button--full" data-action="select-doctor" data-doctor-id="${doctor.id}">
        View queue and book ${icon("arrowRight")}
      </button>
    </article>
  `;
}
