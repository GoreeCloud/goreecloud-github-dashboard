export const APPEARANCE_MODES = Object.freeze(["system", "light", "dark", "deep-dark"]);

const APPEARANCE_LABELS = Object.freeze({
  system: "System",
  light: "Light",
  dark: "Dark",
  "deep-dark": "Deep Dark",
});

const APPEARANCE_ICONS = Object.freeze({
  system: "◐",
  light: "☀",
  dark: "◒",
  "deep-dark": "●",
});

export function normalizeAppearance(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return APPEARANCE_MODES.includes(normalized) ? normalized : "system";
}

export function nextAppearance(value) {
  const current = normalizeAppearance(value);
  const index = APPEARANCE_MODES.indexOf(current);
  return APPEARANCE_MODES[(index + 1) % APPEARANCE_MODES.length];
}

export function appearanceLabel(value) {
  return APPEARANCE_LABELS[normalizeAppearance(value)];
}

export function appearanceIcon(value) {
  return APPEARANCE_ICONS[normalizeAppearance(value)];
}
