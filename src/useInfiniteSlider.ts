import { useRef, useState, useCallback, useEffect } from "react";
import { clamp, roundToStep } from "./utils";

type PrecisionMode = "coarse" | "fine";

interface UseInfiniteSliderOptions {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  sensitivity: number;
  precisionDistance: number;
  minPrecisionScale: number;
  edgeScrollSpeed: number;
  edgeActivationDistance: number;
  disabled: boolean;
}

function getPrecisionScale(
  distanceFromOriginY: number,
  precisionDistance: number,
  minPrecisionScale: number
): number {
  const normalized = clamp(
    distanceFromOriginY / Math.max(precisionDistance, 1),
    0,
    1
  );
  const eased = normalized * normalized;
  const boundedMinScale = clamp(minPrecisionScale, 0.0001, 1);
  return 1 - eased * (1 - boundedMinScale);
}

function getEdgeVelocityPerSecond(
  overshootPx: number,
  range: number,
  step: number,
  edgeScrollSpeed: number,
  edgeActivationDistance: number
): number {
  if (range <= 0 || overshootPx === 0) return 0;

  const direction = Math.sign(overshootPx);
  const normalized = clamp(
    Math.abs(overshootPx) / Math.max(edgeActivationDistance, 1),
    0,
    1
  );
  const ramp = normalized * normalized;

  const minSpeed = Math.max(step, range * 0.002) * 30;
  const maxSpeed = Math.max(minSpeed, range * Math.max(edgeScrollSpeed, 0));
  const speed = minSpeed + (maxSpeed - minSpeed) * ramp;

  return direction * speed;
}

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
    edgeScrollSpeed,
    edgeActivationDistance,
    disabled,
  } = opts;

  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isVelocityMode, setIsVelocityMode] = useState(false);
  const [precisionScale, setPrecisionScale] = useState(1);
  const precisionScaleRef = useRef(1);
  const precisionMode: PrecisionMode = precisionScale <= 0.35 ? "fine" : "coarse";

  const dragState = useRef({
    active: false,
    pointerId: -1,
    pointerX: 0,
    startY: 0,
    rafId: 0,
    lastTime: 0,
    overshoot: 0,
  });

  const valueRef = useRef(value);
  valueRef.current = value;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const applyValueDelta = useCallback(
    (delta: number) => {
      if (delta === 0) return;

      const nextValue = roundToStep(
        clamp(valueRef.current + delta, min, max),
        step,
        min
      );
      if (nextValue !== valueRef.current) {
        onChangeRef.current(nextValue);
      }
    },
    [min, max, step]
  );

  const edgeScrollLoop = useCallback(
    (time: number) => {
      const ds = dragState.current;
      if (!ds.active || ds.overshoot === 0) {
        ds.rafId = 0;
        setIsVelocityMode(false);
        return;
      }

      const dt = ds.lastTime ? (time - ds.lastTime) / 1000 : 0.016;
      ds.lastTime = time;

      const velocity = getEdgeVelocityPerSecond(
        ds.overshoot,
        max - min,
        step,
        edgeScrollSpeed,
        edgeActivationDistance
      );
      applyValueDelta(velocity * dt);

      ds.rafId = requestAnimationFrame(edgeScrollLoop);
    },
    [
      min,
      max,
      step,
      edgeScrollSpeed,
      edgeActivationDistance,
      applyValueDelta,
    ]
  );

  const startEdgeScroll = useCallback(() => {
    const ds = dragState.current;
    if (ds.rafId) return;

    setIsVelocityMode(true);
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
    setIsVelocityMode(false);
  }, []);

  const updatePrecisionScale = useCallback((nextScale: number) => {
    const rounded = Number(clamp(nextScale, 0.0001, 1).toFixed(3));
    if (rounded === precisionScaleRef.current) return;

    precisionScaleRef.current = rounded;
    setPrecisionScale(rounded);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;

      const track = trackRef.current;
      if (!track) return;

      track.setPointerCapture(e.pointerId);
      const ds = dragState.current;
      ds.active = true;
      ds.pointerId = e.pointerId;
      ds.pointerX = e.clientX;
      ds.startY = e.clientY;

      setIsDragging(true);
      updatePrecisionScale(1);
    },
    [disabled, updatePrecisionScale]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const ds = dragState.current;
      if (!ds.active) return;

      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const boundedX = clamp(e.clientX, rect.left, rect.right);
      const dx = boundedX - ds.pointerX;
      ds.pointerX = boundedX;

      const scale = getPrecisionScale(
        Math.abs(e.clientY - ds.startY),
        precisionDistance,
        minPrecisionScale
      );
      updatePrecisionScale(scale);

      if (dx !== 0) {
        const baseUnit = step > 0 ? step : Math.max((max - min) / 1000, 1);
        const delta =
          (dx / Math.max(sensitivity, 0.001)) * baseUnit * precisionScaleRef.current;
        applyValueDelta(delta);
      }

      if (e.clientX < rect.left) {
        ds.overshoot = e.clientX - rect.left;
        startEdgeScroll();
        return;
      }

      if (e.clientX > rect.right) {
        ds.overshoot = e.clientX - rect.right;
        startEdgeScroll();
        return;
      }

      if (ds.overshoot !== 0) {
        stopEdgeScroll();
      }
    },
    [
      precisionDistance,
      minPrecisionScale,
      sensitivity,
      step,
      min,
      max,
      updatePrecisionScale,
      applyValueDelta,
      startEdgeScroll,
      stopEdgeScroll,
    ]
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
          // noop
        }
      }

      ds.active = false;
      ds.pointerId = -1;
      stopEdgeScroll();
      setIsDragging(false);
      updatePrecisionScale(1);
    },
    [stopEdgeScroll, updatePrecisionScale]
  );

  useEffect(() => {
    return () => {
      const ds = dragState.current;
      if (ds.rafId) cancelAnimationFrame(ds.rafId);
    };
  }, []);

  useEffect(() => {
    if (!disabled) return;

    const ds = dragState.current;
    if (!ds.active) return;

    ds.active = false;
    ds.pointerId = -1;
    stopEdgeScroll();
    setIsDragging(false);
    updatePrecisionScale(1);
  }, [disabled, stopEdgeScroll, updatePrecisionScale]);

  return {
    trackRef,
    isDragging,
    isVelocityMode,
    precisionMode,
    precisionScale,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
}
