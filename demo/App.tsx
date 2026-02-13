import React, { useState } from "react";
import { InfiniteSlider } from "../src";

export function App() {
  const [basic, setBasic] = useState(50);
  const [large, setLarge] = useState(500_000);
  const [precise, setPrecise] = useState(0.5);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 32 }}>Infinite Slider Demo</h1>

      <Section title="Default (0 – 100)">
        <InfiniteSlider value={basic} onChange={setBasic} />
      </Section>

      <Section title="Wide range (0 – 1,000,000)">
        <InfiniteSlider
          value={large}
          onChange={setLarge}
          min={0}
          max={1_000_000}
          step={0.01}
          sensitivity={2}
          precisionDistance={150}
          minPrecisionScale={0.001}
          infiniteThreshold={200}
          infiniteSpeed={2.5}
          infiniteRadius={250}
          edgeScrollSpeed={1.5}
          formatValue={(v) =>
            v.toLocaleString(undefined, { maximumFractionDigits: 2 })
          }
        />
      </Section>

      <Section title="High precision (0 – 1, step 0.001)">
        <InfiniteSlider
          value={precise}
          onChange={setPrecise}
          min={0}
          max={1}
          step={0.001}
          sensitivity={4}
          precisionDistance={120}
          minPrecisionScale={0.02}
          infiniteThreshold={180}
          infiniteSpeed={1.0}
          infiniteRadius={200}
          edgeScrollSpeed={0.8}
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
        <strong>Three-state interaction model:</strong>
        <ul style={{ paddingLeft: 18, marginTop: 4 }}>
          <li>
            <b>Linear</b> — Click to set value, drag left/right to adjust.
          </li>
          <li>
            <b>Precision</b> — Drag <em>upward</em> while holding. The higher
            you go, the finer the control. Origin resets on entry (like
            YouTube scrubbing).
          </li>
          <li>
            <b>Infinite</b> — Drag <em>downward</em> to enter joystick mode.
            Horizontal offset from the entry point controls speed and
            direction. Hold right = increase, left = decrease.
          </li>
          <li>
            <b>Edge overflow</b> — In linear/precision modes, dragging past
            the track edge auto-scrolls the value.
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
