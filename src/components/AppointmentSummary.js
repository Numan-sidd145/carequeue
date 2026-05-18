import { icon } from "./icons.js";
import { getAppointmentDerivedDetails } from "../utils/queue.js";

export function AppointmentSummary({ state, appointment, doctor, clinic, showActions = true }) {
  const details = getAppointmentDerivedDetails(state, appointment);
  return `
    <article class="appointment-summary">
      <div class="appointment-summary__head">
        <div>
          <span class="eyebrow">${appointment.status}</span>
          <h3>${doctor.name}</h3>
          <p>${doctor.specialty} at ${clinic.name}</p>
        </div>
        <span class="status-pill">${appointment.time}</span>
      </div>
      <div class="summary-grid">
        <div>
          <span>Booking number</span>
          <strong>${appointment.bookingNumber}</strong>
        </div>
        <div>
          <span>Queue number</span>
          <strong>${appointment.queueNumber}</strong>
        </div>
        <div>
          <span>Ongoing number</span>
          <strong>${details.currentOngoingNumber}</strong>
        </div>
        <div>
          <span>People ahead</span>
          <strong>${details.peopleAhead}</strong>
        </div>
      </div>
      <div class="appointment-summary__footer">
        <span>${icon("clock")} ${details.estimatedWait} min estimated wait</span>
        ${
          showActions
            ? `
              <div class="action-row">
                <button class="button button--ghost" data-action="track-appointment" data-appointment-id="${appointment.id}">Track</button>
                ${
                  appointment.status !== "Cancelled" && appointment.status !== "Completed"
                    ? `<button class="button button--danger" data-action="cancel-appointment" data-appointment-id="${appointment.id}">Cancel</button>`
                    : ""
                }
              </div>
            `
            : ""
        }
      </div>
    </article>
  `;
}
