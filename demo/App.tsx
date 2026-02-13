import React, { useState } from "react";
import { InfiniteSlider } from "../src";

export function App() {
  const [basic, setBasic] = useState(50);
  const [large, setLarge] = useState(500_000);
  const [precise, setPrecise] = useState(0.5);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 32 }}>Infinite Slider Demo</h1>

      <Section title="Default (0 - 100)">
        <InfiniteSlider value={basic} onChange={setBasic} />
      </Section>

      <Section title="Wide range with adaptive precision (0 - 1,000,000)">
        <InfiniteSlider
          value={large}
          onChange={setLarge}
          min={0}
          max={1_000_000}
          step={0.01}
          sensitivity={2}
          precisionDistance={170}
          minPrecisionScale={0.0005}
          edgeScrollSpeed={1.6}
          edgeActivationDistance={200}
          formatValue={(v) => v.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        />
      </Section>

      <Section title="High precision (0 - 1, step 0.001)">
        <InfiniteSlider
          value={precise}
          onChange={setPrecise}
          min={0}
          max={1}
          step={0.001}
          sensitivity={4}
          precisionDistance={120}
          minPrecisionScale={0.02}
          edgeScrollSpeed={1}
          formatValue={(v) => v.toFixed(3)}
        />
      </Section>

      <div
        style={{
          marginTop: 40,
          padding: 16,
          borderRadius: 8,
          background: "#fff",
          fontSize: 13,
          lineHeight: 1.6,
          color: "#666",
        }}
      >
        <strong>Interaction model:</strong>
        <ul style={{ paddingLeft: 18, marginTop: 4 }}>
          <li>Drag left or right to change value in coarse mode.</li>
          <li>Move the pointer up or down while dragging for fine precision.</li>
          <li>
            Push past left or right track edges to enter velocity mode for fast range
            traversal.
          </li>
        </ul>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}
