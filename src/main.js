import { actions, subscribe } from "./state/store.js";
import { DoctorCard } from "./components/DoctorCard.js";
import { SlotPicker } from "./components/SlotPicker.js";
import { QueueTracker } from "./components/QueueTracker.js";
import { AppointmentSummary } from "./components/AppointmentSummary.js";
import { MapView } from "./components/MapView.js";
import { ProfilePanel } from "./components/ProfilePanel.js";
import { AdminPanel } from "./components/AdminPanel.js";
import { AuthPanel } from "./components/AuthPanel.js";
import { icon } from "./components/icons.js";
import { distanceInKm, fallbackManualLocation, formatDistance } from "./utils/location.js";
import { getDoctorQueueSummary } from "./utils/queue.js";
import {
  clearGoogleMapsSettings,
  geocodeAddress,
  getGoogleMapsApiKey,
  getGoogleMapsMapId,
  isGoogleMapsConfigured,
  renderGoogleDoctorMap,
  saveGoogleMapsSettings,
} from "./services/googleMaps.js";

const app = document.querySelector("#app");

function currentUser(state) {
  return state.users.find((user) => user.id === state.currentUserId);
}

function currentLocation(state) {
  return (
    state.detectedLocation ||
    state.locations.find((location) => location.id === state.selectedLocationId) ||
    state.locations[0]
  );
}

function clinicFor(state, doctor) {
  return state.clinics.find((clinic) => clinic.id === doctor.clinicId);
}

function doctorFor(state, appointment) {
  return state.doctors.find((doctor) => doctor.id === appointment.doctorId);
}

function doctorsWithDistance(state) {
  const location = currentLocation(state);
  return state.doctors
    .map((doctor) => {
      const clinic = clinicFor(state, doctor);
      return {
        doctor,
        clinic,
        distance: distanceInKm(location, clinic),
        queue: getDoctorQueueSummary(state, doctor.id),
      };
    })
    .filter((item) => doctorMatchesFilters(state, item))
    .sort((a, b) => {
      if (a.doctor.available !== b.doctor.available) return a.doctor.available ? -1 : 1;
      if (a.doctor.availableToday !== b.doctor.availableToday) return a.doctor.availableToday ? -1 : 1;
      return a.distance - b.distance;
    });
}

function doctorMatchesFilters(state, item) {
  const filters = state.filters;
  const searchText = `${item.doctor.name} ${item.doctor.specialty} ${item.clinic.name} ${item.clinic.type}`.toLowerCase();
  const searchPass = !filters.search || searchText.includes(filters.search.toLowerCase());
  const distancePass =
    filters.distance === "all" || item.distance <= Number(filters.distance);
  const todayPass = !filters.availabilityToday || item.doctor.availableToday;
  const feePass = filters.maxFee === "all" || item.doctor.fee <= Number(filters.maxFee);
  const ratingPass =
    filters.minRating === "all" || item.doctor.rating >= Number(filters.minRating);
  const genderPass = filters.gender === "all" || item.doctor.gender === filters.gender;
  const languagePass =
    filters.language === "all" || item.doctor.languages.includes(filters.language);
  return searchPass && distancePass && todayPass && feePass && ratingPass && genderPass && languagePass;
}

function renderShell(state, page) {
  const unread = state.notifications.filter(
    (notification) => notification.userId === state.currentUserId && !notification.read
  ).length;
  app.innerHTML = `
    <header class="app-header">
      <button class="brand" data-action="navigate" data-view="home" aria-label="CareQueue home">
        <span class="brand-mark">${icon("activity")}</span>
        <span>CareQueue</span>
      </button>
      <nav class="top-nav" aria-label="Primary">
        ${navButton("home", "Find doctors", "search", state.view)}
        ${navButton("appointments", "My appointments", "calendar", state.view)}
        ${navButton("profile", "Profile", "user", state.view)}
        ${navButton("admin", "Admin", "shield", state.view)}
      </nav>
      <button class="notification-button" data-action="mark-notifications-read" title="Notifications">
        ${icon("bell")}
        ${unread ? `<span>${unread}</span>` : ""}
      </button>
    </header>
    <main class="app-main">${page}</main>
    <nav class="bottom-nav" aria-label="Mobile primary">
      ${navButton("home", "Find", "search", state.view)}
      ${navButton("appointments", "Visits", "calendar", state.view)}
      ${navButton("profile", "Profile", "user", state.view)}
      ${navButton("admin", "Admin", "shield", state.view)}
    </nav>
    ${state.ui.toast ? `<div class="toast">${state.ui.toast}</div>` : ""}
  `;
}

