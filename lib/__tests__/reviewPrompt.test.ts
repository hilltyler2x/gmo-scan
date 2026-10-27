import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyState, shouldAsk, withAppOpen, REVIEW_RULES } from "../reviewPrompt";

const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date(2026, 9, 27, 12).getTime();

test("never asks on a fresh install", () => {
  const s = withAppOpen(emptyState(), T0);
  assert.equal(shouldAsk(s, T0), false);
});

test("a few good scans on day one are not enough", () => {
  const s = { ...withAppOpen(emptyState(), T0), goodScans: REVIEW_RULES.minGoodScans };
  assert.equal(shouldAsk(s, T0), false);
});

test("a heavy first day is enough", () => {
  const s = { ...withAppOpen(emptyState(), T0), goodScans: REVIEW_RULES.minGoodScansSameDay };
  assert.equal(shouldAsk(s, T0), true);
});

test("asks once the user comes back with enough good scans", () => {
  let s = withAppOpen(emptyState(), T0);
  s = withAppOpen(s, T0 + DAY);
  s = { ...s, goodScans: REVIEW_RULES.minGoodScans };
  assert.equal(s.daysUsed.length, 2);
  assert.equal(shouldAsk(s, T0 + DAY), true);
});

test("opening twice on the same day counts as one day", () => {
  let s = withAppOpen(emptyState(), T0);
  s = withAppOpen(s, T0 + 60 * 1000);
  assert.equal(s.daysUsed.length, 1);
});

test("waits between asks, then asks again", () => {
  let s = withAppOpen(withAppOpen(emptyState(), T0), T0 + DAY);
  s = { ...s, goodScans: 10, lastAskedAt: T0 + DAY, timesAsked: 1 };
  assert.equal(shouldAsk(s, T0 + 5 * DAY), false);
  assert.equal(shouldAsk(s, T0 + DAY + REVIEW_RULES.daysBetweenAsks * DAY), true);
});

test("stops after the maximum number of asks", () => {
  let s = withAppOpen(withAppOpen(emptyState(), T0), T0 + DAY);
  s = { ...s, goodScans: 100, lastAskedAt: T0, timesAsked: REVIEW_RULES.maxAsks };
  assert.equal(shouldAsk(s, T0 + 365 * DAY), false);
});
