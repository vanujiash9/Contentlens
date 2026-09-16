import s from "./Card.module.css"

interface CardProps {
  children: React.ReactNode
  padding?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export function Card({
  children,
  padding = "18px 22px",
  style,
  onClick,
}: CardProps) {
  return (
    <div
      className={`${s.card} ${onClick ? s.interactive : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      style={{ padding, ...style }}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  action?: React.ReactNode
}

export function CardHeader({ title, action }: CardHeaderProps) {
  return (
    <div className={s.header}>
      <h2 className={s.title}>{title}</h2>
      {action}
    </div>
  )
}
