export function ProfilePanel({ state }) {
  const profile =
    state.ui.profileDraft || state.users.find((item) => item.id === state.currentUserId);
  const specialties = state.doctors
    .map((doctor) => doctor.specialty)
    .filter((value, index, list) => list.indexOf(value) === index);
  const preferred = profile.preferredSpecialties || [];

  return `
    <section class="panel">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Account</span>
          <h2>Profile details</h2>
        </div>
        <button class="button button--primary" data-action="save-profile">Save profile</button>
      </div>
      <div class="form-grid">
        <label>
          <span>Full name</span>
          <input value="${profile.fullName || ""}" data-action="profile-input" data-field="fullName" />
          ${state.ui.errors.fullName ? `<small class="field-error">${state.ui.errors.fullName}</small>` : ""}
        </label>
        <label>
          <span>Phone number</span>
          <input value="${profile.phone || ""}" data-action="profile-input" data-field="phone" />
          ${state.ui.errors.phone ? `<small class="field-error">${state.ui.errors.phone}</small>` : ""}
        </label>
        <label>
          <span>Age</span>
          <input type="number" min="1" value="${profile.age || ""}" data-action="profile-input" data-field="age" />
          ${state.ui.errors.age ? `<small class="field-error">${state.ui.errors.age}</small>` : ""}
        </label>
        <label>
          <span>Gender</span>
          <select data-action="profile-input" data-field="gender">
            ${["Female", "Male", "Non-binary", "Prefer not to say"]
              .map(
                (gender) =>
                  `<option value="${gender}" ${profile.gender === gender ? "selected" : ""}>${gender}</option>`
              )
              .join("")}
          </select>
        </label>
        <label class="form-grid__wide">
          <span>Medical history</span>
          <textarea rows="4" data-action="profile-input" data-field="medicalHistory">${profile.medicalHistory || ""}</textarea>
        </label>
        <label class="form-grid__wide">
          <span>Preferred specialties</span>
          <select multiple data-action="profile-specialties">
            ${specialties
              .map(
                (specialty) =>
                  `<option value="${specialty}" ${preferred.includes(specialty) ? "selected" : ""}>${specialty}</option>`
              )
              .join("")}
          </select>
        </label>
      </div>
    </section>
  `;
}
