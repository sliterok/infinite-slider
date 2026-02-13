export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundToStep(value: number, step: number): number {
  if (step <= 0) return value;
  const inv = 1 / step;
  return Math.round(value * inv) / inv;
}

export function formatDefault(value: number): string {
  return String(value);
}
