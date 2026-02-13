## Purpose
`infinite-slider` implements the interaction model defined in `MEMO.md`:

- Adaptive precision from a secondary input dimension (vertical deviation while dragging)
- Coarse and fine control in one uninterrupted pointer session
- Velocity mode when dragging past track edges for fast range traversal
- Immediate visual feedback of active mode and sensitivity scale

## How It Works
1. Drag horizontally to change value in coarse mode.
2. Move the pointer vertically away from the drag origin to reduce sensitivity (fine mode).
3. Drag beyond the track edges to switch to velocity mode, where speed scales with overshoot.

## Usage
```tsx
import { useState } from "react";
import { InfiniteSlider } from "infinite-slider";

export function Example() {
  const [value, setValue] = useState(500_000);

  return (
    <InfiniteSlider
      value={value}
      onChange={setValue}
      min={0}
      max={1_000_000}
      step={0.01}
      sensitivity={2}
      precisionDistance={170}
      minPrecisionScale={0.0005}
      edgeScrollSpeed={1.6}
      edgeActivationDistance={200}
      formatValue={(v) => v.toLocaleString()}
    />
  );
}
```

## Props
- `value`, `onChange`: controlled value API.
- `min`, `max`, `step`: numeric bounds and quantization.
- `sensitivity`: coarse pixels-per-step ratio.
- `precisionDistance`: vertical px needed to reach minimum precision scale.
- `minPrecisionScale`: smallest sensitivity multiplier in fine mode.
- `edgeScrollSpeed`: range-per-second at maximum edge overshoot.
- `edgeActivationDistance`: horizontal overshoot px for full edge speed.
- `disabled`, `className`, `style`, `formatValue`: presentation and behavior helpers.
