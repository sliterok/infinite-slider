import type { CSSProperties } from "react";

export interface InfiniteSliderProps {
  /** Current value (controlled). */
  value: number;
  /** Called when the value changes. */
  onChange: (value: number) => void;

  /** Initial visible window start. @default 0 */
  windowStart?: number;
  /** Initial visible window end.   @default 100 */
  windowEnd?: number;

  /** Hard minimum value. The slider cannot go below this. @default -Infinity */
  min?: number;
  /** Hard maximum value. The slider cannot exceed this.   @default Infinity */
  max?: number;

  /**
   * Step size. The value is rounded to the nearest step.
   * Use 0 for continuous (no snapping).
   * @default 1
   */
  step?: number;

  /**
   * How much of the track (0‑1 fraction from each edge) counts as the
   * "edge zone" where the window begins shifting.
   * @default 0.15
   */
  edgeZone?: number;

  /**
   * Maximum window-shift speed in window-units per second.
   * @default 200
   */
  maxShiftSpeed?: number;

  /** Disable interaction. */
  disabled?: boolean;

  /** Extra class on the root element. */
  className?: string;
  /** Extra styles on the root element. */
  style?: CSSProperties;
}
