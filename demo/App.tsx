import React, { useState } from "react";
import { InfiniteSlider } from "../src";

export function App() {
  const [v1, setV1] = useState(50);
  const [v2, setV2] = useState(0);
  const [v3, setV3] = useState(500);
  const [v4, setV4] = useState(25);

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 16px" }}>
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>Infinite Adaptive Slider</h1>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 36, lineHeight: 1.5 }}>
        Drag normally in the middle. Push the knob toward an edge and the window
        shifts — the harder you push, the faster it scrolls. The range is
        unlimited.
      </p>

      {/* ── Default ── */}
      <Section label="Default (0–100, step 1)" value={v1}>
        <InfiniteSlider value={v1} onChange={setV1} />
      </Section>

      {/* ── Continuous ── */}
      <Section label="Continuous (no step)" value={v2.toFixed(2)}>
        <InfiniteSlider
          value={v2}
          onChange={setV2}
          windowStart={-50}
          windowEnd={50}
          step={0}
        />
      </Section>

      {/* ── Large range ── */}
      <Section label="Large range (0–1 000, step 10)" value={v3}>
        <InfiniteSlider
          value={v3}
          onChange={setV3}
          windowStart={0}
          windowEnd={1000}
          step={10}
        />
      </Section>

      {/* ── Hard limits ── */}
      <Section label="Hard limits (min 0, max 100)" value={v4}>
        <InfiniteSlider
          value={v4}
          onChange={setV4}
          windowStart={0}
          windowEnd={50}
          min={0}
          max={100}
        />
      </Section>
    </div>
  );
}

function Section({
  label,
  value,
  children,
}: {
  label: string;
  value: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 13, color: "#888" }}>{label}</span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </span>
      </div>
      {children}
    </div>
  );
}
