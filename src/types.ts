import type { CSSProperties } from "react";

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
  /** Base pixels per step in coarse mode (default: 2) */
  sensitivity?: number;
  /**
   * Vertical distance in pixels required to reach minimum sensitivity.
   * Move farther from the drag origin for finer control. (default: 140)
   */
  precisionDistance?: number;
  /** Minimum sensitivity multiplier reached in fine mode (default: 0.01) */
  minPrecisionScale?: number;
  /** Range-per-second speed at max horizontal edge overshoot (default: 1.2) */
  edgeScrollSpeed?: number;
  /** Horizontal overshoot in px needed to reach max edge velocity (default: 220) */
  edgeActivationDistance?: number;
  /** Disable the control */
  disabled?: boolean;
  /** Additional class name on the root element */
  className?: string;
  /** Additional inline styles on the root element */
  style?: CSSProperties;
  /** Custom value formatter for display */
  formatValue?: (value: number) => string;
}