function navButton(view, label, iconName, currentView) {
  return `
    <button class="${currentView === view ? "is-active" : ""}" data-action="navigate" data-view="${view}">
      ${icon(iconName)}
      <span>${label}</span>
    </button>
  `;
}

function renderHome(state) {
  const location = currentLocation(state);
  const doctors = doctorsWithDistance(state);
  const languages = state.doctors
    .flatMap((doctor) => doctor.languages)
    .filter((value, index, list) => list.indexOf(value) === index)
    .sort();

  return `
    <section class="home-layout">
      <div class="search-column">
        <section class="search-panel">
          <div class="location-bar">
            <div>
              <span class="eyebrow">Nearby doctors</span>
              <h1>${location.area}, ${location.city}</h1>
              <p class="location-source">${location.source ? `${location.source} location` : "Selected location"}</p>
            </div>
            <button class="button button--ghost" data-action="detect-location">
              ${icon("mapPin")} Detect
            </button>
          </div>
          <div class="search-controls">
            <label class="search-input">
              ${icon("search")}
              <input placeholder="Search doctor, specialty, clinic" value="${state.filters.search}" data-action="filter-input" data-filter="search" />
            </label>
            <select data-action="location-select">
              ${state.locations
                .map(
                  (item) =>
                    `<option value="${item.id}" ${state.selectedLocationId === item.id ? "selected" : ""}>${item.area}</option>`
                )
                .join("")}
            </select>
          </div>
          <div class="manual-location">
            <input placeholder="Enter area, city, or full address" value="${state.ui.locationDraft}" data-action="manual-location-input" />
            <button class="button button--secondary" data-action="manual-location">Use location</button>
          </div>
          ${state.ui.errors.manualLocation ? `<p class="field-error">${state.ui.errors.manualLocation}</p>` : ""}
          ${
            isGoogleMapsConfigured()
              ? `<p class="helper-text">Google Maps geocoding is enabled for manual locations.</p>`
              : `<p class="helper-text">Add a Google Maps API key in Admin for exact address lookup.</p>`
          }
          ${renderFilters(state, languages)}
        </section>
        <div class="result-count">
          <strong>${doctors.length}</strong> doctors sorted by distance and availability
        </div>
        <div class="doctor-list">
          ${doctors
            .map((item) =>
              DoctorCard({
                state,
                doctor: item.doctor,
                clinic: item.clinic,
                distance: item.distance,
              })
            )
            .join("")}
        </div>
      </div>
      <aside class="map-column">
        ${MapView({ doctors, userLocation: location })}
        ${renderNotifications(state)}
      </aside>
    </section>
  `;
}

