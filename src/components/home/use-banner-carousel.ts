"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const SLIDE_COUNT = 5;
const INTERVAL_MS = 5_000;
export const SLIDE_DURATION_MS = 650;
const motionQuery = "(prefers-reduced-motion: reduce)";

type SlideState = { index: number; previous: number | null; direction: -1 | 1 };

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
  const [slide, setSlide] = useState<SlideState>({ index: 0, previous: null, direction: 1 });
  const [playRequested, setPlayRequested] = useState<boolean | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const enabled = playRequested ?? !reducedMotion;
  const playing = enabled && visible && !hovered && !focused;
  const moving = slide.previous !== null;

  const move = useCallback((direction: -1 | 1) => {
    setSlide((current) => current.previous !== null ? current : {
      index: (current.index + direction + SLIDE_COUNT) % SLIDE_COUNT,
      previous: reducedMotion ? null : current.index,
      direction,
    });
  }, [reducedMotion]);

  const finish = useCallback(() => {
    setSlide((current) => current.previous === null ? current : { ...current, previous: null });
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => move(1), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [playing, slide.index, move]);

  useEffect(() => {
    if (!moving) return;
    // 탭 숨김·동작 줄이기 전환 등으로 animationend가 생략되어도 조작을 복구한다.
    const timer = window.setTimeout(finish, reducedMotion ? 0 : SLIDE_DURATION_MS + 100);
    return () => window.clearTimeout(timer);
  }, [moving, reducedMotion, finish]);

  return {
    ...slide, count: SLIDE_COUNT, enabled, playing, moving,
    setHovered, setFocused, move, finish,
    toggle: () => setPlayRequested(!enabled),
  };
}
