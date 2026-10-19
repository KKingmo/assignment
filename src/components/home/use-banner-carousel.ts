"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";

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
  const [playRequested, setPlayRequested] = useState<boolean | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const startIndex = useRef(0);
  const cancelled = useRef(false);
  const controlPress = useRef<{ x: number; y: number; dragged: boolean } | null>(null);
  const [attachViewport, api] = useEmblaCarousel({
    loop: true,
    duration: 18,
    watchFocus: false,
    watchDrag(embla, event) {
      if ((event.target as Element).closest("[data-carousel-cta]")) return false;
      startIndex.current = embla.selectedScrollSnap();
      cancelled.current = false;
      const point = "touches" in event ? event.touches[0] : event;
      controlPress.current = (event.target as Element).closest("button")
        ? { x: point.clientX, y: point.clientY, dragged: false } : null;
      return true;
    },
  });
  const subscribeIndex = useCallback((callback: () => void) => {
    api?.on("select", callback).on("reInit", callback);
    return () => { api?.off("select", callback).off("reInit", callback); };
  }, [api]);
  const index = useSyncExternalStore(subscribeIndex, () => api?.selectedScrollSnap() ?? 0, () => 0);
  const enabled = playRequested ?? !reducedMotion;
  const playing = enabled && visible && !hovered && !focused && !swiping;

  const move = useCallback((direction: -1 | 1) => {
    if (direction === 1) api?.scrollNext(reducedMotion);
    else api?.scrollPrev(reducedMotion);
  }, [api, reducedMotion]);

  useEffect(() => {
    if (!api) return;
    const start = () => setSwiping(true);
    const end = () => {
      setSwiping(false);
      if (cancelled.current) api.scrollTo(startIndex.current, true);
      // 전환 중 버튼을 탭해도 드래그 종료가 직전 선택 번호를 되돌리지 않게 한다.
      else if (controlPress.current && !controlPress.current.dragged) api.scrollTo(startIndex.current, reducedMotion);
      else if (reducedMotion) api.scrollTo(api.selectedScrollSnap(), true);
      cancelled.current = false;
      controlPress.current = null;
    };
    api.on("pointerDown", start).on("pointerUp", end).on("reInit", end);
    return () => { api.off("pointerDown", start).off("pointerUp", end).off("reInit", end); };
  }, [api, reducedMotion]);

  useEffect(() => {
    if (!playing || !api) return;
    const timer = window.setTimeout(() => move(1), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [playing, index, api, move]);

  return {
    attachViewport, index, count: SLIDE_COUNT, enabled, playing, swiping,
    setHovered, setFocused, move,
    trackControlDrag: (event: PointerEvent<HTMLElement>) => {
      const press = controlPress.current;
      if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 10) press.dragged = true;
    },
    cancelSwipe: () => { cancelled.current = true; },
    toggle: () => setPlayRequested(!enabled),
  };
}
