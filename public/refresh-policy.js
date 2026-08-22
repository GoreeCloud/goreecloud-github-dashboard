export const SUCCESS_COOLDOWN_SECONDS = 30;
export const FAILURE_RETRY_SECONDS = 10;
const MAX_COOLDOWN_SECONDS = 300;

export function boundedCooldownSeconds(value, fallback = SUCCESS_COOLDOWN_SECONDS) {
  const numeric = Number(value);
  const fallbackNumeric = Number(fallback);
  const safeFallback = Number.isFinite(fallbackNumeric) && fallbackNumeric > 0
    ? fallbackNumeric
    : SUCCESS_COOLDOWN_SECONDS;
  const selected = Number.isFinite(numeric) && numeric > 0 ? numeric : safeFallback;
  return Math.min(MAX_COOLDOWN_SECONDS, Math.max(1, Math.round(selected)));
}

export function cooldownDeadline(seconds, now = Date.now()) {
  return Number(now) + boundedCooldownSeconds(seconds) * 1000;
}

export function remainingCooldownSeconds(deadline, now = Date.now()) {
  const target = Number(deadline);
  const current = Number(now);
  if (!Number.isFinite(target) || !Number.isFinite(current)) return 0;
  return Math.max(0, Math.ceil((target - current) / 1000));
}
