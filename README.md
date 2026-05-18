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
- Google Maps integration for exact manual-location geocoding and real map rendering when a key is configured.
- Nearby doctors sorted by distance and availability.
- Doctor detail with live queue and slot picker.
- Booking with duplicate slot prevention.
- Confirmation with booking number, queue number, ongoing appointment number, people ahead, and estimated wait.
- Appointment status tracking and automatic queue recalculation.
- Profile form, upcoming appointments, history, notifications.
- Admin panel for schedules, doctor availability, and queue progression.
- Admin-maintained doctor creation and doctor-admin onboarding invites.

## Google Maps setup

The app works without a Google Maps key by using a local fallback map and seeded coordinates. For production:

1. Create a Google Maps Platform browser API key.
2. Enable **Maps JavaScript API** and **Geocoding API** in the same Google Cloud project.
3. Restrict the key to your website, for example:

```text
https://Numan-sidd145.github.io/*
http://127.0.0.1:5173/*
```

4. Add the key in the app under **Admin → Platform settings → Google Maps**.

For a deployed public default, put the restricted key in `src/config.js`:

```js
export const GOOGLE_MAPS_API_KEY = "YOUR_RESTRICTED_BROWSER_KEY";
export const GOOGLE_MAPS_MAP_ID = "";
```

Browser Maps keys are visible in public frontend code, so domain and API restrictions are required.

Helpful official docs:

- [Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Maps JavaScript geocoding service](https://developers.google.com/maps/documentation/javascript/geocoding)
- [API key security best practices](https://developers.google.com/maps/api-security-best-practices)
