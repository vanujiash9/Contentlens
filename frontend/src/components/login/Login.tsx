import { useState } from "react"
import { getErrorMessage } from "../../api/errors"
import { useAuth } from "../../auth/AuthProvider"
import s from "./Login.module.css"

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ thông tin.")
      return
    }

    setError("")
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (signInError: unknown) {
      setError(getErrorMessage(signInError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.wrapper}>
      <div className={s.inner}>
        {/* Logo */}
        <div className={s.logoArea}>
          <div className={s.logoRow}>
            <div className={s.logoIcon}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="7" r="3.5" stroke="white" strokeWidth="1.6"/>
                <path d="M4 15c0-2.761 2.239-4 5-4s5 1.239 5 4" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <span className={s.logoText}>ContentLens</span>
          </div>
          <p className={s.tagline}>AI research workspace cho nội dung piano</p>
        </div>

        {/* Card */}
        <div className={s.card}>
          <h2 className={s.cardTitle}>Đăng nhập</h2>

          <form onSubmit={handleSubmit} className={s.form}>
            <div>
              <label className={s.fieldLabel}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={s.input}
                onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              />
            </div>

            <div>
              <label className={s.fieldLabel}>Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={s.input}
                onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              />
            </div>

            {error && <div className={s.errorBox}>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className={s.submitBtn}
              style={{
                background: loading ? "#93c5fd" : "#2563eb",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className={s.cardFooter}>
            <span className={s.footerNote}>Đăng nhập bằng tài khoản Supabase của workspace.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
