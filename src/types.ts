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
  /** Base pixels per step — higher = less sensitive (default: 2) */
  sensitivity?: number;
  /** Gear multipliers for the step, ordered smallest to largest (default: [0.01, 0.1, 1, 10, 100]) */
  gears?: number[];
  /** Index into gears[] for the initial gear (default: 2) */
  defaultGearIndex?: number;
  /** Speed factor for edge-overflow auto-scroll (default: 0.3) */
  edgeScrollSpeed?: number;
  /** Disable the control */
  disabled?: boolean;
  /** Additional class name on the root element */
  className?: string;
  /** Additional inline styles on the root element */
  style?: CSSProperties;
  /** Custom value formatter for display */
  formatValue?: (value: number) => string;
}
