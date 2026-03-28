import { useState, useRef, useEffect, useCallback } from "react";
import { C, Logo, AppIcon, Input, Btn, Spinner, validateEmail } from "../ui/index";
import { useApp } from "../../context/AppContext";
import { authAPI, profileAPI } from "../../lib/supabase";
import { AVATARS } from "../../data/theme";
import { supabase } from "../../lib/supabase";
import { data } from "react-router-dom";

/* ═══════════════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════════════ */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes fadeUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes scaleIn   { from{opacity:0;transform:scale(.93)} to{opacity:1;transform:scale(1)} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes orbit     { from{transform:rotate(0deg) translateX(54px) rotate(0deg)} to{transform:rotate(360deg) translateX(54px) rotate(-360deg)} }
  @keyframes orbit2    { from{transform:rotate(180deg) translateX(40px) rotate(-180deg)} to{transform:rotate(540deg) translateX(40px) rotate(-540deg)} }
  @keyframes floatY    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes ripple    { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.8);opacity:0} }
  @keyframes dotDance  { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
  @keyframes checkDraw { from{stroke-dashoffset:50} to{stroke-dashoffset:0} }
  @keyframes slideRight{ from{transform:translateX(-100%)} to{transform:translateX(0)} }
  @keyframes successPop{ 0%{transform:scale(.5);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }

  .auth-overlay { animation: fadeIn .22s ease both; }
  .auth-card    { animation: scaleIn .3s cubic-bezier(.34,1.15,.64,1) both; }
  .fade-up      { animation: fadeUp .35s ease both; }

  .verify-ring {
    position:absolute; border-radius:50%; inset:0;
    border:1px solid color-mix(in srgb,var(--accent,#6c63ff) 25%,transparent);
    animation: ripple 2.4s ease-out infinite;
  }
  .verify-ring:nth-child(2){ animation-delay:.8s; }
  .verify-ring:nth-child(3){ animation-delay:1.6s; }

  .dot {
    display:inline-block; width:7px; height:7px; border-radius:50%;
    background:var(--accent,#6c63ff);
    animation:dotDance 1.4s ease-in-out infinite both;
  }
  .dot:nth-child(2){ animation-delay:.16s; }
  .dot:nth-child(3){ animation-delay:.32s; }

  .progress-fill { animation: slideRight .6s cubic-bezier(.34,1.2,.64,1) both; }

  .email-tag {
    display:inline-flex; align-items:center; gap:6px;
    background:color-mix(in srgb,var(--accent,#6c63ff) 12%,transparent);
    border:1px solid color-mix(in srgb,var(--accent,#6c63ff) 30%,transparent);
    border-radius:99px; padding:4px 14px 4px 10px;
    font-size:13px; font-weight:600; color:var(--accent,#6c63ff);
  }

  .glass { backdrop-filter:blur(22px); -webkit-backdrop-filter:blur(22px); }

  .btn-primary {
    background: linear-gradient(135deg, var(--accent,#6c63ff), var(--accent2,#ff6584));
    border:none; color:#fff;
    font-family:'DM Sans',sans-serif; font-weight:600;
    border-radius:14px; cursor:pointer;
    transition:all .22s; position:relative; overflow:hidden;
  }
  .btn-primary:hover:not(:disabled) {
    transform:translateY(-1px);
    box-shadow:0 10px 28px color-mix(in srgb,var(--accent,#6c63ff) 38%,transparent);
  }
  .btn-primary:disabled { opacity:.5; cursor:not-allowed; transform:none !important; }

  .btn-ghost {
    background:transparent;
    border:1px solid color-mix(in srgb,#fff 12%,transparent);
    border-radius:14px; cursor:pointer;
    transition:all .2s; font-family:'DM Sans',sans-serif; font-weight:500;
  }
  .btn-ghost:hover {
    background:color-mix(in srgb,var(--accent,#6c63ff) 8%,transparent);
    border-color:var(--accent,#6c63ff);
  }

  .step-card { display:flex; align-items:center; gap:10px; border-radius:10px; padding:10px 14px; }
  .success-icon { animation:successPop .5s cubic-bezier(.34,1.56,.64,1) both; }
`;

function StyleTag() {
  return <style dangerouslySetInnerHTML={{ __html: STYLES }} />;
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN MODAL SHELL
═══════════════════════════════════════════════════════════════════ */
export default function AuthModal() {
  const { authModal, setAuthModal } = useApp();
  if (!authModal) return null;
  const onClose = () => setAuthModal(null);

  return (
    <>
      <StyleTag />
      <div
        className="auth-overlay glass"
        onClick={e => e.target === e.currentTarget && onClose()}
        style={{
          position: "fixed", inset: 0, zIndex: 9500,
          background: "rgba(0,0,0,.87)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px", overflowY: "auto",
        }}
      >
        {/* Ambient blobs */}
        <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "8%", left: "12%", width: 380, height: 380, borderRadius: "50%", background: `${C.accent}13`, filter: "blur(90px)" }} />
          <div style={{ position: "absolute", bottom: "6%", right: "10%", width: 310, height: 310, borderRadius: "50%", background: `${C.accent2}0f`, filter: "blur(90px)" }} />
        </div>

        <div
          className="auth-card glass"
          style={{
            position: "relative", zIndex: 1, width: "100%", maxWidth: 430,
            background: `color-mix(in srgb,${C.bg2 || "#181820"} 94%,transparent)`,
            border: `1px solid color-mix(in srgb,${C.border || "#2a2a3a"} 70%,transparent)`,
            borderRadius: 26, padding: "36px 28px 28px",
            boxShadow: "0 36px 100px rgba(0,0,0,.75), inset 0 1px 0 rgba(255,255,255,.05)",
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 14, right: 14, zIndex: 10,
              width: 32, height: 32, borderRadius: "50%",
              background: C.bg3 || "#222", border: `1px solid ${C.border || "#333"}`,
              color: C.muted || "#888", fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.border; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.bg3; e.currentTarget.style.color = C.muted; }}
          >✕</button>

          {/* Brand */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><AppIcon size={44} /></div>
            <Logo size={22} />
          </div>

          {authModal === "login" && <LoginForm onSwitch={setAuthModal} onClose={onClose} />}
          {authModal === "signup" && <SignupForm onSwitch={setAuthModal} onClose={onClose} />}
          {authModal === "forgot" && <ForgotForm onSwitch={setAuthModal} />}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SHARED HELPERS
═══════════════════════════════════════════════════════════════════ */
function Divider({ label = "or continue with" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{ fontSize: 11, color: C.muted, letterSpacing: .6, textTransform: "uppercase" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

function GoogleBtn() {
  const { showToast } = useApp();
  return (
    <button
      onClick={async () => {
        try { await authAPI.signInWithGoogle(); }
        catch (e) { showToast(e.message || "Google sign-in failed", "error"); }
      }}
      className="btn-ghost"
      style={{ width: "100%", padding: "11px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 13, color: C.text }}
    >
      <svg width={18} height={18} viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      Continue with Google
    </button>
  );
}


function Dots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      <span className="dot" /><span className="dot" /><span className="dot" />
    </span>
  );
}

function EmailStatusHint({ status, onLoginClick }) {
  if (!status || status === "checking" || status === "available") return null;
  return (
    <div
      className="fade-up"
      style={{
        margin: "6px 0 14px", padding: "12px 14px", borderRadius: 12,
        background: "color-mix(in srgb,#f59e0b 10%,transparent)",
        border: "1px solid color-mix(in srgb,#f59e0b 30%,transparent)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <p style={{ margin: 0, fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>⚠ Email already registered</p>
        <button
          onClick={onLoginClick}
          style={{
            fontSize: 11, fontWeight: 700, color: "#f59e0b",
            background: "color-mix(in srgb,#f59e0b 18%,transparent)",
            border: "1px solid color-mix(in srgb,#f59e0b 35%,transparent)",
            borderRadius: 8, padding: "4px 12px", cursor: "pointer",
          }}
        >Sign in →</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   VERIFY EMAIL PAGE

   Two strategies run in parallel:
   1. onAuthStateChange  — instant, same browser/device
   2. RPC poll every 3s  — works for cross-device (phone verifies, desktop reacts)

   After confirmation is detected, signInWithPassword is called so the
   desktop tab gets a real session — then the modal closes.

   Required SQL (run once in Supabase SQL editor):
   ─────────────────────────────────────────────────
   create or replace function public.check_email_confirmed(email_input text)
   returns boolean language sql security definer as $$
     select exists (
       select 1 from auth.users
       where email = lower(email_input)
       and email_confirmed_at is not null
     );
   $$;
═══════════════════════════════════════════════════════════════════ */
function VerifyEmailPage({ email, password, onVerified, onChangeEmail, onResend, isLocked, resendCount }) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [timer, setTimer] = useState(60);
  const [verified, setVerified] = useState(false);

  // Guard: prevent both strategies firing onVerified at the same time
  const doneRef = useRef(false);

  // hasSession=true  → magic link opened in THIS browser, session already exists
  // hasSession=false → opened on phone, desktop needs signInWithPassword
  const triggerVerified = useCallback((hasSession = false) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setVerified(true);
    setTimeout(() => onVerified(hasSession), 1800);
  }, [onVerified]);

  // Countdown for resend button
  useEffect(() => {
    const t = setInterval(() => setTimer(x => x > 0 ? x - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []);

  // Strategy 1: same-browser detection (instant).
  // Session already created by magic link — pass true so handleVerified
  // skips the redundant signInWithPassword.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
        triggerVerified(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [triggerVerified]);

  // Strategy 2: cross-device polling via RPC (phone verifies → desktop reacts).
  // No session on desktop yet — pass false so handleVerified calls
  // signInWithPassword to create the session on this device.
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const { data: confirmed, error } = await supabase.rpc(
          "check_email_confirmed",
          { email_input: email }
        );
        if (!error && confirmed === true) {
          clearInterval(poll);
          triggerVerified(false);
        }
        console.log(data, 'data', error, 'err')
      } catch {
        // network hiccup — keep polling
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [triggerVerified, email]);




  const handleResend = async () => {
    if (isLocked) return; // <--- ADD THIS LINE
    setResending(true);
    try {
      await onResend();
      setResent(true);
      setTimer(60);
      setTimeout(() => setResent(false), 3000);
    } finally {
      setResending(false);
    }
  };

  /* ── Success screen ── */
  if (verified) {
    return (
      <div className="fade-up" style={{ textAlign: "center", padding: "8px 0 16px" }}>
        <div
          className="success-icon"
          style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg,#22c55e,#16a34a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 0 50px rgba(34,197,94,.45)",
          }}
        >
          <svg width={38} height={38} viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={50} strokeDashoffset={0}
              style={{ animation: "checkDraw .45s ease forwards" }}
            />
          </svg>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#22c55e", margin: "0 0 8px", fontFamily: "'Syne',sans-serif" }}>
          Email Verified! 🎉
        </h2>
        <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Welcome aboard — taking you home…</p>
        <div style={{
          margin: "20px auto 0", width: 36, height: 36,
          border: "3px solid color-mix(in srgb,#22c55e 25%,transparent)",
          borderTopColor: "#22c55e", borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
      </div>
    );
  }

  /* ── Waiting screen ── */
  return (
    <div className="fade-up" style={{ fontFamily: "'DM Sans',sans-serif" }}>
      {/* Animated envelope */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 26 }}>
        <div style={{ position: "relative", width: 116, height: 116 }}>
          <div className="verify-ring" />
          <div className="verify-ring" />
          <div className="verify-ring" />
          <div style={{
            position: "absolute", inset: 18, borderRadius: "50%",
            background: `linear-gradient(135deg,${C.accent},${C.accent2})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 36px color-mix(in srgb,${C.accent} 42%,transparent)`,
            animation: "floatY 3s ease-in-out infinite",
          }}>
            <svg width={34} height={34} viewBox="0 0 24 24" fill="none">
              <rect x={2} y={4} width={20} height={16} rx={3} stroke="rgba(255,255,255,.92)" strokeWidth={1.6} />
              <path d="M2 7l10 7 10-7" stroke="rgba(255,255,255,.92)" strokeWidth={1.6} strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ position: "absolute", inset: 0, animation: "orbit 3s linear infinite" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, opacity: .75 }} />
          </div>
          <div style={{ position: "absolute", inset: 0, animation: "orbit2 4.5s linear infinite" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent2, opacity: .55 }} />
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: 21, fontWeight: 800, color: C.text, margin: "0 0 8px", textAlign: "center", fontFamily: "'Syne',sans-serif" }}>
        Check your inbox
      </h2>
      <p style={{ fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 1.65, margin: "0 0 16px" }}>
        We've sent a magic link to
      </p>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <span className="email-tag">✉ {email}</span>
      </div>
      <p style={{ fontSize: 12, color: C.muted, textAlign: "center", lineHeight: 1.7, margin: "0 0 22px" }}>
        Open it and tap the link to verify your account.<br />
        <strong style={{ color: C.text }}>This page will update instantly</strong> — from any device.
      </p>

      {/* Live status bar */}
      <div style={{
        background: `color-mix(in srgb,${C.accent} 6%,${C.bg3 || "#1a1a24"})`,
        border: `1px solid color-mix(in srgb,${C.accent} 18%,transparent)`,
        borderRadius: 12, padding: "12px 16px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <Dots />
        <span style={{ fontSize: 12, color: C.muted, flex: 1 }}>Waiting for verification…</span>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          border: `2.5px solid color-mix(in srgb,${C.accent} 22%,transparent)`,
          borderTopColor: C.accent,
          animation: "spin 1.1s linear infinite",
        }} />
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 22 }}>
        {[
          { icon: "📬", text: "Open the email from us" },
          { icon: "🔗", text: 'Click "Verify my email"' },
          { icon: "⚡", text: "You'll be logged in here instantly" },
        ].map((s, i) => (
          <div
            key={i}
            className="step-card fade-up"
            style={{
              animationDelay: `${i * 0.07}s`,
              background: `color-mix(in srgb,${C.accent} 4%,${C.bg3 || "#1a1a24"})`,
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
            <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{s.text}</span>
          </div>
        ))}
      </div>

      {/* Actions */}

      <div style={{
        textAlign: "center",
        marginBottom: 12,
        fontSize: 11,
        fontWeight: 600,
        color: isLocked ? "#ef4444" : C.muted,
        letterSpacing: "0.02em"
      }}>
        {isLocked ? (
          "RESEND LIMIT REACHED"
        ) : (
          <>ATTEMPTS: <span style={{ color: C.text }}>{resendCount}/3</span></>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onChangeEmail} className="btn-ghost" style={{ flex: 1, padding: "10px", fontSize: 12, color: C.muted }}>
          ← Change email
        </button>

        <button
          onClick={!isLocked && timer === 0 && !resending ? handleResend : undefined}
          disabled={isLocked || timer > 0 || resending}
          style={{
            flex: 1.6,
            padding: "10px 14px",
            borderRadius: 14,
            border: "none",
            background: (!isLocked && timer === 0 && !resending)
              ? `linear-gradient(135deg, ${C.accent}, ${C.accent2})`
              : C.bg3 || "#1a1a24",
            color: (!isLocked && timer === 0 && !resending) ? "#fff" : C.muted,
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 12,
            fontWeight: 600,
            cursor: (!isLocked && timer === 0 && !resending) ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyChild: "center",
            gap: 6,
            transition: "all .2s",
            opacity: isLocked ? 0.6 : 1, // Visual cue for lockout
          }}
        >
          {resending ? (
            <>
              <div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
              Sending...
            </>
          ) : isLocked ? (
            "Locked (1hr)"
          ) : timer > 0 ? (
            `Resend in ${timer}s`
          ) : (
            "Resend Link"
          )}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LOGIN FORM
═══════════════════════════════════════════════════════════════════ */
function LoginForm({ onSwitch, onClose }) {
  const { showToast } = useApp();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e = {};
    if (!email.trim()) e.email = "Email required";
    else if (!validateEmail(email)) e.email = "Invalid email";
    if (!pass) e.pass = "Password required";
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await authAPI.signIn({ email, password: pass });
      showToast("Welcome back! 🎉", "success");
      onClose();
    } catch (err) {
      showToast(err.message || "Sign in failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-up">
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", fontFamily: "'Syne',sans-serif", color: C.text }}>Welcome back 👋</h2>
      <p style={{ fontSize: 13, color: C.muted, margin: "0 0 22px" }}>Sign in to continue watching</p>
      <Input label="Email" type="email" icon="📧" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" error={errors.email} />
      <Input label="Password" type="password" icon="🔒" value={pass} onChange={e => setPass(e.target.value)} placeholder="Your password" error={errors.pass} onKeyDown={e => e.key === "Enter" && submit()} />
      <div style={{ textAlign: "right", marginBottom: 20, marginTop: -8 }}>
        <span onClick={() => onSwitch("forgot")} style={{ fontSize: 12, color: C.accent, cursor: "pointer", fontWeight: 600 }}>Forgot password?</span>
      </div>
      <Btn onClick={submit} loading={loading} fullWidth size="lg">Sign In →</Btn>
      <Divider />
      <GoogleBtn />
      <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: C.muted }}>
        No account? <span onClick={() => onSwitch("signup")} style={{ color: C.accent, cursor: "pointer", fontWeight: 700 }}>Create one free</span>
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SIGNUP FORM
═══════════════════════════════════════════════════════════════════ */
function SignupForm({ onSwitch, onClose }) {
  const { showToast, setAuthModal } = useApp();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", username: "", email: "",
    pass: "", confirm: "", dob: "",
    agree: false, avatarId: "a9",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [unStatus, setUnStatus] = useState(null); // null|checking|ok|taken
  const [emailStatus, setEmailStatus] = useState(null); // null|checking|available|registered

  const uTimer = useRef(null);
  const eTimer = useRef(null);


  // 1. Initialize count and lockout from localStorage (or defaults)
  const [resendCount, setResendCount] = useState(() =>
    Number(localStorage.getItem('resend_count')) || 0
  );
  const [lockoutUntil, setLockoutUntil] = useState(() =>
    Number(localStorage.getItem('resend_lockout')) || null
  );
  const [isLocked, setIsLocked] = useState(false);

  // 2. Effect to check lockout status every second
  useEffect(() => {
    const checkLockout = () => {
      if (lockoutUntil && Date.now() < lockoutUntil) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
        if (lockoutUntil) { // Clear if time passed
          setLockoutUntil(null);
          setResendCount(0);
          localStorage.removeItem('resend_lockout');
          localStorage.removeItem('resend_count');
        }
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);


  /* ─────────────────────────────────────────────────────────────
     EMAIL EXISTENCE CHECK  (requires RPC in Supabase):

     create or replace function public.check_email_exists(email_input text)
     returns boolean language sql security definer as $$
       select exists (
         select 1 from auth.users where email = lower(email_input)
       );
     $$;
  ───────────────────────────────────────────────────────────────── */
  const checkEmail = useCallback(async (val) => {
    if (!val || !validateEmail(val)) { setEmailStatus(null); return; }
    setEmailStatus("checking");
    try {
      const { data, error } = await supabase.rpc("check_email_exists", {
        email_input: val.toLowerCase(),
      });
      if (error) throw error;
      setEmailStatus(data === true ? "registered" : "available");
    } catch {
      setEmailStatus("available"); // fail open
    }
  }, []);

  const onEmailChange = useCallback((e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, email: val }));
    setEmailStatus(null);
    clearTimeout(eTimer.current);
    if (validateEmail(val)) {
      eTimer.current = setTimeout(() => checkEmail(val), 650);
    }
  }, [checkEmail]);

  /* ── username availability ── */
  const checkUsername = (val) => {
    if (!val || val.length < 3) { setUnStatus(null); return; }
    setUnStatus("checking");
    clearTimeout(uTimer.current);
    uTimer.current = setTimeout(async () => {
      const taken = await profileAPI.checkUsername(val.toLowerCase());
      setUnStatus(taken ? "taken" : "ok");
    }, 500);
  };

  /* ── generic field setter ── */
  const set = (k) => (v) => {
    const val =
      typeof v === "object" && v?.target
        ? v.target.type === "checkbox" ? v.target.checked : v.target.value
        : v;
    setForm(prev => ({ ...prev, [k]: val }));
    if (k === "dob") {
      if (!val) { setErrors(prev => ({ ...prev, dob: "Date of birth required" })); return; }
      const age = (Date.now() - new Date(val)) / (365.25 * 86400000);
      if (age < 18) setErrors(prev => ({ ...prev, dob: "Must be 18 or older 🚫" }));
      else setErrors(prev => { const { dob, ...rest } = prev; return rest; });
    }
  };

  /* ── step 1 → 2 ── */
  const nextStep = () => {
    if (emailStatus === "registered") {
      showToast("That email is already registered — sign in instead.", "error");
      return;
    }
    const e = {};
    if (!form.name.trim() || form.name.length < 2) e.name = "At least 2 characters";
    if (!form.username || form.username.length < 3) e.username = "At least 3 characters";
    else if (!/^[a-z0-9_]+$/.test(form.username)) e.username = "Only a-z, 0-9, _";
    else if (unStatus === "taken") e.username = "Username taken";
    if (!form.email.trim()) e.email = "Email required";
    else if (!validateEmail(form.email)) e.email = "Invalid email";
    setErrors(e);
    if (!Object.keys(e).length) setStep(2);
  };

  /* ── step 2 → call signUp → show verify page ── */
  const submit = async () => {
    const e = {};
    if (!form.pass || form.pass.length < 8) e.pass = "At least 8 characters";
    else if (!/[A-Z]/.test(form.pass)) e.pass = "Needs an uppercase letter";
    else if (!/[0-9]/.test(form.pass)) e.pass = "Needs a number";
    if (form.pass !== form.confirm) e.confirm = "Passwords don't match";
    if (!form.dob) e.dob = "Date of birth required";
    else if ((Date.now() - new Date(form.dob)) / (365.25 * 86400000) < 18) e.dob = "Must be 18+";
    if (!form.agree) e.agree = "You must agree to continue";
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const { data, error } = await authAPI.signUp({
        email: form.email,
        password: form.pass,
        username: form.username.toLowerCase(),
        displayName: form.name,
        avatarId: form.avatarId,
      });
      if (error) throw error;
      showToast("Magic link sent! Check your email 📧", "info");
      setStep("verify");
    } catch (err) {
      showToast(err.message || "Sign up failed", "error");
    } finally {
      setLoading(false);
    }
  };


  const handleResendLink = async () => {
    // 1. Check if already locked
    if (isLocked) {
      const remainingMins = Math.ceil((lockoutUntil - Date.now()) / 60000);
      showToast(`Limit reached. Try again in ${remainingMins} minutes.`, "error");
      return;
    }

    // 2. Perform the Resend
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: form.email
    });

    if (!error) {
      const newCount = resendCount + 1;
      setResendCount(newCount);
      localStorage.setItem('resend_count', newCount);

      // 3. If limit reached (3), set 1-hour lockout
      if (newCount >= 3) {
        const oneHourFromNow = Date.now() + 3600000; // 1 hour in ms
        setLockoutUntil(oneHourFromNow);
        localStorage.setItem('resend_lockout', oneHourFromNow);
        showToast("Limit reached. Please try again after 1 hour.", "error");
      } else {
        showToast(`Link resent! (${newCount}/3) 📧`, "info");
      }
    } else {
      showToast("Could not resend — try again shortly.", "error");
    }
  };

  /*
   * handleVerified — called after email is confirmed (either device).
   *
   * The desktop tab has no session yet (user verified on phone), so we
   * call signInWithPassword using the password they just typed.
   * This gives the desktop a real session → profile is accessible →
   * modal closes → app shows home screen as logged in.
   */
  // hasSession=true  → same browser, session already active, just close modal
  // hasSession=false → cross-device (phone), need to sign in on desktop now
  const handleVerified = useCallback(async (hasSession = false) => {
    try {
      if (!hasSession) {
        // Phone verified — desktop has no session yet, sign in with password
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.pass,
        });
        if (error) throw error;
      }
      // At this point session exists on this device (either from magic link or signInWithPassword)
      const { data: { user } } = await supabase.auth.getUser();
      const displayName = user?.user_metadata?.display_name || form.name || "there";
      showToast(`Welcome, ${displayName}! 🎉`, "success");
    } catch {
      showToast("Email verified! Please sign in to continue.", "info");
    } finally {
      if (setAuthModal) setAuthModal(null);
      if (onClose) onClose();
    }
  }, [form.email, form.pass, form.name, showToast, setAuthModal, onClose]);

  /* ── password strength ── */
  const strength = [
    form.pass.length >= 8,
    /[A-Z]/.test(form.pass),
    /[0-9]/.test(form.pass),
    /[^A-Za-z0-9]/.test(form.pass),
  ].filter(Boolean).length;
  const strColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"][strength];
  const strLabel = ["", "Weak", "Fair", "Good", "Strong 🔐"][strength];

  /* ── email right-side indicator ── */
  const emailRight =
    emailStatus === "checking" ? <Spinner size={14} /> :
      emailStatus === "available" ? <span style={{ color: "#22c55e", fontSize: 14 }}>✓</span> :
        emailStatus === "registered" ? <span style={{ color: "#f59e0b", fontSize: 17 }}>⚠</span> :
          null;

  /* ── verify screen ── */
  if (step === "verify") {
    return (
      <VerifyEmailPage
        email={form.email}
        password={form.pass}
        onVerified={handleVerified}
        isLocked={isLocked}
        onChangeEmail={() => setStep(1)}
        onResend={handleResendLink}
      />
    );
  }

  /* ── main form ── */
  return (
    <div className="fade-up">
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", fontFamily: "'Syne',sans-serif", color: C.text }}>Create account 🚀</h2>
      <p style={{ fontSize: 13, color: C.muted, margin: "0 0 16px" }}>Step {step} of 2</p>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
        {[1, 2].map(s => (
          <div key={s} style={{ flex: 1, height: 3, borderRadius: 99, overflow: "hidden", background: C.border }}>
            {step >= s && (
              <div
                className="progress-fill"
                style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg,${C.accent},${C.accent2})` }}
              />
            )}
          </div>
        ))}
      </div>

      {/* ══ STEP 1 ══ */}
      {step === 1 && (
        <>
          <Input label="Full Name" icon="👤" value={form.name} onChange={set("name")} placeholder="Your name" error={errors.name} />

          <div>
            <Input
              label="Username" icon="@"
              value={form.username}
              onChange={e => { set("username")(e); checkUsername(e.target.value); }}
              placeholder="unique_username"
              error={errors.username}
              right={
                form.username.length >= 3
                  ? unStatus === "checking" ? <Spinner size={14} />
                    : unStatus === "ok" ? <span style={{ color: "#22c55e", fontSize: 14 }}>✓</span>
                      : unStatus === "taken" ? <span style={{ color: C.red, fontSize: 14 }}>✗</span>
                        : null
                  : null
              }
            />
            {form.username.length >= 3 && unStatus && unStatus !== "checking" && (
              <div style={{ fontSize: 11, marginTop: -12, marginBottom: 8, color: unStatus === "ok" ? "#22c55e" : C.red }}>
                {unStatus === "ok" ? "✓ Available" : "✗ Username taken"}
              </div>
            )}
          </div>

          <Input
            label="Email" type="email" icon="📧"
            value={form.email}
            onChange={onEmailChange}
            onBlur={() => validateEmail(form.email) && !emailStatus && checkEmail(form.email)}
            placeholder="you@example.com"
            error={errors.email}
            right={emailRight}
          />
          <EmailStatusHint status={emailStatus} onLoginClick={() => onSwitch("login")} />

          <Divider label="or sign up with" />
          <GoogleBtn />

          <button
            onClick={nextStep}
            disabled={emailStatus === "registered"}
            className="btn-primary"
            style={{ width: "100%", marginTop: 16, padding: "13px", fontSize: 14, fontWeight: 700, letterSpacing: .3 }}
          >
            Continue →
          </button>
        </>
      )}

      {/* ══ STEP 2 ══ */}
      {step === 2 && (
        <>
          {/* Avatar */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: .6, margin: "0 0 10px" }}>Choose Avatar</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {AVATARS.map(av => (
                <button
                  key={av.id}
                  onClick={() => set("avatarId")(av.id)}
                  title={av.label}
                  style={{
                    width: 42, height: 42, borderRadius: "50%", background: av.bg,
                    border: `2px solid ${form.avatarId === av.id ? C.accent : "transparent"}`,
                    fontSize: 20, cursor: "pointer",
                    transform: form.avatarId === av.id ? "scale(1.18)" : "scale(1)",
                    boxShadow: form.avatarId === av.id ? `0 0 0 3px color-mix(in srgb,${C.accent} 25%,transparent)` : "none",
                    transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {av.emoji}
                </button>
              ))}
            </div>
          </div>

          <Input label="Password" type="password" icon="🔒" value={form.pass} onChange={set("pass")} placeholder="Min 8 chars" error={errors.pass} />
          {form.pass && (
            <div style={{ marginTop: -10, marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= strength ? strColor : C.border, transition: "background .3s" }} />
                ))}
              </div>
              <span style={{ fontSize: 10, color: strColor, fontWeight: 600 }}>{strLabel}</span>
            </div>
          )}

          <Input label="Confirm Password" type="password" icon="🔒" value={form.confirm} onChange={set("confirm")} placeholder="Repeat password" error={errors.confirm} />
          <Input label="Date of Birth" type="date" icon="🎂" value={form.dob} onChange={set("dob")} error={errors.dob} hint="You must be 18+ to join" />

          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: errors.agree ? 4 : 20 }}>
            <input type="checkbox" checked={form.agree} onChange={set("agree")} style={{ accentColor: C.accent, width: 16, height: 16, marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              I agree to the <span style={{ color: C.accent }}>Terms</span> &amp; <span style={{ color: C.accent }}>Privacy Policy</span> and confirm I'm 18+.
            </span>
          </label>
          {errors.agree && <div style={{ fontSize: 11, color: C.red, marginBottom: 14 }}>⚠ {errors.agree}</div>}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setStep(1)} className="btn-ghost" style={{ flex: 1, padding: "12px", fontSize: 13, color: C.muted }}>
              ← Back
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="btn-primary"
              style={{ flex: 2.2, padding: "12px 16px", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {loading ? (
                <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> Sending link…</>
              ) : "Create Account 🎉"}
            </button>
          </div>
        </>
      )}

      <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: C.muted }}>
        Have an account?{" "}
        <span onClick={() => onSwitch("login")} style={{ color: C.accent, cursor: "pointer", fontWeight: 700 }}>Sign in</span>
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FORGOT PASSWORD FORM
═══════════════════════════════════════════════════════════════════ */
function ForgotForm({ onSwitch }) {
  const { showToast } = useApp();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60);

  const refs = useRef([]);

  const [attemptCount, setAttemptCount] = useState(() => {
    return Number(localStorage.getItem("reset_attempts")) || 0;
  });
  const [lockoutTime, setLockoutTime] = useState(() => {
    return Number(localStorage.getItem("reset_lockout_until")) || 0;
  });

  const MAX_ATTEMPTS = 3;
  const LOCKOUT_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

  // Helper to check if currently locked out
  const isLockedOut = Date.now() < lockoutTime;

  useEffect(() => {
    if (step !== 2) return;
    const t = setInterval(() => setTimer(x => x > 0 ? x - 1 : 0), 1000);
    return () => clearInterval(t);
  }, [step]);


  const sendCode = async () => {
    const now = Date.now();

    // 1. Hard Block: Check if already locked out
    if (isLockedOut) {
      const remainingMin = Math.ceil((lockoutTime - now) / (1000 * 60));
      setError(`Too many attempts. Please try again in ${remainingMin} minutes.`);
      return;
    }

    // 2. Hard Block: Check if they just hit the limit
    if (attemptCount >= MAX_ATTEMPTS) {
      const until = now + LOCKOUT_DURATION;
      setLockoutTime(until);
      localStorage.setItem("reset_lockout_until", until);
      setError("Maximum attempts reached. Please try again in 2 hours.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Enter a valid email");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await authAPI.resetPassword(email);

      // Increment count AFTER a successful API call
      const newCount = attemptCount + 1;
      setAttemptCount(newCount);
      localStorage.setItem("reset_attempts", newCount);

      setStep(2);
      setTimer(60);
      showToast(`Reset link sent! (${newCount}/${MAX_ATTEMPTS})`, "success");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };



  const verifyOtp = () => {
    if (otp.join("").length < 6) { setError("Enter all 6 digits"); return; }
    setError(""); setStep(3);
  };

  const resetPass = async () => {
    if (pass.length < 8) { setError("At least 8 characters"); return; }
    if (pass !== confirm) { setError("Passwords don't match"); return; }
    setError(""); setLoading(true);
    try { await authAPI.updatePassword(pass); setStep(4); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleOtp = (i, val) => {
    const v = val.replace(/\D/, "").slice(-1);
    const n = [...otp]; n[i] = v; setOtp(n);
    if (v && i < 5) refs[i + 1].current?.focus();
  };

  const titles = ["", "Reset Password", "Check Your Email", "New Password", "Done! 🎉"];
  const subs = ["", "Enter your registered email", `Code sent to ${email}`, "Choose a strong password", "Password updated!"];

  const renderResendMessage = () => {
    if (isLockedOut) {
      return <span style={{ color: C.red }}>Locked: Try again in 2 hours</span>;
    }

    if (timer > 0) {
      return <span>Resend code in <strong>{timer}s</strong></span>;
    }

    return (
      <span
        onClick={sendCode}
        style={{ color: C.accent, cursor: "pointer", fontWeight: 700 }}
      >
        Resend code ({MAX_ATTEMPTS - attemptCount} left)
      </span>
    );
  };


  return (
    <div className="fade-up">
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", fontFamily: "'Syne',sans-serif", color: C.text }}>{titles[step]}</h2>
      <p style={{ fontSize: 13, color: C.muted, margin: "0 0 22px" }}>{subs[step]}</p>

      {step === 1 && (
        <>
          <Input label="Email Address" type="email" icon="📧" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" error={error} hint="We'll email a reset link" />
          <Btn onClick={sendCode} loading={loading} fullWidth size="lg">Send Reset Link →</Btn>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
            {otp.map((v, i) => (
              <input
                key={i} ref={refs[i]}
                type="text" inputMode="numeric" maxLength={1} value={v}
                onChange={e => handleOtp(i, e.target.value)}
                onKeyDown={e => { if (e.key === "Backspace" && !v && i > 0) refs[i - 1].current?.focus(); }}
                style={{
                  width: 44, height: 52, textAlign: "center",
                  fontSize: 20, fontWeight: 800, background: C.bg3,
                  border: `2px solid ${v ? C.accent : C.border}`,
                  borderRadius: 10, color: C.text, fontFamily: "inherit", outline: "none",
                  transition: "border-color .18s",
                }}
              />
            ))}
          </div>
          {error && <div style={{ fontSize: 12, color: C.red, textAlign: "center", marginBottom: 14 }}>⚠ {error}</div>}
          <Btn onClick={verifyOtp} fullWidth size="lg">Verify Code</Btn>
          {/* Replace both old resend divs with this single one */}
          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13 }}>
            {renderResendMessage()}
          </div>
          {/**  <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: C.muted }}>
            {timer > 0
              ? <span>Resend in <strong style={{ color: C.accent }}>{timer}s</strong></span>
              : <span onClick={sendCode} style={{ color: C.accent, cursor: "pointer", fontWeight: 700 }}>Resend code</span>}
          </div> */}
        </>
      )}

      {step === 3 && (
        <>
          <Input label="New Password" type="password" icon="🔒" value={pass} onChange={e => setPass(e.target.value)} placeholder="Min 8 characters" />
          <Input label="Confirm Password" type="password" icon="🔒" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat new password" />
          {error && <div style={{ fontSize: 12, color: C.red, marginBottom: 14 }}>⚠ {error}</div>}
          <Btn onClick={resetPass} loading={loading} fullWidth size="lg">Reset Password →</Btn>
        </>
      )}

      {step === 4 && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <Btn onClick={() => onSwitch("login")} fullWidth size="lg">Go to Sign In →</Btn>
        </div>
      )}

      {step < 4 && (
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: C.muted }}>
          <span onClick={() => onSwitch("login")} style={{ color: C.accent, cursor: "pointer", fontWeight: 600 }}>← Back to Sign In</span>
        </p>
      )}
    </div>
  );
}
