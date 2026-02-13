import type { CSSProperties } from "react";

/**
 * The three interaction states of the Universal Infinite Slider,
 * determined by vertical offset from the drag origin.
 *
 * - `linear`    — Standard drag. Value tied to horizontal position.
 * - `precision` — Vertical offset reduces sensitivity via continuous transfer function.
 * - `infinite`  — Far vertical offset. Becomes a relative velocity controller (joystick).
 *                 Horizontal displacement from an anchor point = continuous velocity.
 */
export type SliderMode = "linear" | "precision" | "infinite";

export interface InfiniteSliderProps {
  /** Current value (controlled) */
  value: number;
  /** Called when the value changes */
  onChange: (value: number) => void;
  /** Minimum value (default: 0) */
  min?: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Smallest allowed step increment (default: 1) */
  step?: number;
  /** Base pixels-per-step in linear mode — higher = less sensitive (default: 2) */
  sensitivity?: number;

  // ── Precision mode (State B) ──────────────────────────────────────
  /**
   * Vertical distance (px) at which sensitivity reaches its minimum.
   * The transfer function is continuous between 0 and this distance. (default: 150)
   */
  precisionDistance?: number;
  /** Floor multiplier at max precision distance (default: 0.01) */
  minPrecisionScale?: number;

  // ── Infinite / joystick mode (State C) ────────────────────────────
  /**
   * Vertical offset (px) beyond which the slider enters infinite/joystick mode.
   * Must be > precisionDistance. In this mode, horizontal displacement from
   * an anchor point controls the rate-of-change (velocity), not position.
   * (default: 200)
   */
  infiniteThreshold?: number;
  /**
   * In infinite mode, max value-units-per-second at full horizontal displacement.
   * Expressed as a fraction of the total range. (default: 2.0 → 2× range per second)
   */
  infiniteSpeed?: number;
  /**
   * Horizontal distance (px) in infinite mode from the anchor to reach max velocity.
   * (default: 200)
   */
  infiniteRadius?: number;

  // ── Edge overflow ─────────────────────────────────────────────────
  /** Range-per-second speed at max horizontal edge overshoot (default: 1.2) */
  edgeScrollSpeed?: number;
  /** Horizontal overshoot in px needed to reach max edge velocity (default: 200) */
  edgeActivationDistance?: number;

  // ── General ───────────────────────────────────────────────────────
  /** Disable the control */
  disabled?: boolean;
  /** Additional class name on the root element */
  className?: string;
  /** Additional inline styles on the root element */
  style?: CSSProperties;
  /** Custom value formatter for display */
  formatValue?: (value: number) => string;
}
