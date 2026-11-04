import React, { useMemo } from "react";
import type { InfiniteSliderProps } from "./types";
import { useInfiniteSlider } from "./useInfiniteSlider";

/* ── tick helpers ──────────────────────────────────────── */

function niceStep(range: number): number {
  const rough = range / 10;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const res = rough / mag;
  if (res <= 1) return mag;
  if (res <= 2) return 2 * mag;
  if (res <= 5) return 5 * mag;
  return 10 * mag;
}

function buildTicks(start: number, end: number) {
  const span = end - start;
  const majorStep = niceStep(span);
  const minorStep = majorStep / 5;

  const ticks: { pos: number; major: boolean; label?: string }[] = [];
  const first = Math.floor(start / minorStep) * minorStep;

  for (let v = first; v <= end + minorStep * 0.5; v += minorStep) {
    const ratio = (v - start) / span;
    if (ratio < -0.01 || ratio > 1.01) continue;

    const isMajor =
      Math.abs(Math.round(v / majorStep) * majorStep - v) < minorStep * 0.01;
    ticks.push({
      pos: ratio,
      major: isMajor,
      label: isMajor ? formatLabel(Math.round(v / majorStep) * majorStep) : undefined,
    });
  }
  return ticks;
}

function formatLabel(v: number): string {
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return String(Math.round(v * 100) / 100);
}

/* ── component ─────────────────────────────────────────── */

export function InfiniteSlider(props: InfiniteSliderProps) {
  const {
    value,
    onChange,
    windowStart,
    windowEnd,
    min,
    max,
    step,
    edgeZone,
    maxShiftSpeed,
    disabled = false,
    className,
    style,
  } = props;

  const { trackRef, state, beginDrag } = useInfiniteSlider({
    value,
    onChange,
    windowStart,
    windowEnd,
    min,
    max,
    step,
    edgeZone,
    maxShiftSpeed,
    disabled,
  });

  const ticks = useMemo(
    () => buildTicks(state.winStart, state.winEnd),
    [state.winStart, state.winEnd],
  );

  const pct = state.knobRatio * 100;

  // Edge-glow intensity scales with pressure.
  const glowOpacity = state.edgePressure * 0.55;

  return (
    <div
      className={className}
      style={{
        ...style,
        opacity: disabled ? 0.45 : 1,
        pointerEvents: disabled ? "none" : undefined,
      }}
    >
      {/* track wrapper */}
      <div
        ref={trackRef}
        onPointerDown={(e) => {
          e.preventDefault();
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          beginDrag(e.clientX);
        }}
        style={{
          position: "relative",
          height: 48,
          cursor: disabled ? "default" : "pointer",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {/* ── edge glows ── */}
        {state.shiftDir === -1 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 8,
              background:
                "linear-gradient(90deg, rgba(99,132,255,.5) 0%, transparent 40%)",
              opacity: glowOpacity,
              pointerEvents: "none",
              transition: "opacity .08s",
            }}
          />
        )}
        {state.shiftDir === 1 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 8,
              background:
                "linear-gradient(270deg, rgba(99,132,255,.5) 0%, transparent 40%)",
              opacity: glowOpacity,
              pointerEvents: "none",
              transition: "opacity .08s",
            }}
          />
        )}

        {/* ── tick marks ── */}
        {ticks.map((t, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${t.pos * 100}%`,
              bottom: 0,
              width: 1,
              height: t.major ? 18 : 10,
              background: t.major
                ? "rgba(0,0,0,.25)"
                : "rgba(0,0,0,.10)",
              transition: "left .04s linear",
            }}
          />
        ))}

        {/* ── tick labels ── */}
        {ticks
          .filter((t) => t.major && t.label)
          .map((t, i) => (
            <span
              key={`l${i}`}
              style={{
                position: "absolute",
                left: `${t.pos * 100}%`,
                bottom: 20,
                transform: "translateX(-50%)",
                fontSize: 10,
                color: "rgba(0,0,0,.35)",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              {t.label}
            </span>
          ))}

        {/* ── track bar ── */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 6,
            height: 4,
            borderRadius: 2,
            background: "rgba(0,0,0,.08)",
          }}
        />

        {/* ── filled portion ── */}
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 6,
            height: 4,
            borderRadius: 2,
            width: `${pct}%`,
            background: "#6384ff",
            transition: state.dragging ? "none" : "width .15s ease",
          }}
        />

        {/* ── knob ── */}
        <div
          style={{
            position: "absolute",
            left: `${pct}%`,
            bottom: 0,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            border: "2px solid #6384ff",
            boxShadow: state.dragging
              ? "0 0 0 6px rgba(99,132,255,.18), 0 2px 8px rgba(0,0,0,.15)"
              : "0 2px 6px rgba(0,0,0,.12)",
            transform: "translate(-50%, 50%) translateY(-8px)",
            transition: state.dragging
              ? "box-shadow .15s"
              : "left .15s ease, box-shadow .15s",
          }}
        />
      </div>
    </div>
  );
}
