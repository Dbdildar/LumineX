import { useState, useRef, useEffect } from "react";
import { APP_LOGO, APP_LOGO2 } from "../../data/theme";

// CSS var helpers
export const C = {
  bg: "var(--bg)", bg2: "var(--bg2)", bg3: "var(--bg3)", bg4: "var(--bg4)",
  card: "var(--card)", cardH: "var(--cardH)",
  accent: "var(--accent)", accent2: "var(--accent2)", accent3: "var(--accent3)",
  gold: "var(--gold)", green: "var(--green)", red: "var(--red)",
  text: "var(--text)", textSub: "var(--textSub)", muted: "var(--muted)",
  border: "var(--border)", shadow: "var(--shadow)",
};

export function Logo({ size = 24, onClick }) {
  return (
    <div onClick={onClick} style={{ fontSize: size, fontWeight: 800, letterSpacing: 1, cursor: onClick ? "pointer" : "default", fontFamily: "'Syne',sans-serif", display: "flex", alignItems: "center", gap: 2, userSelect: "none" }}>
      <span style={{ background: "linear-gradient(135deg,#c084fc,#818cf8,#f472b6)", backgroundSize: "200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "gradShift 4s ease infinite" }}>{APP_LOGO}</span>
      <span style={{ color: C.text }}>{APP_LOGO2}</span>
    </div>
  );
}

export function AppIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs><linearGradient id="ig" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#c084fc" /><stop offset="50%" stopColor="#818cf8" /><stop offset="100%" stopColor="#f472b6" /></linearGradient></defs>
      <rect width="40" height="40" rx="12" fill="url(#ig)" />
      <polygon points="16,12 30,20 16,28" fill="white" opacity="0.95" />
      <circle cx="12" cy="28" r="3.5" fill="white" opacity="0.8" />
      <line x1="12" y1="24.5" x2="12" y2="12" stroke="white" strokeWidth="2.5" opacity="0.8" strokeLinecap="round" />
    </svg>
  );
}

export function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";
  return (
    <button onClick={onToggle} title={isDark ? "Light mode" : "Dark mode"} style={{
      position: "relative", width: 48, height: 26, borderRadius: 99,
      background: isDark ? "linear-gradient(135deg,#1a1a3e,#2a1a5e)" : "linear-gradient(135deg,#fbbf24,#f97316)",
      border: "none", cursor: "pointer", transition: "background .3s", flexShrink: 0, padding: 0,
    }}>
      <div style={{
        position: "absolute", top: 3, left: isDark ? 3 : "calc(100% - 23px)",
        width: 20, height: 20, borderRadius: "50%",
        background: isDark ? "linear-gradient(135deg,#c084fc,#818cf8)" : "#fff",
        transition: "left .3s cubic-bezier(0.34,1.56,0.64,1)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
        boxShadow: "0 2px 6px rgba(0,0,0,.3)",
      }}>{isDark ? "🌙" : "☀️"}</div>
    </button>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  const icons = { success: "✓", error: "✕", info: "💡", warning: "⚠" };
  const colors = { success: C.green, error: C.red, info: C.accent, warning: C.gold };
  const c = colors[toast.type] || C.accent;
  return (
    <div key={toast.id} style={{
      position: "fixed", bottom: 80, left: "50%", zIndex: 99999, transform: "translateX(-50%)",
      background: "rgba(195, 238, 241, 0.97)", backdropFilter: "blur(20px)",
      border: `1px solid ${c}44`, borderRadius: 12, padding: "11px 20px",
      color: C.text, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 10,
      whiteSpace: "nowrap", maxWidth: "90vw",
      boxShadow: `0 8px 40px rgba(0,0,0,.7),0 0 0 1px ${c}22`,
      animation: "toastIn .3s cubic-bezier(0.34,1.56,0.64,1)", pointerEvents: "none",
    }}>
      <span style={{ color: c, fontSize: 15 }}>{icons[toast.type] || "•"}</span>
      {toast.msg}
    </div>
  );
}

export function Spinner({ size = 16, color = "currentColor" }) {
  return (
    <div style={{
      width: size,
      height: size,
      border: "2px solid rgba(255,255,255,0.2)",
      borderTopColor: color, // 🚀 THIS LINE must use the 'color' variable!
      borderRadius: "50%",
      animation: "spin .8s linear infinite"
    }} />
  );
}

