import { icon } from "./icons.js";
import {
  activeStatuses,
  getAppointmentDerivedDetails,
  getDoctorQueueSummary,
  getTodayDoctorAppointments,
} from "../utils/queue.js";

export function QueueTracker({ state, doctor, appointment = null, compact = false }) {
  const queue = getDoctorQueueSummary(state, doctor.id);
  const derived = appointment ? getAppointmentDerivedDetails(state, appointment) : null;
  const todayAppointments = getTodayDoctorAppointments(state, doctor.id)
    .filter((item) => activeStatuses.includes(item.status))
    .slice(0, 6);

  return `
    <section class="panel queue-panel">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Live queue</span>
          <h2>${doctor.name}</h2>
        </div>
        <button class="icon-button" data-action="complete-next" data-doctor-id="${doctor.id}" title="Complete next appointment">
          ${icon("activity")}
        </button>
      </div>
      <div class="queue-numbers">
        <div class="queue-number-card">
          <span>Ongoing appointment</span>
          <strong>${queue.currentOngoingNumber}</strong>
        </div>
        <div class="queue-number-card">
          <span>Waiting</span>
          <strong>${queue.waitingCount}</strong>
        </div>
        <div class="queue-number-card">
          <span>Delay</span>
          <strong>${queue.runningLateMinutes} min</strong>
        </div>
      </div>
      ${
        appointment
          ? `
            <div class="your-turn">
              <div>
                <span>Your queue number</span>
                <strong>${appointment.queueNumber}</strong>
              </div>
              <div>
                <span>People ahead</span>
                <strong>${derived.peopleAhead}</strong>
              </div>
              <div>
                <span>Estimated wait</span>
                <strong>${derived.estimatedWait} min</strong>
              </div>
            </div>
          `
          : ""
      }
      ${
        compact
          ? ""
          : `
            <div class="queue-list">
              ${todayAppointments
                .map(
                  (item) => `
                    <div class="queue-row ${appointment?.id === item.id ? "is-current-user" : ""}">
                      <span class="queue-row__number">${item.queueNumber}</span>
                      <span>${item.bookingNumber}</span>
                      <span class="status-text">${item.status}</span>
                    </div>
                  `
                )
                .join("")}
            </div>
          `
      }
    </section>
  `;
}
