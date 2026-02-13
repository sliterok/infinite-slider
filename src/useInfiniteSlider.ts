import { useRef, useState, useCallback, useEffect } from "react";
import type { SliderMode } from "./types";
import { clamp, roundToStep } from "./utils";

// ── Options mirror the resolved props from <InfiniteSlider> ─────────
interface UseInfiniteSliderOptions {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  sensitivity: number;
  precisionDistance: number;
  minPrecisionScale: number;
  infiniteThreshold: number;
  infiniteSpeed: number;
  infiniteRadius: number;
  edgeScrollSpeed: number;
  edgeActivationDistance: number;
  disabled: boolean;
}

// ── Pure helpers ─────────────────────────────────────────────────────

/** Hysteresis band (px) so mode doesn't jitter at boundaries. */
const HYSTERESIS = 12;

/**
 * Continuous transfer function for precision mode (State B).
 * Maps upward vertical distance → sensitivity multiplier in [minScale, 1].
 * Uses a quadratic ease-in for a smooth, reversible ramp.
 */
function getPrecisionScale(
  dyUp: number,
  precisionDistance: number,
  minPrecisionScale: number,
): number {
  if (dyUp <= 0) return 1;
  const t = clamp(dyUp / Math.max(precisionDistance, 1), 0, 1);
  const eased = t * t;
  return 1 - eased * (1 - clamp(minPrecisionScale, 0.0001, 1));
}

/**
 * Determine mode from directional vertical offsets with hysteresis.
 *
 * - Drag UP (dyUp > 0)   → precision mode
 * - Drag DOWN (dyDown > 0) → infinite / joystick mode
 * - Near origin           → linear
 */
function resolveMode(
  dyUp: number,
  dyDown: number,
  currentMode: SliderMode,
  infiniteThreshold: number,
): SliderMode {
  if (currentMode === "linear") {
    if (dyDown > HYSTERESIS) return "infinite";
    if (dyUp > HYSTERESIS) return "precision";
    return "linear";
  }
  if (currentMode === "precision") {
    // Can't transition directly to infinite from precision —
    // user must come back near origin first, then go down.
    if (dyUp < HYSTERESIS && dyDown < HYSTERESIS) return "linear";
    if (dyUp >= HYSTERESIS) return "precision";
    return "linear";
  }
  // currentMode === "infinite"
  if (dyDown < HYSTERESIS) return "linear";
  return "infinite";
}

/**
 * Edge-overflow velocity: when pointer goes past track bounds horizontally
 * in linear/precision modes. Quadratic ramp.
 */
