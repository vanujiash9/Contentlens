import type { ReactNode } from "react"
import { layout } from "../../styles/tokens"
import s from "./PageShell.module.css"

interface PageShellProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  maxWidth?: number
  showHeader?: boolean
}

export default function PageShell({
  title,
  subtitle,
  actions,
  children,
  maxWidth = layout.contentWidth,
  showHeader = true,
}: PageShellProps) {
  return (
    <div className={s.shell} style={{ maxWidth }}>
      {showHeader && title ? (
        <header className={s.header}>
          <div className={s.headerText}>
            <h1 className={s.title}>{title}</h1>
            {subtitle ? <p className={s.subtitle}>{subtitle}</p> : null}
          </div>
          {actions ? <div className={s.actions}>{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </div>
  )
}
