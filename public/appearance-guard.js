import {
  appearanceIcon,
  appearanceLabel,
  nextAppearance,
  normalizeAppearance,
} from "./theme-policy.js";

const STORAGE_KEY = "goreecloud-github-dashboard-theme";

function currentAppearance() {
  return normalizeAppearance(document.documentElement.dataset.theme || "system");
}

function updateAppearanceButton(mode) {
  const button = document.getElementById("theme-toggle");
  if (!button) return;

  const current = normalizeAppearance(mode);
  const next = nextAppearance(current);
  const label = `Appearance: ${appearanceLabel(current)}. Switch to ${appearanceLabel(next)}.`;

  button.textContent = appearanceIcon(current);
  button.setAttribute("aria-label", label);
  button.title = label;
  button.dataset.appearance = current;
}

export function applyAppearance(value) {
  const mode = normalizeAppearance(value);

  if (mode === "system") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = mode;
  }

  localStorage.setItem(STORAGE_KEY, mode);
  updateAppearanceButton(mode);
  return mode;
}

function initializeAppearance() {
  applyAppearance(localStorage.getItem(STORAGE_KEY) || "system");
}

initializeAppearance();

/* Capture the appearance control before the legacy renderer's binary
 * Light/Dark listener. This keeps the V1.1 four-state appearance policy in a
 * small migration module without coupling it to dashboard data rendering.
 */
document.addEventListener(
  "click",
  (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest("#theme-toggle")) return;

    event.stopImmediatePropagation();
    applyAppearance(nextAppearance(currentAppearance()));
  },
  true,
);
