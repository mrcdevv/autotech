export type BarColorKey = "graphite" | "orange" | "blue" | "green" | "red";

export function barFillStyle(color: BarColorKey) {
  return {
    fill: `url(#autotech-bar-${color})`,
    filter: "drop-shadow(0 0 6px rgba(120, 150, 200, 0.45))",
  };
}
