import { useIsMobile } from "../../hooks/useIsMobile";
import { fontSize, fontWeight, colors, layout, spacing } from "../../styles/tokens";

interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: number;
}

export default function PageShell({ title, subtitle, actions, children, maxWidth = layout.contentWidth }: PageShellProps) {
  const isMobile = useIsMobile();
  return (
    <div style={{
      padding: isMobile ? spacing.pagePadding.mobile : spacing.pagePadding.desktop,
      maxWidth,
      margin: "0 auto",
    }}>
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: 12, marginBottom: isMobile ? 20 : 24,
      }}>
        <div>
          <h1 style={{
            fontSize: isMobile ? fontSize.lg : fontSize.xl,
            fontWeight: fontWeight.bold,
            color: colors.text.primary,
            margin: "0 0 4px",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: fontSize.base, color: colors.text.muted, margin: 0, lineHeight: 1.5 }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
            {actions}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