export function Avatar({ profile, size = 36, onClick }) {
  const [err, setErr] = useState(false);
  if (!profile) return <div style={{ width: size, height: size, borderRadius: "50%", background: C.bg3, flexShrink: 0, border: `2px solid ${C.border}` }} />;
  const initials = (profile.display_name || profile.username || "?")[0].toUpperCase();
  const bg = profile.avatar_bg || "linear-gradient(135deg,#c084fc,#818cf8)";
  if (profile.avatar_url && !err) return <img src={profile.avatar_url} alt={initials} onError={() => setErr(true)} onClick={onClick} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, cursor: onClick ? "pointer" : "default", border: `2px solid ${C.border}` }} />;
  return <div onClick={onClick} style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: profile.avatar_emoji ? size * .42 : size * .38, fontWeight: 800, color: "white", cursor: onClick ? "pointer" : "default", flexShrink: 0, userSelect: "none", border: `2px solid ${C.border}` }}>{profile.avatar_emoji || initials}</div>;
}

export function Skeleton({ width = "100%", height = 16, radius = 8, style: s }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius, ...s }} />;
}

export function SectionHeader({ title, action, actionLabel }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Syne',sans-serif", letterSpacing: .3, color: C.text }}>{title}</h2>
      {action && <span onClick={action} style={{ fontSize: 12, color: C.accent, cursor: "pointer", fontWeight: 600 }}>{actionLabel || "View all"} →</span>}
    </div>
  );
}

export function FilterChip({ label, active, onClick, icon }) {
  return (
    <div onClick={onClick} style={{
      padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600,
      cursor: "pointer", whiteSpace: "nowrap", transition: "all .2s",
      border: `1px solid ${active ? C.accent : C.border}`,
      background: active ? `var(--accent)22` : C.bg3,
      color: active ? C.accent : C.muted,
      display: "flex", alignItems: "center", gap: 5,
    }}>
      {icon && <span>{icon}</span>}{label}
    </div>
  );
}

export function HScroll({ children, hideArrows }) { // Added hideArrows here
  const ref = useRef(null);
  const s = d => ref.current?.scrollBy({ left: d * 280, behavior: "smooth" });

  return (
    <div style={{ position: "relative" }}>
      {/* ── Only show Left Arrow if hideArrows is false ── */}
      {!hideArrows && (
        <button 
          onClick={() => s(-1)} 
          style={{ 
            position: "absolute", left: -14, top: "38%", transform: "translateY(-50%)", 
            width: 32, height: 32, borderRadius: "50%", background: C.bg2, 
            border: `1px solid ${C.border}`, color: C.text, fontSize: 18, 
            cursor: "pointer", display: "flex", alignItems: "center", 
            justifyContent: "center", zIndex: 5 
          }}
        >‹</button>
      )}

      <div ref={ref} style={{ 
        display: "flex", gap: 12, overflowX: "auto", 
        scrollbarWidth: "none", paddingBottom: 4, scrollSnapType: "x mandatory" 
      }}>
        {children}
      </div>

      {/* ── Only show Right Arrow if hideArrows is false ── */}
      {!hideArrows && (
        <button 
          onClick={() => s(1)} 
          style={{ 
            position: "absolute", right: -14, top: "38%", transform: "translateY(-50%)", 
            width: 32, height: 32, borderRadius: "50%", background: C.bg2, 
            border: `1px solid ${C.border}`, color: C.text, fontSize: 18, 
            cursor: "pointer", display: "flex", alignItems: "center", 
            justifyContent: "center", zIndex: 5 
          }}
        >›</button>
      )}
    </div>
  );
}

export function Modal({ onClose, children, maxWidth = 480, noPad }) {
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,.8)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflowY: "auto", animation: "fadeIn .2s ease",
    }}>
      <div style={{ width: "100%", maxWidth, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 20, position: "relative", padding: noPad ? 0 : "28px 28px", boxShadow: `0 0 0 1px ${C.border},0 40px 80px rgba(0,0,0,.7)`, animation: "scaleIn .25s cubic-bezier(0.34,1.2,0.64,1)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, zIndex: 9999, background: C.bg3, border: `1px solid ${C.border}`, borderRadius: "50%", width: 32, height: 32, color: C.muted, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "auto" }}>✕</button>
        {children}
      </div>
    </div>
  );
}

