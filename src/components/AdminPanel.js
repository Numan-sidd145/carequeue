import { statusOrder } from "../utils/queue.js";

export function AdminPanel({ state }) {
  const draft = state.ui.adminDraft;
  const specialties = state.doctors
    .map((doctor) => doctor.specialty)
    .filter((value, index, list) => list.indexOf(value) === index);

  return `
    <section class="panel">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Doctor panel</span>
          <h2>Schedule and queue management</h2>
        </div>
        <button class="button button--ghost" data-action="reset-demo">Reset seed data</button>
      </div>
      <div class="admin-create">
        <div class="form-grid">
          <label>
            <span>Doctor name</span>
            <input placeholder="Dr. Priya Sen" value="${draft.name}" data-action="admin-input" data-field="name" />
            ${state.ui.errors.adminName ? `<small class="field-error">${state.ui.errors.adminName}</small>` : ""}
          </label>
          <label>
            <span>Specialty</span>
            <input list="specialty-list" value="${draft.specialty}" data-action="admin-input" data-field="specialty" />
            <datalist id="specialty-list">
              ${specialties.map((specialty) => `<option value="${specialty}"></option>`).join("")}
            </datalist>
            ${state.ui.errors.adminSpecialty ? `<small class="field-error">${state.ui.errors.adminSpecialty}</small>` : ""}
          </label>
          <label>
            <span>Clinic</span>
            <select data-action="admin-input" data-field="clinicId">
              ${state.clinics
                .map(
                  (clinic) =>
                    `<option value="${clinic.id}" ${draft.clinicId === clinic.id ? "selected" : ""}>${clinic.name}</option>`
                )
                .join("")}
            </select>
          </label>
          <label>
            <span>Gender</span>
            <select data-action="admin-input" data-field="gender">
              ${["Female", "Male", "Non-binary"]
                .map(
                  (gender) =>
                    `<option value="${gender}" ${draft.gender === gender ? "selected" : ""}>${gender}</option>`
                )
                .join("")}
            </select>
          </label>
          <label>
            <span>Language</span>
            <input value="${draft.language}" data-action="admin-input" data-field="language" />
          </label>
          <label>
            <span>Fee</span>
            <input type="number" min="1" value="${draft.fee}" data-action="admin-input" data-field="fee" />
            ${state.ui.errors.adminFee ? `<small class="field-error">${state.ui.errors.adminFee}</small>` : ""}
          </label>
          <label>
            <span>First slot</span>
            <input value="${draft.firstSlot}" data-action="admin-input" data-field="firstSlot" />
            ${state.ui.errors.adminSlot ? `<small class="field-error">${state.ui.errors.adminSlot}</small>` : ""}
          </label>
        </div>
        <button class="button button--primary" data-action="add-doctor">Add doctor</button>
      </div>
      <div class="admin-grid">
        ${state.doctors
          .map((doctor) => {
            const clinic = state.clinics.find((item) => item.id === doctor.clinicId);
            const queue = state.queueStatuses.find((item) => item.doctorId === doctor.id);
            const slotDraft = draft.slotDrafts[doctor.id] || "";
            const appointments = state.appointments
              .filter((item) => item.doctorId === doctor.id && item.date === state.today)
              .sort((a, b) => a.queueNumber - b.queueNumber);
            return `
              <article class="admin-card">
                <div class="admin-card__head">
                  <div>
                    <h3>${doctor.name}</h3>
                    <p>${doctor.specialty} · ${clinic.name}</p>
                  </div>
                  <button class="button ${doctor.available ? "button--ghost" : "button--primary"}" data-action="toggle-doctor" data-doctor-id="${doctor.id}">
                    ${doctor.available ? "Make unavailable" : "Make available"}
                  </button>
                </div>
                <div class="admin-stats">
                  <label>Fee <input type="number" min="1" value="${doctor.fee}" data-action="doctor-field" data-doctor-id="${doctor.id}" data-field="fee" /></label>
                  <label>Avg <input type="number" min="1" value="${queue.averageConsultationMinutes}" data-action="queue-field" data-doctor-id="${doctor.id}" data-field="averageConsultationMinutes" /></label>
                  <label>Delay <input type="number" min="0" value="${queue.runningLateMinutes}" data-action="queue-field" data-doctor-id="${doctor.id}" data-field="runningLateMinutes" /></label>
                </div>
                <div class="slot-admin">
                  <input placeholder="HH:MM" value="${slotDraft}" data-action="slot-draft" data-doctor-id="${doctor.id}" />
                  <button class="button button--secondary" data-action="add-slot" data-doctor-id="${doctor.id}">Add slot</button>
                </div>
                <div class="admin-appointments">
                  ${appointments
                    .map(
                      (appointment) => `
                        <div class="admin-row">
                          <div>
                            <strong>${appointment.queueNumber}</strong>
                            <span>${appointment.bookingNumber}</span>
                          </div>
                          <select data-action="status-change" data-appointment-id="${appointment.id}">
                            ${statusOrder
                              .map(
                                (status) =>
                                  `<option value="${status}" ${appointment.status === status ? "selected" : ""}>${status}</option>`
                              )
                              .join("")}
                          </select>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}
