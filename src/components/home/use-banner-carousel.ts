"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";

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
  const [swiping, setSwiping] = useState(false);
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  const enabled = playRequested ?? !reducedMotion;
  const playing = enabled && visible && !hovered && !focused && !swiping;
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

  function resetSwipe(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (!current) return;
    gesture.current = null;
    setSwiping(false);
    if (event.currentTarget.hasPointerCapture(current.id)) event.currentTarget.releasePointerCapture(current.id);
  }

  function startSwipe(event: PointerEvent<HTMLDivElement>) {
    // 두 손가락 동작과 링크 클릭은 브라우저의 기본 동작으로 남긴다.
    if (!event.isPrimary) {
      resetSwipe(event);
      return;
    }
    if (moving || event.button !== 0 || (event.target as Element).closest("a, button, input, select, textarea")) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    setSwiping(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function endSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    resetSwipe(event);
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.25) move(dx < 0 ? 1 : -1);
  }

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
    ...slide, count: SLIDE_COUNT, enabled, playing, moving, swiping,
    setHovered, setFocused, move, finish,
    startSwipe, endSwipe, resetSwipe,
    toggle: () => setPlayRequested(!enabled),
  };
}
