const icons = {
  search:
    '<path d="m21 21-4.3-4.3"/><circle cx="11" cy="11" r="7"/>',
  mapPin:
    '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  calendar:
    '<path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/>',
  clock:
    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  user:
    '<circle cx="12" cy="8" r="4"/><path d="M4 22c1.8-4 5-6 8-6s6.2 2 8 6"/>',
  shield:
    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  bell:
    '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  star:
    '<path d="m12 2 3 6 6 .9-4.5 4.4 1 6.2L12 16.6 6.5 19.5l1-6.2L3 8.9 9 8l3-6Z"/>',
  arrowRight:
    '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  check:
    '<path d="m20 6-11 11-5-5"/>',
  x:
    '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  activity:
    '<path d="M22 12h-4l-3 8L9 4l-3 8H2"/>',
  filter:
    '<path d="M3 5h18"/><path d="M6 12h12"/><path d="M10 19h4"/>',
  refresh:
    '<path d="M21 12a9 9 0 0 1-15.4 6.4L3 16"/><path d="M3 22v-6h6"/><path d="M3 12A9 9 0 0 1 18.4 5.6L21 8"/><path d="M21 2v6h-6"/>',
};

export function icon(name, label = "") {
  return `<svg class="icon" aria-hidden="${label ? "false" : "true"}" aria-label="${label}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${icons[name] || ""}</svg>`;
}
