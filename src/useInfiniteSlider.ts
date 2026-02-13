import { useCallback, useEffect, useRef, useState } from "react";

export interface UseInfiniteSliderOptions {
  value: number;
  onChange: (v: number) => void;
  windowStart?: number;
  windowEnd?: number;
  step?: number;
  edgeZone?: number;
  maxShiftSpeed?: number;
  disabled?: boolean;
}

export interface SliderState {
  winStart: number;
  winEnd: number;
  /** 0‑1 normalised knob position within current window */
  knobRatio: number;
  /** True while the user is dragging */
  dragging: boolean;
  /** –1 | 0 | 1  — current shift direction (left / none / right) */
  shiftDir: -1 | 0 | 1;
  /** 0‑1 intensity of current edge pressure */
  edgePressure: number;
}

export function useInfiniteSlider(opts: UseInfiniteSliderOptions) {
  const {
    value,
    onChange,
    windowStart: initWinStart = 0,
    windowEnd: initWinEnd = 100,
    step = 1,
    edgeZone = 0.15,
    maxShiftSpeed = 200,
    disabled = false,
  } = opts;

  const [winStart, setWinStart] = useState(initWinStart);
  const [winEnd, setWinEnd] = useState(initWinEnd);
  const [dragging, setDragging] = useState(false);
  const [shiftDir, setShiftDir] = useState<-1 | 0 | 1>(0);
  const [edgePressure, setEdgePressure] = useState(0);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);

  // Mutable refs that the rAF loop reads without re-renders.
  const liveWin = useRef({ start: initWinStart, end: initWinEnd });
  const liveValue = useRef(value);
  const liveDragging = useRef(false);
  const liveKnobX = useRef(0.5); // 0‑1 position where the pointer currently is

  // Keep refs in sync.
  useEffect(() => { liveValue.current = value; }, [value]);
  useEffect(() => {
    liveWin.current = { start: winStart, end: winEnd };
  }, [winStart, winEnd]);

  // ── helpers ──────────────────────────────────────────────

  const snap = useCallback(
    (v: number) => (step > 0 ? Math.round(v / step) * step : v),
    [step],
  );

  const ratioToValue = useCallback(
    (ratio: number) => {
      const { start, end } = liveWin.current;
      return snap(start + ratio * (end - start));
    },
    [snap],
  );

  // ── rAF loop for edge-shifting ──────────────────────────

  const tick = useCallback(
    (time: number) => {
      if (!liveDragging.current) return;

      const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = time;

      const x = liveKnobX.current;
      let dir: -1 | 0 | 1 = 0;
      let pressure = 0;

      if (x < edgeZone) {
        dir = -1;
        pressure = 1 - x / edgeZone; // 0→1 as x goes from edgeZone→0
      } else if (x > 1 - edgeZone) {
        dir = 1;
        pressure = (x - (1 - edgeZone)) / edgeZone;
      }

      setShiftDir(dir);
      setEdgePressure(pressure);

      if (dir !== 0 && dt > 0) {
        // Ease the pressure with a power curve for nicer feel.
        const eased = pressure * pressure;
        const speed = eased * maxShiftSpeed;
        const delta = dir * speed * dt;

        const { start, end } = liveWin.current;
        const span = end - start;
        const newStart = start + delta;
        const newEnd = newStart + span;

        liveWin.current = { start: newStart, end: newEnd };
        setWinStart(newStart);
        setWinEnd(newEnd);

        // Re-derive value from the (unchanged) knob position in the new window.
        const newVal = snap(newStart + x * span);
        liveValue.current = newVal;
        onChange(newVal);
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [edgeZone, maxShiftSpeed, onChange, snap],
  );

  // ── pointer helpers ─────────────────────────────────────

  const pointerRatio = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0.5;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const beginDrag = useCallback(
    (clientX: number) => {
      if (disabled) return;
      liveDragging.current = true;
      setDragging(true);
      lastTimeRef.current = 0;

      const r = pointerRatio(clientX);
      liveKnobX.current = r;
      const v = ratioToValue(r);
      liveValue.current = v;
      onChange(v);

      rafRef.current = requestAnimationFrame(tick);
    },
    [disabled, onChange, pointerRatio, ratioToValue, tick],
  );

  const moveDrag = useCallback(
    (clientX: number) => {
      if (!liveDragging.current) return;
      const r = pointerRatio(clientX);
      liveKnobX.current = r;

      // If inside the safe zone, update value immediately.
      if (r >= edgeZone && r <= 1 - edgeZone) {
        const v = ratioToValue(r);
        liveValue.current = v;
        onChange(v);
      }
    },
    [edgeZone, onChange, pointerRatio, ratioToValue],
  );

  const endDrag = useCallback(() => {
    liveDragging.current = false;
    setDragging(false);
    setShiftDir(0);
    setEdgePressure(0);
    cancelAnimationFrame(rafRef.current);
  }, []);

  // ── global mouse / touch listeners while dragging ───────

  useEffect(() => {
    const onMove = (e: PointerEvent) => moveDrag(e.clientX);
    const onUp = () => endDrag();

    if (dragging) {
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    }
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragging, moveDrag, endDrag]);

  // Cleanup rAF on unmount.
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // ── derived state ───────────────────────────────────────

  const span = winEnd - winStart;
  const knobRatio = span === 0 ? 0.5 : (value - winStart) / span;

  const state: SliderState = {
    winStart,
    winEnd,
    knobRatio: Math.max(0, Math.min(1, knobRatio)),
    dragging,
    shiftDir,
    edgePressure,
  };

  return { trackRef, state, beginDrag, moveDrag, endDrag } as const;
}