function renderFilters(state, languages) {
  return `
    <details class="filters" open>
      <summary>${icon("filter")} Filters</summary>
      <div class="filter-grid">
        <label>
          <span>Distance</span>
          <select data-action="filter-input" data-filter="distance">
            ${option("all", "Any distance", state.filters.distance)}
            ${option("2", "Within 2 km", state.filters.distance)}
            ${option("5", "Within 5 km", state.filters.distance)}
            ${option("10", "Within 10 km", state.filters.distance)}
          </select>
        </label>
        <label>
          <span>Fee</span>
          <select data-action="filter-input" data-filter="maxFee">
            ${option("all", "Any fee", state.filters.maxFee)}
            ${option("700", "Up to Rs 700", state.filters.maxFee)}
            ${option("900", "Up to Rs 900", state.filters.maxFee)}
            ${option("1200", "Up to Rs 1200", state.filters.maxFee)}
          </select>
        </label>
        <label>
          <span>Rating</span>
          <select data-action="filter-input" data-filter="minRating">
            ${option("all", "Any rating", state.filters.minRating)}
            ${option("4.5", "4.5+", state.filters.minRating)}
            ${option("4.7", "4.7+", state.filters.minRating)}
            ${option("4.9", "4.9", state.filters.minRating)}
          </select>
        </label>
        <label>
          <span>Gender</span>
          <select data-action="filter-input" data-filter="gender">
            ${option("all", "Any gender", state.filters.gender)}
            ${option("Female", "Female", state.filters.gender)}
            ${option("Male", "Male", state.filters.gender)}
          </select>
        </label>
        <label>
          <span>Language</span>
          <select data-action="filter-input" data-filter="language">
            ${option("all", "Any language", state.filters.language)}
            ${languages.map((language) => option(language, language, state.filters.language)).join("")}
          </select>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" data-action="filter-checkbox" data-filter="availabilityToday" ${state.filters.availabilityToday ? "checked" : ""} />
          <span>Available today</span>
        </label>
        <button class="button button--ghost" data-action="reset-filters">Reset</button>
      </div>
    </details>
  `;
}

function option(value, label, selectedValue) {
  return `<option value="${value}" ${String(value) === String(selectedValue) ? "selected" : ""}>${label}</option>`;
}

function renderNotifications(state) {
  const notifications = state.notifications
    .filter((notification) => notification.userId === state.currentUserId)
    .slice(0, 4);
  return `
    <section class="notifications-panel">
      <div class="section-heading section-heading--compact">
        <h2>Notifications</h2>
        <button class="button button--ghost" data-action="mark-notifications-read">Mark read</button>
      </div>
      ${notifications
        .map(
          (notification) => `
            <article class="notification ${notification.read ? "" : "is-unread"}">
              <strong>${notification.title}</strong>
              <p>${notification.message}</p>
            </article>
          `
        )
        .join("")}
    </section>
  `;
}