export function Input({ label, type = "text", value, onChange, placeholder, icon, error, hint, autoFocus, onKeyDown, readOnly, right, onBlur,max }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  const emailErr = type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Invalid email format" : null;
  const displayErr = error || emailErr;
  return (
   <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {icon && (
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none", zIndex: 1 }}>
            {icon}
          </span>
        )}
        
        <input 
          type={isPass ? (show ? "text" : "password") : type} 
          value={value} 
          onChange={onChange} 
          placeholder={placeholder} 
          autoFocus={autoFocus} 
          onKeyDown={onKeyDown} 
          readOnly={readOnly}
          max={max}
          onFocus={() => setFocused(true)} 
          onBlur={() => { setFocused(false); onBlur?.(); }}
          /* 📅 Automatically opens the calendar when clicking the box */
          onClick={(e) => type === "date" && e.target.showPicker?.()}
          style={{ 
            width: "100%", 
            background: C.bg3, 
            border: `1.5px solid ${displayErr ? C.red : focused ? C.accent : C.border}`, 
            borderRadius: 10, 
            color: C.text, 
            fontFamily: "inherit", 
            fontSize: 14, 
            padding: `11px ${isPass || right ? 40 : 14}px 11px ${icon ? 40 : 14}px`, 
            outline: "none", 
            transition: "all .2s", 
            boxShadow: focused ? `0 0 0 3px ${displayErr ? C.red : C.accent}1a` : "none",
            cursor: type === "date" ? "pointer" : "text" 
          }}
        />

        {isPass && (
          <button type="button" onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 15, padding: 4 }}>
            {show ? "🙈" : "👁"}
          </button>
        )}
        {right && !isPass && <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>{right}</div>}
      </div>
      {displayErr && <div style={{ fontSize: 11, color: C.red, marginTop: 4, animation: "shake .3s" }}>⚠ {displayErr}</div>}
      {hint && !displayErr && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", size = "md", disabled, loading, fullWidth, style: s }) {
  const pads = { sm: "6px 12px", md: "10px 20px", lg: "13px 28px" };
  const fss = { sm: 12, md: 14, lg: 15 };
  const vs = {
    primary: { background: `linear-gradient(135deg,${C.accent},${C.accent2})`, border: "none", color: "white", boxShadow: `0 0 24px var(--accent)33` },
    secondary: { background: C.bg3, border: `1px solid ${C.border}`, color: C.text },
    ghost: { background: "none", border: `1px solid var(--accent)44`, color: C.accent },
    danger: { background: `var(--red)22`, border: `1px solid var(--red)44`, color: C.red },
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{ ...vs[variant], padding: pads[size], fontSize: fss[size], borderRadius: 10, cursor: disabled || loading ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 600, transition: "all .2s", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, width: fullWidth ? "100%" : "auto", opacity: disabled ? .5 : 1, ...s }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.transform = "translateY(-1px) scale(1.02)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
    >{loading ? <Spinner size={14} color="#bf5454" /> : children}</button>
  );
}

export function EmptyState({ emoji = "📭", title, subtitle, action, actionLabel }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted, animation: "fadeUp .4s ease" }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>{emoji}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, marginBottom: 16 }}>{subtitle}</div>}
      {action && <Btn onClick={action} variant="ghost" size="sm">{actionLabel}</Btn>}
    </div>
  );
}

export function VipBadge({ small }) {
  return <span style={{ background: "linear-gradient(135deg,#fbbf24,#f97316)", color: "#000", fontSize: small ? 8 : 10, fontWeight: 900, padding: small ? "1px 5px" : "2px 7px", borderRadius: 4, letterSpacing: .5, textTransform: "uppercase", flexShrink: 0 }}>VIP</span>;
}

export function VerifiedBadge({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#3b82f6" /><path d="M4.5 8L7 10.5L11.5 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

// Example of what your fmtNum should look like in ui/index.jsx
export const fmtNum = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num;
};

export function fmtTime(s) {
  const m = Math.floor((s || 0) / 60), sec = Math.floor((s || 0) % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}
export function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
