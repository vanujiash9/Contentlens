// Typography scale — used across all components for consistency
export const fontSize = {
  xs: 11,    // captions, badges, timestamps, labels
  sm: 12,    // secondary text, table headers, meta
  base: 13,  // body text, table rows, descriptions
  md: 14,    // card titles, emphasized body
  lg: 16,    // section headings (h2)
  xl: 20,    // page titles (h1)
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// Color palette
export const colors = {
  text: {
    primary: "#111827",
    secondary: "#374151",
    muted: "#6b7280",
    faint: "#9ca3af",
    disabled: "#d1d5db",
  },
  brand: {
    blue: "#2563eb",
    blueBg: "#eff6ff",
    blueBorder: "#bfdbfe",
    blueLight: "#dbeafe",
  },
  status: {
    success: "#16a34a",
    successBg: "#f0fdf4",
    successBorder: "#bbf7d0",
    warning: "#d97706",
    warningBg: "#fffbeb",
    warningBorder: "#fde68a",
    error: "#dc2626",
    errorBg: "#fef2f2",
    errorBorder: "#fecaca",
    purple: "#7c3aed",
    purpleBg: "#f5f3ff",
  },
  surface: {
    page: "#f5f6f8",
    card: "#ffffff",
    subtle: "#f9fafb",
    muted: "#f3f4f6",
  },
  border: "#e5e7eb",
  borderSubtle: "#f3f4f6",
} as const;

// Chart palette — consistent across all charts
export const chartColors = {
  completed: "#2563eb",
  processing: "#f59e0b",
  pending: "#94a3b8",
  failed: "#ef4444",
  ai: "#7c3aed",
  human: "#0891b2",
  high: "#2563eb",
  medium: "#d97706",
  low: "#94a3b8",
} as const;

// Spacing
export const spacing = {
  pagePadding: { mobile: "20px 16px", desktop: "28px 32px" },
  sectionGap: 16,
  cardPad: "16px 20px",
  cardPadSm: "14px 16px",
  tabPad: "10px 16px",
  controlPadSm: "8px 12px",
  controlPadMd: "10px 18px",
} as const;

export const layout = {
  contentWidth: 1060,
  contentWidthNarrow: 640,
  viewerWidth: 820,
  pageTitleSize: { mobile: 18, desktop: 22 },
  sectionTitleSize: 11,
  metaSize: 13,
  cardRadius: 10,
  controlRadius: 6,
  pillRadius: 4,
  fullRadius: 999,
} as const;

export const motion = {
  fast: "0.12s",
  normal: "0.15s",
} as const;