function renderDoctorDetail(state) {
  const doctor = state.doctors.find((item) => item.id === state.selectedDoctorId) || state.doctors[0];
  const clinic = clinicFor(state, doctor);
  const location = currentLocation(state);
  const distance = distanceInKm(location, clinic);
  const reviews = state.reviews.filter((review) => review.doctorId === doctor.id);
  const draft = state.ui.bookingDraft;

  return `
    <button class="button button--ghost back-button" data-action="navigate" data-view="home">Back to doctors</button>
    <section class="detail-layout">
      <div class="detail-main">
        <section class="doctor-hero">
          <div class="doctor-hero__avatar">${doctor.name.split(" ").slice(1, 2).join("").slice(0, 1)}</div>
          <div>
            <span class="eyebrow">${doctor.specialty}</span>
            <h1>${doctor.name}</h1>
            <p>${doctor.bio}</p>
            <div class="doctor-meta doctor-meta--wrap">
              <span>${clinic.name}</span>
              <span>${clinic.address}</span>
              <span>${formatDistance(distance)}</span>
              <span>${doctor.languages.join(", ")}</span>
            </div>
          </div>
        </section>
        ${SlotPicker({ state, doctor })}
        <section class="panel">
          <div class="section-heading">
            <div>
              <span class="eyebrow">Booking details</span>
              <h2>Patient information</h2>
            </div>
            <span class="status-pill">Fee Rs ${doctor.fee}</span>
          </div>
          ${state.ui.errors.doctor ? `<p class="field-error">${state.ui.errors.doctor}</p>` : ""}
          <div class="form-grid">
            <label>
              <span>Patient name</span>
              <input value="${draft.patientName}" data-action="booking-input" data-field="patientName" />
              ${state.ui.errors.patientName ? `<small class="field-error">${state.ui.errors.patientName}</small>` : ""}
            </label>
            <label>
              <span>Phone number</span>
              <input value="${draft.patientPhone}" data-action="booking-input" data-field="patientPhone" />
              ${state.ui.errors.patientPhone ? `<small class="field-error">${state.ui.errors.patientPhone}</small>` : ""}
            </label>
            <label class="form-grid__wide">
              <span>Symptoms or notes</span>
              <textarea rows="3" data-action="booking-input" data-field="symptoms">${draft.symptoms}</textarea>
            </label>
          </div>
          <button class="button button--primary button--large" data-action="book-appointment" data-doctor-id="${doctor.id}">
            Book appointment ${icon("check")}
          </button>
        </section>
        <section class="panel">
          <div class="section-heading">
            <div>
              <span class="eyebrow">Reviews</span>
              <h2>${doctor.rating} from ${doctor.reviewCount} patients</h2>
            </div>
          </div>
          <div class="review-list">
            ${reviews
              .map(
                (review) => `
                  <article>
                    <strong>${review.userName}</strong>
                    <span>${review.rating}/5</span>
                    <p>${review.comment}</p>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
      </div>
      <aside class="detail-side">
        ${QueueTracker({ state, doctor })}
      </aside>
    </section>
  `;
}

function renderConfirmation(state) {
  const appointment =
    state.appointments.find((item) => item.id === state.selectedAppointmentId) ||
    state.appointments[state.appointments.length - 1];
  const doctor = doctorFor(state, appointment);
  const clinic = clinicFor(state, doctor);
  return `
    <section class="confirmation-layout">
      <div class="confirmation-hero">
        <div class="success-mark">${icon("check")}</div>
        <span class="eyebrow">Confirmed</span>
        <h1>Appointment booked</h1>
        <p>Booking number, queue number, and ongoing appointment number are shown separately for clear tracking.</p>
      </div>
      ${AppointmentSummary({ state, appointment, doctor, clinic, showActions: false })}
      ${QueueTracker({ state, doctor, appointment, compact: true })}
      <div class="action-row action-row--center">
        <button class="button button--primary" data-action="track-appointment" data-appointment-id="${appointment.id}">
          Track live queue
        </button>
        <button class="button button--ghost" data-action="navigate" data-view="appointments">
          My appointments
        </button>
      </div>
    </section>
  `;
}

function renderAppointments(state) {
  const appointments = state.appointments
    .filter((appointment) => appointment.userId === state.currentUserId)
    .sort((a, b) => {
      if (a.date === b.date) return a.time.localeCompare(b.time);
      return b.date.localeCompare(a.date);
    });
  const upcoming = appointments.filter(
    (appointment) => appointment.status !== "Completed" && appointment.status !== "Cancelled"
  );
  const history = appointments.filter(
    (appointment) => appointment.status === "Completed" || appointment.status === "Cancelled"
  );

  return `
    <section class="page-stack">
      <div class="page-title">
        <span class="eyebrow">Visits</span>
        <h1>My appointments</h1>
      </div>
      <section class="split-section">
        <div class="panel">
          <div class="section-heading">
            <h2>Upcoming</h2>
            <span class="status-pill">${upcoming.length}</span>
          </div>
          <div class="appointment-list">
            ${upcoming.map((appointment) => renderAppointmentCard(state, appointment)).join("") || emptyState("No upcoming appointments")}
          </div>
        </div>
        <div class="panel">
          <div class="section-heading">
            <h2>History</h2>
            <span class="status-pill">${history.length}</span>
          </div>
          <div class="appointment-list">
            ${history.map((appointment) => renderAppointmentCard(state, appointment)).join("") || emptyState("No completed appointments")}
          </div>
        </div>
      </section>
    </section>
  `;
}

function renderAppointmentCard(state, appointment) {
  const doctor = doctorFor(state, appointment);
  const clinic = clinicFor(state, doctor);
  return AppointmentSummary({ state, appointment, doctor, clinic });
}

function emptyState(text) {
  return `<div class="empty-state">${text}</div>`;
}

function renderTrack(state) {
  const appointment =
    state.appointments.find((item) => item.id === state.selectedAppointmentId) ||
    state.appointments.find((item) => item.userId === state.currentUserId);
  if (!appointment) return renderAppointments(state);
  const doctor = doctorFor(state, appointment);
  const clinic = clinicFor(state, doctor);

  return `
    <button class="button button--ghost back-button" data-action="navigate" data-view="appointments">Back to appointments</button>
    <section class="track-layout">
      ${AppointmentSummary({ state, appointment, doctor, clinic })}
      ${QueueTracker({ state, doctor, appointment })}
    </section>
  `;
}

function renderProfile(state) {
  const user = currentUser(state);
  return `
    <section class="page-stack">
      <div class="page-title">
        <span class="eyebrow">Signup and login</span>
        <h1>${user.fullName}</h1>
      </div>
      ${AuthPanel({ state, user })}
      ${ProfilePanel({ state })}
      ${renderNotifications(state)}
    </section>
  `;
}

function renderAdmin(state) {
  return `
    <section class="page-stack">
      <div class="page-title">
        <span class="eyebrow">Admin</span>
        <h1>Doctor dashboard</h1>
      </div>
      ${AdminPanel({ state })}
    </section>
  `;
}

function render(state) {
  const pages = {
    home: renderHome,
    doctor: renderDoctorDetail,
    confirmation: renderConfirmation,
    appointments: renderAppointments,
    track: renderTrack,
    profile: renderProfile,
    admin: renderAdmin,
  };
  renderShell(state, (pages[state.view] || renderHome)(state));
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  if (action === "navigate") actions.navigate(target.dataset.view);
  if (action === "select-doctor") actions.selectDoctor(target.dataset.doctorId);
  if (action === "select-slot") actions.updateBookingDraft("selectedSlotId", target.dataset.slotId);
  if (action === "book-appointment") actions.bookAppointment(target.dataset.doctorId);
  if (action === "track-appointment") {
    actions.navigate("track", { appointmentId: target.dataset.appointmentId });
  }
  if (action === "cancel-appointment") actions.cancelAppointment(target.dataset.appointmentId);
  if (action === "complete-next") actions.completeNextForDoctor(target.dataset.doctorId);
  if (action === "toggle-doctor") actions.toggleDoctorAvailability(target.dataset.doctorId);
  if (action === "save-profile") actions.saveProfile();
  if (action === "auth-submit") actions.loginOrSignup();
  if (action === "mark-notifications-read") actions.markNotificationsRead();
  if (action === "reset-filters") actions.resetFilters();
  if (action === "reset-demo") actions.resetDemo();
  if (action === "add-doctor") actions.addDoctor();
  if (action === "add-slot") actions.addSlot(target.dataset.doctorId);
  if (action === "manual-location") handleManualLocation();
  if (action === "detect-location") detectLocation();
  if (action === "save-maps-settings") handleSaveMapsSettings();
  if (action === "clear-maps-settings") handleClearMapsSettings();
  if (action === "admin-mode") actions.updateAdminDraft("onboardingMode", target.dataset.mode);
  if (action === "geocode-clinic") handleGeocodeClinic();
});

app.addEventListener("input", (event) => {
  const target = event.target;
  const action = target.dataset.action;
  if (action === "filter-input") actions.updateFilter(target.dataset.filter, target.value);
  if (action === "filter-checkbox") actions.updateFilter(target.dataset.filter, target.checked);
});

app.addEventListener("change", (event) => {
  const target = event.target;
  const action = target.dataset.action;
  if (action === "location-select") actions.setLocation(target.value);
  if (action === "booking-input") actions.updateBookingDraft(target.dataset.field, target.value);
  if (action === "profile-input") actions.updateProfileDraft(target.dataset.field, target.value);
  if (action === "auth-input") actions.updateAuthDraft(target.dataset.field, target.value);
  if (action === "manual-location-input") actions.updateLocationDraft(target.value);
  if (action === "maps-input") actions.updateMapsSettings(target.dataset.field, target.value);
  if (action === "slot-draft") actions.updateSlotDraft(target.dataset.doctorId, target.value);
  if (action === "admin-input") actions.updateAdminDraft(target.dataset.field, target.value);
  if (action === "doctor-field") actions.updateDoctorField(target.dataset.doctorId, target.dataset.field, target.value);
  if (action === "queue-field") actions.updateQueueField(target.dataset.doctorId, target.dataset.field, target.value);
  if (action === "profile-specialties") {
    const values = Array.from(target.selectedOptions).map((option) => option.value);
    actions.updateProfileDraft("preferredSpecialties", values);
  }
  if (action === "status-change") {
    actions.updateAppointmentStatus(target.dataset.appointmentId, target.value);
  }
});

function detectLocation() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      actions.setDetectedLocation({
        id: "detected",
        label: "Detected location",
        city: "Detected",
        area: "Near you",
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    () => actions.setLocation("loc-home"),
    { enableHighAccuracy: true, timeout: 5000 }
  );
}

async function handleManualLocation() {
  const state = window.__carequeueState;
  const input = app.querySelector("[data-action='manual-location-input']");
  const query = (input?.value || state.ui.locationDraft).trim();
  if (!query) {
    actions.setManualLocationError("Enter an area, city, or address.");
    return;
  }

  if (isGoogleMapsConfigured()) {
    try {
      const location = await geocodeAddress(query);
      actions.setManualLocation(location, true);
      return;
    } catch (error) {
      const fallback = fallbackManualLocation(state.locations, query, currentLocation(state));
      actions.setManualLocation(fallback, false);
      actions.setManualLocationError(
        `${error.message} Using the typed location as a fallback.`
      );
      return;
    }
  }

  const fallback = fallbackManualLocation(state.locations, query, currentLocation(state));
  actions.setManualLocation(fallback, false);
}

function handleSaveMapsSettings() {
  const apiKeyInput = app.querySelector('[data-action="maps-input"][data-field="apiKey"]');
  const mapIdInput = app.querySelector('[data-action="maps-input"][data-field="mapId"]');
  const settings = window.__carequeueState.ui.mapsSettings;
  const apiKey = apiKeyInput?.value ?? settings.apiKey;
  const mapId = mapIdInput?.value ?? settings.mapId;
  saveGoogleMapsSettings(apiKey, mapId);
  actions.syncMapsSettings({
    apiKey: getGoogleMapsApiKey(),
    mapId: getGoogleMapsMapId(),
  });
  actions.showToast("Google Maps settings saved");
}

function handleClearMapsSettings() {
  clearGoogleMapsSettings();
  actions.syncMapsSettings({ apiKey: "", mapId: "" });
  actions.showToast("Google Maps settings cleared");
}

async function handleGeocodeClinic() {
  const draft = window.__carequeueState.ui.adminDraft;
  const query = [draft.clinicAddress, draft.clinicArea, draft.clinicCity].filter(Boolean).join(", ");
  if (!query.trim()) {
    actions.setAdminClinicError("Enter a clinic address first.");
    return;
  }
  if (!isGoogleMapsConfigured()) {
    actions.setAdminClinicError("Add a Google Maps API key before geocoding clinic addresses.");
    return;
  }
  try {
    const location = await geocodeAddress(query);
    actions.updateAdminClinicLocation(location);
  } catch (error) {
    actions.setAdminClinicError(error.message);
  }
}

let mapRenderId = 0;

async function initializeGoogleMap(state) {
  const canvas = app.querySelector("[data-google-map]");
  if (!canvas) return;
  const renderId = (mapRenderId += 1);
  canvas.innerHTML = `<div class="map-loading">Loading Google Maps...</div>`;
  try {
    await renderGoogleDoctorMap(canvas, currentLocation(state), doctorsWithDistance(state));
  } catch (error) {
    if (renderId !== mapRenderId) return;
    canvas.innerHTML = `<div class="map-error">${error.message || "Google Maps could not load. Check the API key and domain restrictions."}</div>`;
  }
}

actions.syncMapsSettings({
  apiKey: getGoogleMapsApiKey(),
  mapId: getGoogleMapsMapId(),
});

subscribe((state) => {
  render(state);
  window.__carequeueState = state;
  initializeGoogleMap(state);
});
