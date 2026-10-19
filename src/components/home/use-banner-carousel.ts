"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const SLIDE_COUNT = 5;
const INTERVAL_MS = 5_000;
const motionQuery = "(prefers-reduced-motion: reduce)";

function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

export function useBannerCarousel() {
  const reducedMotion = useSyncExternalStore(subscribeMotion, () => window.matchMedia(motionQuery).matches, () => true);
  const visible = useSyncExternalStore(subscribeVisibility, () => document.visibilityState === "visible", () => false);
  const [index, setIndex] = useState(0);
  const [playRequested, setPlayRequested] = useState<boolean | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const enabled = playRequested ?? !reducedMotion;
  const playing = enabled && visible && !hovered && !focused;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % SLIDE_COUNT), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [playing, index]);

  return {
    index, count: SLIDE_COUNT, enabled, playing, setHovered, setFocused,
    move: (direction: -1 | 1) => setIndex((current) => (current + direction + SLIDE_COUNT) % SLIDE_COUNT),
    toggle: () => setPlayRequested(!enabled),
  };
}
