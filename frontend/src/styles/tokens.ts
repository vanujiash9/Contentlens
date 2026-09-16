// Typography scale — used across all components for consistency
export const fontSize = {
  xs: 11, // captions, badges, timestamps, labels
  sm: 12, // secondary text, table headers, meta
  base: 13, // body text, table rows, descriptions
  md: 14, // card titles, emphasized body
  lg: 16, // section headings (h2)
  xl: 20, // page titles (h1)
} as const

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const

export const fontFamily = {
  ui: "Roboto, Inter, sans-serif",
  display: "Newsreader, Georgia, serif",
  mono: "JetBrains Mono, monospace",
} as const

// Semantic typography
export const typography = {
  pageTitle: {
    mobile: 25,
    desktop: 38,
  },
  pageSubtitle: 14,
  sectionTitle: 16,
  body: 14,
  meta: 12,
  table: 12,
} as const

// Color palette
export const colors = {
  text: {
    primary: "#12100d",
    secondary: "#2f2a23",
    muted: "#6d665c",
    faint: "#9a9185",
    disabled: "#c5bdaf",
  },
  brand: {
    blue: "#1f4ed8",
    blueBg: "#edf3ff",
    blueBorder: "#bfd1ff",
    blueLight: "#dbe6ff",
    navy: "#15130f",
    navyHover: "#211e18",
  },
  status: {
    success: "#16834b",
    successBg: "#ecfdf3",
    successBorder: "#bbf7d0",
    warning: "#b45309",
    warningBg: "#fff7e6",
    warningBorder: "#fedf8b",
    error: "#c2410c",
    errorBg: "#fff1eb",
    errorBorder: "#fed7c7",
    purple: "#6d4aff",
    purpleBg: "#f3f0ff",
  },
  surface: {
    page: "#f7f5f0",
    card: "#fffefa",
    raised: "#ffffff",
    subtle: "#fcfaf5",
    muted: "#f2ede4",
  },
  border: "#e4ded3",
  borderSubtle: "#f0ebe2",
  borderStrong: "#cfc6b8",
} as const

// Chart palette — consistent across all charts
export const chartColors = {
  completed: "#1f4ed8",
  processing: "#b45309",
  pending: "#80766a",
  failed: "#c2410c",
  ai: "#6d4aff",
  human: "#0891b2",
  high: "#1f4ed8",
  medium: "#b45309",
  low: "#80766a",
} as const

// Spacing
export const spacing = {
  pagePadding: { mobile: "22px 16px 94px", desktop: "32px 38px 52px" },
  sectionGap: 18,
  cardPad: "18px 22px",
  cardPadSm: "14px 16px",
  tabPad: "10px 16px",
  controlPadSm: "8px 12px",
  controlPadMd: "10px 18px",
  pageHeaderGap: 24,
  pageHeaderGapMobile: 18,
} as const

export const layout = {
  contentWidth: 1280,
  contentWidthNarrow: 640,
  viewerWidth: 940,
  formWidth: 840,
  sectionTitleSize: 16,
  metaSize: 12,
  tableTextSize: 12,
  cardRadius: 16,
  surfaceRadius: 18,
  controlRadius: 10,
  pillRadius: 999,
  fullRadius: 999,
} as const

export const controlSizes = {
  sm: { minHeight: 34, paddingX: 12, paddingY: 7 },
  md: { minHeight: 42, paddingX: 14, paddingY: 10 },
  lg: { minHeight: 46, paddingX: 18, paddingY: 12 },
} as const

export const motion = {
  fast: "0.14s",
  normal: "0.22s",
} as const

export const shadows = {
  xs: "0 1px 2px rgba(31, 27, 20, 0.05)",
  sm: "0 8px 24px rgba(31, 27, 20, 0.07)",
  md: "0 18px 48px rgba(31, 27, 20, 0.1)",
} as const
