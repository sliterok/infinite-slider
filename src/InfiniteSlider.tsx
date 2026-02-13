import React from "react";
import type { InfiniteSliderProps } from "./types";
import { useInfiniteSlider } from "./useInfiniteSlider";
import { formatDefault } from "./utils";

const DEFAULT_GEARS = [0.01, 0.1, 1, 10, 100];

export const InfiniteSlider: React.FC<InfiniteSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  sensitivity = 2,
  gears = DEFAULT_GEARS,
  defaultGearIndex = 2,
  edgeScrollSpeed = 0.3,
  disabled = false,
  className,
  style,
  formatValue = formatDefault,
}) => {
  const { trackRef, isDragging, currentGear, bind } = useInfiniteSlider({
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
  });

  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

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
      {/* Track */}
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
        }}
      >
        {/* Filled portion */}
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

        {/* Thumb */}
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

      {/* Value + Gear display */}
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
        <span>{formatValue(value)}</span>
        {isDragging && (
          <span
            style={{
              padding: "1px 6px",
              borderRadius: 4,
              background: "#333",
              color: "#fff",
              fontSize: 11,
            }}
          >
            ×{currentGear}
          </span>
        )}
      </div>
    </div>
  );
};
