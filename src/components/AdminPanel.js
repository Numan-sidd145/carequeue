import { statusOrder } from "../utils/queue.js";

export function AdminPanel({ state }) {
  const draft = state.ui.adminDraft;
  const maps = state.ui.mapsSettings;
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
      <section class="admin-settings">
        <div>
          <span class="eyebrow">Platform settings</span>
          <h3>Google Maps</h3>
          <p>Use a browser API key restricted to this website domain.</p>
        </div>
        <div class="form-grid account-grid">
          <label>
            <span>Google Maps API key</span>
            <input type="password" value="${maps.apiKey}" placeholder="AIza..." data-action="maps-input" data-field="apiKey" />
          </label>
          <label>
            <span>Map ID optional</span>
            <input value="${maps.mapId}" placeholder="Optional advanced map ID" data-action="maps-input" data-field="mapId" />
          </label>
        </div>
        <div class="action-row">
          <button class="button button--primary" data-action="save-maps-settings">Save Maps settings</button>
          <button class="button button--ghost" data-action="clear-maps-settings">Clear</button>
        </div>
      </section>
      <div class="admin-create">
        <div class="onboarding-banner">
          <div>
            <span class="eyebrow">Onboarding</span>
            <h3>Add doctor profile</h3>
            <p>Admins can maintain records directly, or invite a doctor-admin account to manage the profile.</p>
          </div>
          <div class="segmented-control" role="group" aria-label="Onboarding mode">
            <button class="${draft.onboardingMode === "admin" ? "is-selected" : ""}" data-action="admin-mode" data-mode="admin">Admin managed</button>
            <button class="${draft.onboardingMode === "doctor" ? "is-selected" : ""}" data-action="admin-mode" data-mode="doctor">Doctor access</button>
          </div>
        </div>
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
            <span>Clinic setup</span>
            <select data-action="admin-input" data-field="clinicMode">
              <option value="existing" ${draft.clinicMode === "existing" ? "selected" : ""}>Use existing clinic</option>
              <option value="new" ${draft.clinicMode === "new" ? "selected" : ""}>Create new clinic</option>
            </select>
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
          ${
            draft.clinicMode === "new"
              ? `
                <label>
                  <span>Clinic name</span>
                  <input value="${draft.clinicName}" data-action="admin-input" data-field="clinicName" />
                  ${state.ui.errors.adminClinicName ? `<small class="field-error">${state.ui.errors.adminClinicName}</small>` : ""}
                </label>
                <label>
                  <span>Clinic address</span>
                  <input value="${draft.clinicAddress}" data-action="admin-input" data-field="clinicAddress" />
                  ${state.ui.errors.adminClinicAddress ? `<small class="field-error">${state.ui.errors.adminClinicAddress}</small>` : ""}
                </label>
                <label>
                  <span>Area</span>
                  <input value="${draft.clinicArea}" data-action="admin-input" data-field="clinicArea" />
                </label>
                <label>
                  <span>City</span>
                  <input value="${draft.clinicCity}" data-action="admin-input" data-field="clinicCity" />
                </label>
                <label>
                  <span>Latitude</span>
                  <input value="${draft.clinicLat}" data-action="admin-input" data-field="clinicLat" />
                </label>
                <label>
                  <span>Longitude</span>
                  <input value="${draft.clinicLng}" data-action="admin-input" data-field="clinicLng" />
                </label>
                <div class="form-grid__wide action-row action-row--left">
                  <button class="button button--secondary" data-action="geocode-clinic">Find clinic on Google Maps</button>
                  ${state.ui.errors.adminClinicGeo ? `<small class="field-error">${state.ui.errors.adminClinicGeo}</small>` : ""}
                </div>
              `
              : ""
          }
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
          ${
            draft.onboardingMode === "doctor"
              ? `
                <label>
                  <span>Account owner</span>
                  <input value="${draft.ownerName}" data-action="admin-input" data-field="ownerName" />
                  ${state.ui.errors.adminOwnerName ? `<small class="field-error">${state.ui.errors.adminOwnerName}</small>` : ""}
                </label>
                <label>
                  <span>Owner phone</span>
                  <input value="${draft.ownerPhone}" data-action="admin-input" data-field="ownerPhone" />
                  ${state.ui.errors.adminOwnerPhone ? `<small class="field-error">${state.ui.errors.adminOwnerPhone}</small>` : ""}
                </label>
                <label>
                  <span>Owner email</span>
                  <input value="${draft.ownerEmail}" data-action="admin-input" data-field="ownerEmail" />
                </label>
              `
              : ""
          }
        </div>
        <button class="button button--primary" data-action="add-doctor">Add doctor</button>
      </div>
      <div class="access-list">
        <span class="eyebrow">Doctor access accounts</span>
        ${state.doctorAccess
          .map(
            (access) => `
              <div class="access-row">
                <strong>${access.ownerName}</strong>
                <span>${access.role}</span>
                <span>${access.phone}</span>
                <span>${access.status}</span>
              </div>
            `
          )
          .join("")}
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
