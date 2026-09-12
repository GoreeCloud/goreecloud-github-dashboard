import {
  FAILURE_RETRY_SECONDS,
  SUCCESS_COOLDOWN_SECONDS,
  cooldownDeadline,
  remainingCooldownSeconds,
} from "./refresh-policy.js";

const button = document.getElementById("refresh-button");
const refreshState = document.getElementById("refresh-state");
const generatedAt = document.getElementById("generated-at");
const apiState = document.getElementById("api-state");

let nextRefreshAt = 0;
let cooldownTimer = null;
let cooldownReason = "Refresh available";
let lastGeneratedText = generatedAt?.textContent || "";

function setRefreshState(text) {
  if (refreshState) refreshState.textContent = text;
}

function stopCooldownTimer() {
  if (cooldownTimer !== null) {
    clearInterval(cooldownTimer);
    cooldownTimer = null;
  }
}

function updateRefreshControl() {
  if (!button) return;
  const remaining = remainingCooldownSeconds(nextRefreshAt);
  const busy = button.getAttribute("aria-busy") === "true";

  if (busy) return;

  if (remaining > 0) {
    button.disabled = true;
    button.textContent = `Refresh in ${remaining}s`;
    setRefreshState(`${cooldownReason} · ${remaining}s`);
    return;
  }

  button.disabled = false;
  button.textContent = "Refresh";
  setRefreshState("Refresh available");
  stopCooldownTimer();
}

function startCooldown(seconds, reason) {
  nextRefreshAt = cooldownDeadline(seconds);
  cooldownReason = reason;
  stopCooldownTimer();
  updateRefreshControl();
  cooldownTimer = setInterval(updateRefreshControl, 1000);
}

button?.addEventListener("click", (event) => {
  if (remainingCooldownSeconds(nextRefreshAt) <= 0) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  updateRefreshControl();
}, true);

if (generatedAt) {
  const generatedObserver = new MutationObserver(() => {
    const current = generatedAt.textContent || "";
    if (current !== lastGeneratedText && current.startsWith("Updated ")) {
      startCooldown(SUCCESS_COOLDOWN_SECONDS, "API-friendly cooldown");
    }
    lastGeneratedText = current;
  });
  generatedObserver.observe(generatedAt, { childList: true, characterData: true, subtree: true });
}

if (apiState) {
  const apiObserver = new MutationObserver(() => {
    if ((apiState.textContent || "").trim() === "Data unavailable") {
      startCooldown(FAILURE_RETRY_SECONDS, "Retry cooldown");
    }
  });
  apiObserver.observe(apiState, { childList: true, characterData: true, subtree: true });
}

setRefreshState("Refresh available");
