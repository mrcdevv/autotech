export const CHART_COLORS = {
  graphite: { light: "#7996BD", base: "#3C6699", dark: "#1F3F66" },
  orange: { light: "#FFB27A", base: "#FF7A1A", dark: "#D95E00" },
  blue: { light: "#7FB2E8", base: "#2E7DD1", dark: "#1B5699" },
  green: { light: "#6FC58E", base: "#1E8E4E", dark: "#146134" },
  red: { light: "#F09A85", base: "#D9482B", dark: "#A42F17" },
} as const;

export const CHART_PALETTE = [
  "#F57C00",
  "#1976D2",
  "#2E7D32",
  "#F9A825",
  "#D84315",
  "#7B1FA2",
  "#0277BD",
  "#388E3C",
  "#C2185B",
  "#00897B",
  "#8D6E63",
  "#546E7A",
] as const;

export const AXIS_TICK_LABEL = {
  fill: "#8A909B",
  fontSize: 11,
};

export function wrapLabel(text: string, maxCharsPerLine = 12): string {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (`${current} ${word}`.length <= maxCharsPerLine) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current.length > 0) {
    lines.push(current);
  }
  return lines.join("\n");
}

export function leftMarginForLabels(labels: string[], min = 100, max = 220): number {
  const longest = labels.reduce((acc, label) => Math.max(acc, label.length), 0);
  return Math.min(Math.max(min, Math.ceil(longest * 6.8) + 8), max);
}

export const BASE_CHART_SX = {
  "& .MuiChartsGrid-line": {
    stroke: "#ECE9E1",
  },
  "& .MuiChartsTooltip-paper": {
    border: "1px solid #E3E0D8",
    boxShadow: "none",
    borderRadius: 6,
  },
  "& .MuiChartsTooltip-cell": {
    fontSize: 12,
    color: "#1D1F24",
  },
  "& .MuiChartsLegend-label": {
    color: "#646A75",
    fontSize: 12,
  },
  "& .MuiPieArcLabel-root": {
    fill: "#FFFFFF",
    fontSize: 11,
    fontWeight: 600,
  },
};

export const CHART_ANIMATION_SX = {
  "@keyframes chartEnter": {
    from: { opacity: 0, transform: "translateY(10px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  animation: "chartEnter 520ms cubic-bezier(0.22, 0.61, 0.36, 1) both",
  "& .MuiBarElement-root": {
    transition: "filter 200ms ease, opacity 200ms ease",
  },
  "& .MuiPieArc-root": {
    transition: "filter 200ms ease, opacity 200ms ease",
  },
};
