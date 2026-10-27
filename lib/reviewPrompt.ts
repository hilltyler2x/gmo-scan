/**
 * When to ask for an app store review (phone app only).
 *
 * The ask comes after a good moment, never on launch: a scan that gave the
 * user a real answer. It waits until the user has had several of those and
 * has come back to the app on a later day (or is clearly a heavy user), then
 * asks again every few weeks while they keep getting answers.
 *
 * The prompt itself is the native one (App Store / Google Play in-app
 * review). Both stores forbid asking "Do you like the app?" first and
 * routing only happy users to the review, so there is no pre-prompt. The OS
 * also caps how often the dialog really shows (iOS: 3 times a year), so
 * asking "heavily" here just means never missing an eligible moment.
 */
import { Capacitor } from "@capacitor/core";

export interface ReviewState {
  firstSeenDay: string | null; // YYYY-MM-DD of the first app launch
  daysUsed: string[]; // distinct days the app was opened, newest last
  goodScans: number; // scans that produced a real answer
  lastAskedAt: number | null; // ms timestamp
  timesAsked: number;
}

export const REVIEW_RULES = {
  minGoodScans: 3,
  // A user this engaged on day one has seen enough to rate the app.
  minGoodScansSameDay: 6,
  minDaysUsed: 2,
  daysBetweenAsks: 14,
  maxAsks: 8,
};

const STORAGE_KEY = "gmoscan.reviewPrompt.v1";
const DAY_MS = 24 * 60 * 60 * 1000;

export function emptyState(): ReviewState {
  return { firstSeenDay: null, daysUsed: [], goodScans: 0, lastAskedAt: null, timesAsked: 0 };
}

export function dayKey(now: number): string {
  const d = new Date(now);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function withAppOpen(state: ReviewState, now: number): ReviewState {
  const today = dayKey(now);
  if (state.daysUsed.includes(today)) return state;
  return {
    ...state,
    firstSeenDay: state.firstSeenDay ?? today,
    // Only the count matters past minDaysUsed, so keep the list short.
    daysUsed: [...state.daysUsed, today].slice(-10),
  };
}

export function shouldAsk(state: ReviewState, now: number): boolean {
  const r = REVIEW_RULES;
  if (state.timesAsked >= r.maxAsks) return false;
  if (state.lastAskedAt !== null && now - state.lastAskedAt < r.daysBetweenAsks * DAY_MS) {
    return false;
  }
  if (state.goodScans < r.minGoodScans) return false;
  const cameBack = state.daysUsed.length >= r.minDaysUsed;
  return cameBack || state.goodScans >= r.minGoodScansSameDay;
}

function load(): ReviewState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...emptyState(), ...JSON.parse(raw) };
  } catch {
    // Storage unavailable or corrupt: start fresh.
  }
  return emptyState();
}

function save(state: ReviewState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Not fatal: worst case the user is asked a little later.
  }
}

export function isReviewSupported(): boolean {
  return Capacitor.isNativePlatform();
}

/** Call once when the app starts. Never asks for a review by itself. */
export function recordAppOpen() {
  if (!isReviewSupported()) return;
  save(withAppOpen(load(), Date.now()));
}

/**
 * Call after a scan gives the user a real answer. Asks for a review when the
 * rules allow it, after a short pause so the result is on screen first.
 */
export function recordGoodScan() {
  if (!isReviewSupported()) return;
  const now = Date.now();
  const state = withAppOpen(load(), now);
  state.goodScans += 1;
  const ask = shouldAsk(state, now);
  if (ask) {
    state.lastAskedAt = now;
    state.timesAsked += 1;
  }
  save(state);
  if (ask) {
    setTimeout(async () => {
      try {
        const { AppReview } = await import("@capawesome/capacitor-app-review");
        await AppReview.requestReview();
      } catch {
        // Unsupported OS version or store unavailable: nothing to do.
      }
    }, 2500);
  }
}

// Set once the App Store listing exists (the number in its apps.apple.com
// URL). Without it the "Rate" link is hidden on iPhone.
const APPLE_APP_ID = process.env.NEXT_PUBLIC_APPLE_APP_ID ?? "";

/** Whether the always-available "Rate GMO Scan" link can work here. */
export function canOpenStorePage(): boolean {
  if (!isReviewSupported()) return false;
  return Capacitor.getPlatform() === "android" || APPLE_APP_ID !== "";
}

export async function openStorePage() {
  try {
    const { AppReview } = await import("@capawesome/capacitor-app-review");
    await AppReview.openAppStore(APPLE_APP_ID ? { appId: APPLE_APP_ID } : undefined);
  } catch {
    // No store app on the device.
  }
}