function getEdgeVelocity(
  overshootPx: number,
  range: number,
  edgeScrollSpeed: number,
  edgeActivationDistance: number,
): number {
  if (range <= 0 || overshootPx === 0) return 0;
  const dir = Math.sign(overshootPx);
  const t = clamp(Math.abs(overshootPx) / Math.max(edgeActivationDistance, 1), 0, 1);
  return dir * range * edgeScrollSpeed * t * t;
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useInfiniteSlider(opts: UseInfiniteSliderOptions) {
  const {
    value,
    onChange,
    min,
    max,
    step,
    sensitivity,
    precisionDistance,
    minPrecisionScale,
    infiniteThreshold,
    infiniteSpeed,
    infiniteRadius,
    edgeScrollSpeed,
    edgeActivationDistance,
    disabled,
  } = opts;

  const range = max - min;
  const trackRef = useRef<HTMLDivElement>(null);

  // ── Exposed reactive state ──────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<SliderMode>("linear");
  const [precisionScale, setPrecisionScale] = useState(1);

  // ── Mutable refs (avoid stale closures in rAF) ─────────────────
  const valueRef = useRef(value);
  valueRef.current = value;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const modeRef = useRef<SliderMode>("linear");

  const ds = useRef({
    active: false,
    pointerId: -1,
    /** Last tracked X for incremental dx computation */
    prevX: 0,
    /** Y at pointer-down — the origin for vertical offset */
    startY: 0,
    /** X at the moment we entered infinite mode — the "joystick" anchor */
    anchorX: 0,
    /** Current pointer X (updated every move, used by rAF loops) */
    pointerX: 0,
    /** Signed px past track edge (0 when inside) */
    overshoot: 0,
    /** rAF handle for velocity loops (edge-scroll or infinite) */
    rafId: 0,
    lastTime: 0,
    /** precision scale stored as mutable ref for rAF access */
    precisionScale: 1,
    /**
     * Floating-point accumulator for sub-step deltas.
     * Prevents tiny precision-mode movements from rounding to zero.
     */
    accumulator: 0,
  });

  // ── Shared helpers ────────────────────────────────────────────

  /** Apply a raw delta to the accumulator and commit when it crosses a step. */
  const commitDelta = useCallback(
    (delta: number) => {
      if (delta === 0) return;
      const d = ds.current;
      d.accumulator += delta;
      const next = roundToStep(clamp(d.accumulator, min, max), step, min);
      if (next !== valueRef.current) {
        onChangeRef.current(next);
      }
    },
    [min, max, step],
  );

  /** Snap the accumulator to a specific value (used on pointer-down). */
  const setAbsolute = useCallback(
    (val: number) => {
      const snapped = roundToStep(clamp(val, min, max), step, min);
      ds.current.accumulator = snapped;
      if (snapped !== valueRef.current) {
        onChangeRef.current(snapped);
      }
    },
    [min, max, step],
  );

  // ── rAF loop — runs in both edge-scroll and infinite modes ────

  const velocityLoop = useCallback(
    (time: number) => {
      const d = ds.current;
      if (!d.active) {
        d.rafId = 0;
        return;
      }

      const dt = d.lastTime ? (time - d.lastTime) / 1000 : 1 / 60;
      d.lastTime = time;

      const currentMode = modeRef.current;

      if (currentMode === "infinite") {
        // ── Joystick velocity: displacement from anchor → speed ──
        const displacement = d.pointerX - d.anchorX;
        const t = clamp(displacement / Math.max(infiniteRadius, 1), -1, 1);
        const curved = Math.sign(t) * t * t;
        const velocity = curved * range * infiniteSpeed;
        commitDelta(velocity * dt);
      } else if (d.overshoot !== 0) {
        // ── Edge overflow velocity ──
        const velocity = getEdgeVelocity(
          d.overshoot,
          range,
          edgeScrollSpeed,
          edgeActivationDistance,
        );
        commitDelta(velocity * dt * d.precisionScale);
      } else {
        d.rafId = 0;
        return;
      }

      d.rafId = requestAnimationFrame(velocityLoop);
    },
    [range, infiniteSpeed, infiniteRadius, edgeScrollSpeed, edgeActivationDistance, commitDelta],
  );

  const ensureLoop = useCallback(() => {
    if (ds.current.rafId) return;
    ds.current.lastTime = 0;
    ds.current.rafId = requestAnimationFrame(velocityLoop);
  }, [velocityLoop]);

  const stopLoop = useCallback(() => {
    const d = ds.current;
    if (d.rafId) {
      cancelAnimationFrame(d.rafId);
      d.rafId = 0;
    }
    d.overshoot = 0;
  }, []);

  // ── Pointer handlers ──────────────────────────────────────────

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      const track = trackRef.current;
      if (!track) return;

      track.setPointerCapture(e.pointerId);
      const rect = track.getBoundingClientRect();

      // ── Absolute positioning: click sets the value ──
      const fraction = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const clickValue = min + fraction * range;

      const d = ds.current;
      d.active = true;
      d.pointerId = e.pointerId;
      d.prevX = e.clientX;
      d.startY = e.clientY;
      d.anchorX = e.clientX;
      d.pointerX = e.clientX;
      d.overshoot = 0;
      d.precisionScale = 1;

      modeRef.current = "linear";
      setMode("linear");
      setPrecisionScale(1);
      setIsDragging(true);

      setAbsolute(clickValue);
    },
    [disabled, min, range, setAbsolute],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = ds.current;
      if (!d.active) return;
      const track = trackRef.current;
      if (!track) return;

      d.pointerX = e.clientX;
      const rect = track.getBoundingClientRect();

      // ── Directional vertical offsets ──
      // dyUp > 0 means pointer is ABOVE the start point
      // dyDown > 0 means pointer is BELOW the start point
      const rawDy = e.clientY - d.startY;
      const dyUp = Math.max(0, -rawDy);   // negative clientY diff = moved up
      const dyDown = Math.max(0, rawDy);   // positive clientY diff = moved down

      // ── Resolve mode ──
      const prevMode = modeRef.current;
      const nextMode = resolveMode(dyUp, dyDown, prevMode, infiniteThreshold);

      if (nextMode !== prevMode) {
        modeRef.current = nextMode;
        setMode(nextMode);

        if (nextMode === "infinite") {
          // Record anchor X when entering infinite mode
          d.anchorX = e.clientX;
          ensureLoop();
        } else if (prevMode === "infinite") {
          // Leaving infinite → reset prevX to current position to avoid jump
          d.prevX = e.clientX;
          stopLoop();
        }

        if (nextMode === "precision" && prevMode === "linear") {
          // Entering precision: reset prevX so the scale change doesn't cause a jump
          d.prevX = e.clientX;
        }
      }

      // ── Update precision scale (only matters for linear + precision) ──
      if (nextMode !== "infinite") {
        const scale = getPrecisionScale(dyUp, precisionDistance, minPrecisionScale);
        d.precisionScale = scale;
        const rounded = Number(scale.toFixed(3));
        setPrecisionScale(rounded);
      }

      // ── In infinite mode, the rAF loop handles everything ──
      if (nextMode === "infinite") return;

      // ── Linear / precision drag: compute incremental dx ──
      const boundedX = clamp(e.clientX, rect.left, rect.right);
      const dx = boundedX - d.prevX;
      d.prevX = boundedX;

      if (dx !== 0) {
        const baseUnit = step > 0 ? step : Math.max(range / 1000, 1);
        const delta = (dx / Math.max(sensitivity, 0.001)) * baseUnit * d.precisionScale;
        commitDelta(delta);
      }

      // ── Edge overflow detection ──
      if (e.clientX < rect.left) {
        d.overshoot = e.clientX - rect.left;
        ensureLoop();
      } else if (e.clientX > rect.right) {
        d.overshoot = e.clientX - rect.right;
        ensureLoop();
      } else if (d.overshoot !== 0) {
        d.overshoot = 0;
      }
    },
    [
      precisionDistance,
      minPrecisionScale,
      infiniteThreshold,
      sensitivity,
      step,
      range,
      commitDelta,
      ensureLoop,
      stopLoop,
    ],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = ds.current;
      if (!d.active) return;

      const track = trackRef.current;
      if (track) {
        try { track.releasePointerCapture(e.pointerId); } catch { /* noop */ }
      }

      d.active = false;
      d.pointerId = -1;
      stopLoop();
      modeRef.current = "linear";
      setMode("linear");
      setIsDragging(false);
      setPrecisionScale(1);
    },
    [stopLoop],
  );

  // ── Keep accumulator in sync with external value changes ──────

  useEffect(() => {
    if (!ds.current.active) {
      ds.current.accumulator = value;
    }
  }, [value]);

  // ── Cleanup ───────────────────────────────────────────────────

  useEffect(() => () => {
    if (ds.current.rafId) cancelAnimationFrame(ds.current.rafId);
  }, []);

  useEffect(() => {
    if (!disabled) return;
    const d = ds.current;
    if (!d.active) return;
    d.active = false;
    d.pointerId = -1;
    stopLoop();
    modeRef.current = "linear";
    setMode("linear");
    setIsDragging(false);
    setPrecisionScale(1);
  }, [disabled, stopLoop]);

  // ── Return ────────────────────────────────────────────────────

  return {
    trackRef,
    isDragging,
    mode,
    precisionScale,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
}
