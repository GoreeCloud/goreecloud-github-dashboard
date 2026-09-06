import {
  appearanceIcon,
  appearanceLabel,
  nextAppearance,
  normalizeAppearance,
} from "./theme-policy.js";

export const APPEARANCE_STORAGE_KEY = "goreecloud-github-dashboard-theme";

export function currentAppearance() {
  return normalizeAppearance(document.documentElement.dataset.theme || "system");
}

function readStoredAppearance() {
  try {
    return localStorage.getItem(APPEARANCE_STORAGE_KEY) || "system";
  } catch {
    return "system";
  }
}

function persistAppearance(mode) {
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, mode);
  } catch {
    // Appearance remains functional for the current page even when storage is unavailable.
  }
}

export function updateAppearanceButton(mode) {
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

export function applyAppearance(value, { persist = true } = {}) {
  const mode = normalizeAppearance(value);

  if (mode === "system") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = mode;
  }

  if (persist) persistAppearance(mode);
  updateAppearanceButton(mode);
  return mode;
}

export function initializeAppearance() {
  return applyAppearance(readStoredAppearance(), { persist: false });
}

export function installAppearanceControl() {
  const button = document.getElementById("theme-toggle");
  if (!button || button.dataset.appearanceController === "installed") return false;

  button.dataset.appearanceController = "installed";
  button.addEventListener("click", () => {
    applyAppearance(nextAppearance(currentAppearance()));
  });
  return true;
}

initializeAppearance();
installAppearanceControl();
