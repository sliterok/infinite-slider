import { useRef, useState, useCallback, useEffect } from "react";
import { clamp, roundToStep } from "./utils";

const DEFAULT_GEARS = [0.01, 0.1, 1, 10, 100];

interface UseInfiniteSliderOptions {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  sensitivity: number;
  gears: number[];
  defaultGearIndex: number;
  edgeScrollSpeed: number;
  disabled: boolean;
}

export function useInfiniteSlider(opts: UseInfiniteSliderOptions) {
  const {
    value,
    onChange,
    min,
    max,
    step,
    sensitivity,
    gears,
    defaultGearIndex,
    edgeScrollSpeed,
    disabled,
  } = opts;

  const trackRef = useRef<HTMLDivElement>(null);
  const [gearIndex, setGearIndex] = useState(defaultGearIndex);
  const [isDragging, setIsDragging] = useState(false);

  // Mutable refs for drag state (avoid stale closures in rAF)
  const dragState = useRef({
    active: false,
    startX: 0,
    startValue: 0,
    pointerId: -1,
    pointerX: 0,
    rafId: 0,
    lastTime: 0,
    overshoot: 0, // px past edge, signed
  });

  const valueRef = useRef(value);
  valueRef.current = value;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const gearsRef = useRef(gears);
  gearsRef.current = gears;

  const gearIndexRef = useRef(gearIndex);
  gearIndexRef.current = gearIndex;

  // ---- Edge-scroll rAF loop ----
  const edgeScrollLoop = useCallback(
    (time: number) => {
      const ds = dragState.current;
      if (!ds.active || ds.overshoot === 0) {
        ds.rafId = 0;
        return;
      }
      const dt = ds.lastTime ? (time - ds.lastTime) / 1000 : 0.016;
      ds.lastTime = time;

      const gear = gearsRef.current[gearIndexRef.current] ?? 1;
      const velocity = ds.overshoot * gear * step * edgeScrollSpeed;
      const delta = velocity * dt;
      const newValue = roundToStep(
        clamp(valueRef.current + delta, min, max),
        step
      );

      if (newValue !== valueRef.current) {
        onChangeRef.current(newValue);
      }

      ds.rafId = requestAnimationFrame(edgeScrollLoop);
    },
    [min, max, step, edgeScrollSpeed]
  );

  const startEdgeScroll = useCallback(() => {
    const ds = dragState.current;
    if (ds.rafId) return; // already running
    ds.lastTime = 0;
    ds.rafId = requestAnimationFrame(edgeScrollLoop);
  }, [edgeScrollLoop]);

  const stopEdgeScroll = useCallback(() => {
    const ds = dragState.current;
    if (ds.rafId) {
      cancelAnimationFrame(ds.rafId);
      ds.rafId = 0;
    }
    ds.overshoot = 0;
  }, []);

  // ---- Pointer handlers ----
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      const track = trackRef.current;
      if (!track) return;

      track.setPointerCapture(e.pointerId);
      const ds = dragState.current;
      ds.active = true;
      ds.startX = e.clientX;
      ds.startValue = value;
      ds.pointerId = e.pointerId;
      ds.pointerX = e.clientX;
      setIsDragging(true);
    },
    [disabled, value]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const ds = dragState.current;
      if (!ds.active) return;

      const track = trackRef.current;
      if (!track) return;

      ds.pointerX = e.clientX;
      const rect = track.getBoundingClientRect();
      const leftEdge = rect.left;
      const rightEdge = rect.right;

      // Check edge overflow
      if (e.clientX < leftEdge) {
        ds.overshoot = e.clientX - leftEdge; // negative
        startEdgeScroll();
        return;
      }
      if (e.clientX > rightEdge) {
        ds.overshoot = e.clientX - rightEdge; // positive
        startEdgeScroll();
        return;
      }

      // Within track — stop edge scroll if running
      if (ds.overshoot !== 0) {
        stopEdgeScroll();
      }

      const dx = e.clientX - ds.startX;
      const gear = gears[gearIndexRef.current] ?? 1;
      const delta = (dx / sensitivity) * step * gear;
      const newValue = roundToStep(clamp(ds.startValue + delta, min, max), step);

      if (newValue !== valueRef.current) {
        onChangeRef.current(newValue);
      }
    },
    [gears, sensitivity, step, min, max, startEdgeScroll, stopEdgeScroll]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const ds = dragState.current;
      if (!ds.active) return;

      const track = trackRef.current;
      if (track) {
        try {
          track.releasePointerCapture(e.pointerId);
        } catch {
          // already released
        }
      }

      ds.active = false;
      ds.pointerId = -1;
      stopEdgeScroll();
      setIsDragging(false);
    },
    [stopEdgeScroll]
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!dragState.current.active) return;
      e.preventDefault();
      setGearIndex((prev) => {
        const next =
          e.deltaY < 0
            ? Math.min(prev + 1, gears.length - 1)
            : Math.max(prev - 1, 0);
        gearIndexRef.current = next;

        // Reset drag origin so the gear change doesn't cause a jump
        const ds = dragState.current;
        ds.startX = ds.pointerX;
        ds.startValue = valueRef.current;

        return next;
      });
    },
    [gears.length]
  );

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      const ds = dragState.current;
      if (ds.rafId) cancelAnimationFrame(ds.rafId);
    };
  }, []);

  return {
    trackRef,
    isDragging,
    currentGear: gears[gearIndex] ?? 1,
    gearIndex,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onWheel,
    },
  };
}
