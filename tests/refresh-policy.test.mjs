import test from "node:test";
import assert from "node:assert/strict";
import {
  FAILURE_RETRY_SECONDS,
  SUCCESS_COOLDOWN_SECONDS,
  boundedCooldownSeconds,
  cooldownDeadline,
  remainingCooldownSeconds,
} from "../public/refresh-policy.js";

test("refresh policy keeps successful manual refreshes at a thirty-second floor", () => {
  assert.equal(SUCCESS_COOLDOWN_SECONDS, 30);
  assert.equal(boundedCooldownSeconds(SUCCESS_COOLDOWN_SECONDS), 30);
});

test("refresh policy gives failed refreshes a bounded retry floor", () => {
  assert.equal(FAILURE_RETRY_SECONDS, 10);
  assert.equal(boundedCooldownSeconds(FAILURE_RETRY_SECONDS), 10);
});

test("cooldown deadline and remaining time are deterministic", () => {
  const now = 1_000_000;
  const deadline = cooldownDeadline(30, now);
  assert.equal(deadline, 1_030_000);
  assert.equal(remainingCooldownSeconds(deadline, now), 30);
  assert.equal(remainingCooldownSeconds(deadline, now + 29_001), 1);
});

test("cooldown values are bounded and expired deadlines return zero", () => {
  assert.equal(boundedCooldownSeconds(0, 30), 30);
  assert.equal(boundedCooldownSeconds(9_999), 300);
  assert.equal(remainingCooldownSeconds(500, 1_000), 0);
  assert.equal(remainingCooldownSeconds("invalid", 1_000), 0);
});
