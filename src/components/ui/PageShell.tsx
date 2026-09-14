import type { ReactNode } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { colors, fontWeight, layout, spacing, typography } from "../../styles/tokens";
import s from "./PageShell.module.css";

interface PageShellProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: number;
  showHeader?: boolean;
}

export default function PageShell({
  title,
  subtitle,
  actions,
  children,
  maxWidth = layout.contentWidth,
  showHeader = true,
}: PageShellProps) {
  const isMobile = useIsMobile();

  return (
    <div
      className={s.shell}
      style={{
        padding: isMobile ? spacing.pagePadding.mobile : spacing.pagePadding.desktop,
        maxWidth,
        margin: "0 auto",
      }}
    >
      {showHeader && title ? (
        <div className={s.header} style={{ marginBottom: isMobile ? spacing.pageHeaderGapMobile : spacing.pageHeaderGap }}>
          <div className={s.headerText}>
            <h1
              className={s.title}
              style={{
                fontSize: isMobile ? typography.pageTitle.mobile : typography.pageTitle.desktop,
                fontWeight: fontWeight.bold,
                color: colors.text.primary,
                margin: "0 0 4px",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
            {subtitle ? (
              <p
                className={s.subtitle}
                style={{
                  fontSize: typography.pageSubtitle,
                  color: colors.text.muted,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? <div className={s.actions}>{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
