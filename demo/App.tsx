import React, { useState } from "react";
import { InfiniteSlider } from "../src";

export function App() {
  const [basic, setBasic] = useState(50);
  const [large, setLarge] = useState(500_000);
  const [precise, setPrecise] = useState(0.5);

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 32 }}>Infinite Slider Demo</h1>

      <Section title="Default (0 – 100)">
        <InfiniteSlider value={basic} onChange={setBasic} />
      </Section>

      <Section title="Large range (0 – 1,000,000)">
        <InfiniteSlider
          value={large}
          onChange={setLarge}
          min={0}
          max={1_000_000}
          step={1}
          sensitivity={0.5}
          gears={[1, 10, 100, 1000, 10000]}
          defaultGearIndex={2}
          formatValue={(v) => v.toLocaleString()}
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
          gears={[0.001, 0.01, 0.1, 1]}
          defaultGearIndex={2}
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
        <strong>How to use:</strong>
        <ul style={{ paddingLeft: 18, marginTop: 4 }}>
          <li>Drag within the track to change the value.</li>
          <li>
            Drag <em>past the edge</em> of the track — the value auto-scrolls
            faster the further you go.
          </li>
          <li>
            Scroll the mouse wheel while dragging to shift gears (sensitivity).
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
