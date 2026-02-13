export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getDecimalPlaces(value: number): number {
  const serialized = value.toString().toLowerCase();
  if (serialized.includes("e-")) {
    const [, exponent = "0"] = serialized.split("e-");
    return Number(exponent);
  }
  const dotIndex = serialized.indexOf(".");
  if (dotIndex === -1) return 0;
  return serialized.length - dotIndex - 1;
}

export function roundToStep(value: number, step: number, origin = 0): number {
  if (step <= 0) return value;

  const snapped = Math.round((value - origin) / step) * step + origin;
  const decimals = Math.min(getDecimalPlaces(step), 12);

  return Number(snapped.toFixed(decimals));
}

export function formatDefault(value: number): string {
  return String(value);
}
