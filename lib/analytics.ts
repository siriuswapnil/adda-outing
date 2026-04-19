"use client";

import posthog from "posthog-js";

const KEY = "phc_nd5yHcnRXjw2cXU3x7GDuzV967HcyMRVq5E2cPZuS27M";
const HOST = "https://us.i.posthog.com";

let initialized = false;

export function initAnalytics() {
  if (typeof window === "undefined") return;
  if (initialized) return;
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: false, // we'll capture manually on route change
    persistence: "localStorage",
  });
  initialized = true;
}

export function capturePageview(path: string) {
  if (typeof window === "undefined") return;
  posthog.capture("$pageview", { path });
}

export function captureEvent(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.capture(event, props);
}

export function identifyUser(name: string) {
  if (typeof window === "undefined") return;
  posthog.identify(name, { name });
}

export function resetUser() {
  if (typeof window === "undefined") return;
  posthog.reset();
}
