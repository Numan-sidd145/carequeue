export function AuthPanel({ state, user }) {
  const draft = state.ui.authDraft;
  return `
    <section class="panel account-panel">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Access</span>
          <h2>Signup or login</h2>
        </div>
        <span class="status-pill">Signed in: ${user.fullName}</span>
      </div>
      <div class="form-grid account-grid">
        <label>
          <span>Full name</span>
          <input placeholder="Required for new account" value="${draft.fullName}" data-action="auth-input" data-field="fullName" />
          ${state.ui.errors.authName ? `<small class="field-error">${state.ui.errors.authName}</small>` : ""}
        </label>
        <label>
          <span>Phone number</span>
          <input placeholder="+91 98765 43210" value="${draft.phone}" data-action="auth-input" data-field="phone" />
          ${state.ui.errors.authPhone ? `<small class="field-error">${state.ui.errors.authPhone}</small>` : ""}
        </label>
      </div>
      <button class="button button--primary" data-action="auth-submit">Continue</button>
    </section>
  `;
}
