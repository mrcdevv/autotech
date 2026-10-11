export const brand = {
  accent: "#FF7A1A",
  accentHover: "#E96D0F",
  accentDeep: "#B4560F",
  accentInk: "#17181C",
} as const;

export const shell = {
  bg: "#131418",
  hover: "#17181C",
  activeBg: "#1B1D22",
  text: "#9AA0AA",
  textActive: "#ECEDEF",
  icon: "#666C78",
  iconActive: "#ECEDEF",
  divider: "#26282E",
  border: "#3A3E47",
  avatarBg: "#26282E",
  scrollThumb: "#2C2F36",
} as const;

export const surface = {
  canvas: "#F4F2ED",
  base: "#FFFFFF",
  raised: "#FBFAF7",
  sunken: "#EFEDE6",
} as const;

export const border = {
  base: "#E3E0D8",
  strong: "#DEDAD0",
  dashed: "#D3CFC4",
  divider: "#ECE9E1",
} as const;

export const text = {
  primary: "#1D1F24",
  secondary: "#646A75",
  muted: "#4E545E",
  faint: "#9A9E96",
  disabled: "#7B8089",
  placeholder: "#9BA0A8",
} as const;

export const status = {
  warn: { bg: "#F6EBD1", fg: "#7A570E" },
  parts: { bg: "#FBE7D2", fg: "#8A4B12" },
  ok: { bg: "#DFEEE3", fg: "#1E6B41" },
  done: { bg: "#DAEFEB", fg: "#0A5F55" },
  bad: { bg: "#F8E2DC", fg: "#A6371F" },
  info: { bg: "#E2EAF7", fg: "#2C5CB0" },
  testing: { bg: "#EAE4F8", fg: "#4B3390" },
  neutral: { bg: "#EAE8E1", fg: "#4E545E" },
} as const;

export type StatusTone = keyof typeof status;

export const dot = {
  warn: "#C08A14",
  parts: "#D97A1F",
  ok: "#27965A",
  done: "#0E8A7A",
  bad: "#D0452F",
  info: "#3B76D9",
  testing: "#7B5BD6",
  neutral: "#62676F",
} as const;

export const link = {
  base: "#FF7A1A",
  hover: "#FF944D",
} as const;

export const grey = {
  50: "#FBFAF7",
  100: "#F4F2ED",
  200: "#ECE9E1",
  300: "#E3E0D8",
  400: "#D3CFC4",
  500: "#9A9E96",
  600: "#646A75",
  700: "#4E545E",
  800: "#2C2F36",
  900: "#1D1F24",
} as const;

export const radius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 14,
} as const;

export const shadow = {
  sheet: "0 10px 34px rgba(0, 0, 0, 0.5)",
  raised: "0 3px 10px rgba(90, 80, 60, 0.12)",
  none: "none",
} as const;

export const font = {
  sans: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;
