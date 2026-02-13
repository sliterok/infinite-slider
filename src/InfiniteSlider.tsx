import React from "react";
import type { InfiniteSliderProps } from "./types";
import { useInfiniteSlider } from "./useInfiniteSlider";
import { clamp, formatDefault } from "./utils";

export const InfiniteSlider: React.FC<InfiniteSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  sensitivity = 2,
  precisionDistance = 140,
  minPrecisionScale = 0.01,
  edgeScrollSpeed = 1.2,
  edgeActivationDistance = 220,
  disabled = false,
  className,
  style,
  formatValue = formatDefault,
}) => {
  const {
    trackRef,
    isDragging,
    isVelocityMode,
    precisionMode,
    precisionScale,
    bind,
  } = useInfiniteSlider({
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
  });

  const span = max - min;
  const clampedValue = clamp(value, min, max);
  const pct = span <= 0 ? 0 : ((clampedValue - min) / span) * 100;

  const feedbackLabel = isVelocityMode
    ? "velocity"
    : precisionMode === "fine"
      ? "fine"
      : "coarse";
  const feedbackColor = isVelocityMode
    ? "#9a3f00"
    : precisionMode === "fine"
      ? "#0d6a3f"
      : "#2b2b2b";

  return (
    <div
      className={className}
      style={{
        position: "relative",
        userSelect: "none",
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      <div
        ref={trackRef}
        {...bind}
        style={{
          position: "relative",
          height: 32,
          borderRadius: 6,
          background: "#e2e2e2",
          cursor: disabled ? "default" : "ew-resize",
          touchAction: "none",
          overflow: "hidden",
          outline: isDragging ? "1px solid #6e6e6e" : "1px solid transparent",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: `${pct}%`,
            background: "#4f8cff",
            borderRadius: 6,
            pointerEvents: "none",
            transition: isDragging ? "none" : "width 0.1s ease-out",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 2,
            bottom: 2,
            left: `${pct}%`,
            width: 16,
            marginLeft: -8,
            borderRadius: 4,
            background: "#fff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
            pointerEvents: "none",
            transition: isDragging ? "none" : "left 0.1s ease-out",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 6,
          fontSize: 13,
          fontFamily: "monospace",
          color: "#555",
        }}
      >
        <span>{formatValue(clampedValue)}</span>
        {isDragging && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "2px 7px",
              borderRadius: 4,
              background: feedbackColor,
              color: "#fff",
              fontSize: 11,
              textTransform: "uppercase",
            }}
          >
            <span>{feedbackLabel}</span>
            <span style={{ opacity: 0.85 }}>x{precisionScale.toFixed(3)}</span>
          </span>
        )}
      </div>
    </div>
  );
};
