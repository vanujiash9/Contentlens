import { useState, useEffect, useRef, useCallback } from "react";
import { fontWeight, fontSize } from "../../styles/tokens";

const CORRECT_PIN = "240689";
const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 30;

interface PinGateProps {
  onUnlock: () => void;
  onBack: () => void;
}

type State = "idle" | "wrong" | "locked" | "unlocking";

export default function PinGate({ onUnlock, onBack }: PinGateProps) {
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [uiState, setUiState] = useState<State>("idle");
  const [lockTimer, setLockTimer] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startLockout = useCallback(() => {
    setUiState("locked");
    setLockTimer(LOCKOUT_SECONDS);
    timerRef.current = setInterval(() => {
      setLockTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setUiState("idle");
          setAttempts(0);
          setPin("");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (uiState === "locked" || uiState === "unlocking") return;
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPin(val);
    setUiState("idle");

    if (val.length === 6) {
      if (val === CORRECT_PIN) {
        setUiState("unlocking");
        setTimeout(onUnlock, 800);
      } else {
        const next = attempts + 1;
        setAttempts(next);
        setShakeKey((k) => k + 1);
        if (next >= MAX_ATTEMPTS) {
          setTimeout(startLockout, 400);
        } else {
          setUiState("wrong");
          setTimeout(() => { setPin(""); setUiState("idle"); inputRef.current?.focus(); }, 700);
        }
      }
    }
  };

  const attemptsLeft = MAX_ATTEMPTS - attempts;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "linear-gradient(145deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* Back */}
      <button
        onClick={onBack}
        style={{
          position: "absolute", top: 20, left: 20,
          background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 6, color: "rgba(255,255,255,0.5)", padding: "6px 12px",
          fontSize: fontSize.sm, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M7.5 2L3 6l4.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Quay lại
      </button>

      {/* Card */}
      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16,
        padding: "40px 48px",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 0,
        backdropFilter: "blur(12px)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.15)",
        minWidth: 300,
      }}>
        {/* Lock icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: uiState === "locked" ? "rgba(239,68,68,0.15)" : "rgba(124,58,237,0.15)",
          border: `1px solid ${uiState === "locked" ? "rgba(239,68,68,0.3)" : "rgba(124,58,237,0.3)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20,
          transition: "background 0.3s, border-color 0.3s",
        }}>
          {uiState === "locked" ? (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="4" y="10" width="14" height="10" rx="2.5" stroke="#ef4444" strokeWidth="1.6"/>
              <path d="M7 10V7a4 4 0 018 0v3" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round"/>
              <circle cx="11" cy="15" r="1.5" fill="#ef4444"/>
            </svg>
          ) : uiState === "unlocking" ? (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="4" y="10" width="14" height="10" rx="2.5" stroke="#22c55e" strokeWidth="1.6"/>
              <path d="M7 10V7a4 4 0 018 0" stroke="#22c55e" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M8.5 15l2 2 3.5-3.5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="4" y="10" width="14" height="10" rx="2.5" stroke="#7c3aed" strokeWidth="1.6"/>
              <path d="M7 10V7a4 4 0 018 0v3" stroke="#7c3aed" strokeWidth="1.6" strokeLinecap="round"/>
              <circle cx="11" cy="15" r="1.5" fill="#7c3aed"/>
            </svg>
          )}
        </div>

        <div style={{ fontSize: 17, fontWeight: fontWeight.bold, color: "rgba(255,255,255,0.92)", marginBottom: 6, letterSpacing: "-0.01em" }}>
          Khu vực Admin
        </div>
        <div style={{ fontSize: fontSize.sm, color: "rgba(255,255,255,0.35)", marginBottom: 28, textAlign: "center" }}>
          Nhập mã PIN để truy cập AI Control
        </div>

        {/* PIN dots with shake animation */}
        <style>{`
          @keyframes pinShake {
            0%,100% { transform: translateX(0); }
            15% { transform: translateX(-8px); }
            30% { transform: translateX(7px); }
            45% { transform: translateX(-6px); }
            60% { transform: translateX(5px); }
            75% { transform: translateX(-3px); }
          }
          @keyframes pinUnlock {
            0% { transform: scale(1); }
            50% { transform: scale(1.06); }
            100% { transform: scale(1); }
          }
        `}</style>

        <div
          key={shakeKey}
          style={{
            display: "flex", gap: 10, marginBottom: 28,
            animation: uiState === "wrong" ? "pinShake 0.55s ease" :
                       uiState === "unlocking" ? "pinUnlock 0.5s ease" : "none",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => {
            const filled = i < pin.length;
            const isActive = i === pin.length && uiState !== "locked" && uiState !== "unlocking";
            return (
              <div
                key={i}
                onClick={() => inputRef.current?.focus()}
                style={{
                  width: 14, height: 14, borderRadius: 99,
                  background: uiState === "unlocking" ? "#22c55e"
                    : uiState === "wrong" && filled ? "#ef4444"
                    : filled ? "#7c3aed"
                    : "transparent",
                  border: `2px solid ${
                    uiState === "unlocking" ? "#22c55e"
                    : uiState === "wrong" && filled ? "#ef4444"
                    : filled ? "#7c3aed"
                    : isActive ? "rgba(124,58,237,0.6)"
                    : "rgba(255,255,255,0.15)"
                  }`,
                  transition: "background 0.15s, border-color 0.15s",
                  cursor: "text",
                  boxShadow: filled && uiState !== "wrong" && uiState !== "unlocking"
                    ? "0 0 8px rgba(124,58,237,0.4)" : "none",
                }}
              />
            );
          })}
        </div>

        {/* Hidden real input */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          value={pin}
          onChange={handleChange}
          disabled={uiState === "locked" || uiState === "unlocking"}
          style={{
            position: "absolute",
            opacity: 0,
            pointerEvents: uiState === "locked" || uiState === "unlocking" ? "none" : "auto",
            width: 1, height: 1,
          }}
        />

        {/* Status message */}
        <div style={{ height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {uiState === "locked" && (
            <div style={{ fontSize: fontSize.sm, color: "#ef4444", display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="#ef4444" strokeWidth="1.2"/>
                <path d="M6 3.5v3M6 8.5v.2" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Bị khóa — thử lại sau {lockTimer}s
            </div>
          )}
          {uiState === "wrong" && (
            <div style={{ fontSize: fontSize.sm, color: "#ef4444" }}>
              Sai PIN — còn {attemptsLeft} lần
            </div>
          )}
          {uiState === "unlocking" && (
            <div style={{ fontSize: fontSize.sm, color: "#22c55e", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ animation: "spin 0.6s linear infinite" }}>
                <path d="M5 1a4 4 0 100 8A4 4 0 005 1z" stroke="#22c55e" strokeWidth="1.2" strokeDasharray="8 8"/>
              </svg>
              Xác thực...
            </div>
          )}
          {uiState === "idle" && pin.length === 0 && (
            <div style={{ fontSize: fontSize.xs, color: "rgba(255,255,255,0.2)", letterSpacing: "0.04em" }}>
              Nhấn phím số để nhập PIN
            </div>
          )}
        </div>

        {/* Keyboard hint row */}
        <div
          style={{
            marginTop: 24, padding: "10px 16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8,
            display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap",
            cursor: "default",
          }}
          onClick={() => inputRef.current?.focus()}
        >
          {["1","2","3","4","5","6","7","8","9","⌫","0","↵"].map((k) => (
            <button
              key={k}
              tabIndex={-1}
              disabled={uiState === "locked" || uiState === "unlocking"}
              onClick={(e) => {
                e.stopPropagation();
                if (uiState === "locked" || uiState === "unlocking") return;
                if (k === "⌫") {
                  setPin((p) => p.slice(0, -1));
                  setUiState("idle");
                } else if (k !== "↵") {
                  const next = (pin + k).slice(0, 6);
                  setPin(next);
                  const synth = { target: { value: next } } as React.ChangeEvent<HTMLInputElement>;
                  if (next.length === 6) handleChange(synth);
                }
                inputRef.current?.focus();
              }}
              style={{
                width: 36, height: 36, borderRadius: 6,
                background: k === "⌫" || k === "↵" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.7)",
                fontSize: k === "⌫" || k === "↵" ? 14 : fontSize.base,
                fontWeight: fontWeight.medium,
                cursor: "pointer",
                fontFamily: "JetBrains Mono, monospace",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 0,
                transition: "background 0.1s",
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Demo hint */}
        <div style={{ marginTop: 20, fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: "0.05em", textAlign: "center" }}>
          DEMO · PIN: 240689
        </div>
      </div>
    </div>
  );
}
