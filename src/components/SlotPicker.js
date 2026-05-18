import { isSlotBooked } from "../utils/queue.js";

export function SlotPicker({ state, doctor }) {
  const selectedSlotId = state.ui.bookingDraft.selectedSlotId;
  const slotsByPeriod = doctor.slots.reduce((groups, slot) => {
    groups[slot.period] = groups[slot.period] || [];
    groups[slot.period].push(slot);
    return groups;
  }, {});

  return `
    <section class="panel">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Availability</span>
          <h2>Choose a slot</h2>
        </div>
        <span class="status-pill ${doctor.available ? "status-pill--green" : "status-pill--red"}">
          ${doctor.available ? "Live slots" : "Unavailable"}
        </span>
      </div>
      <div class="slot-picker">
        ${Object.entries(slotsByPeriod)
          .map(
            ([period, slots]) => `
              <div class="slot-group">
                <h3>${period}</h3>
                <div class="slot-grid">
                  ${slots
                    .map((slot) => {
                      const disabled = !doctor.available || !doctor.availableToday;
                      const booked = isSlotBooked(state, doctor.id, slot.id);
                      const selected = selectedSlotId === slot.id;
                      return `
                        <button
                          class="slot-button ${selected ? "is-selected" : ""}"
                          data-action="select-slot"
                          data-slot-id="${slot.id}"
                          ${booked || disabled ? "disabled" : ""}
                          title="${booked ? "Already booked" : disabled ? "Not available today" : "Available"}"
                        >
                          <span>${slot.time}</span>
                          <small>${booked ? "Booked" : disabled ? "Not today" : "Open"}</small>
                        </button>
                      `;
                    })
                    .join("")}
                </div>
              </div>
            `
          )
          .join("")}
      </div>
      ${state.ui.errors.selectedSlotId ? `<p class="field-error">${state.ui.errors.selectedSlotId}</p>` : ""}
    </section>
  `;
}
