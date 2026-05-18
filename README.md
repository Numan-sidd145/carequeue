# CareQueue

A clean, responsive doctor appointment booking frontend with location search, live queue tracking, booking confirmation, profile management, appointment history, notifications, and a basic doctor/admin panel.

## Run locally

Serve the folder with any static server:

```powershell
python -m http.server 5173
```

Then open `http://localhost:5173`.

The app stores mock bookings in `localStorage`, so refreshes keep the demo state. Use the reset control in the admin panel to restore seed data.

## Structure

- `index.html` - app shell.
- `src/main.js` - app bootstrap and routing/rendering.
- `src/data/seedData.js` - users, doctors, clinics, appointments, queue status, reviews, notifications, and locations.
- `src/state/store.js` - mock persistence and business actions.
- `src/utils/queue.js` - queue and booking calculations.
- `src/utils/location.js` - distance and location helpers.
- `src/components/` - reusable UI components.
- `src/styles/main.css` - responsive production-style UI.

## Included flows

- Location detection and manual city entry.
- Nearby doctors sorted by distance and availability.
- Doctor detail with live queue and slot picker.
- Booking with duplicate slot prevention.
- Confirmation with booking number, queue number, ongoing appointment number, people ahead, and estimated wait.
- Appointment status tracking and automatic queue recalculation.
- Profile form, upcoming appointments, history, notifications.
- Admin panel for schedules, doctor availability, and queue progression.
