import { colors } from "../../styles/tokens";

interface CardProps {
  children: React.ReactNode;
  padding?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Card({ children, padding = "16px 20px", style, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: colors.surface.card,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding,
        cursor: onClick ? "pointer" : undefined,
        transition: onClick ? "box-shadow 0.15s" : undefined,
        ...style,
      }}
      onMouseEnter={onClick ? (e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)") : undefined}
      onMouseLeave={onClick ? (e) => (e.currentTarget.style.boxShadow = "none") : undefined}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, action }: CardHeaderProps) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: 16,
    }}>
      <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>{title}</h2>
      {action}
    </div>
  );
}
