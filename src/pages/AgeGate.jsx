import { useState, useMemo } from "react";
import { AppIcon, Logo } from "../components/ui/index";

export default function AgeGate({ onEnter }) {
  const [leaving, setLeaving] = useState(false);
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 3 + 1, delay: Math.random() * 4, dur: Math.random() * 5 + 4, op: Math.random() * .4 + .1, color: i % 3 === 0 ? "#c084fc" : i % 3 === 1 ? "#818cf8" : "#f472b6" })), []);
  const leave = () => { setLeaving(true); setTimeout(() => { window.location.href = "https://www.google.com"; }, 700); };
  return (
    <div style={{ position: "fixed", inset: 0, background: "#030308", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", opacity: leaving ? 0 : 1, transform: leaving ? "scale(1.04)" : "scale(1)", transition: "opacity .7s, transform .7s" }}>
      <style>{`
        @keyframes agf{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes agl{0%,100%{box-shadow:0 0 30px #c084fc44}50%{box-shadow:0 0 60px #c084fc88}}
        @keyframes tw{0%,100%{opacity:var(--op);transform:scale(1)}50%{opacity:calc(var(--op)*.2);transform:scale(.6)}}
        @keyframes ao1{from{transform:rotate(0deg) translateX(110px) rotate(0deg)}to{transform:rotate(360deg) translateX(110px) rotate(-360deg)}}
        @keyframes ao2{from{transform:rotate(180deg) translateX(80px) rotate(-180deg)}to{transform:rotate(540deg) translateX(80px) rotate(-540deg)}}
      `}</style>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 25% 35%,#c084fc14 0%,transparent 65%),radial-gradient(ellipse 50% 60% at 75% 65%,#818cf810 0%,transparent 65%)", pointerEvents: "none" }}/>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#1a1a2e33 1px,transparent 1px),linear-gradient(90deg,#1a1a2e33 1px,transparent 1px)", backgroundSize: "60px 60px", opacity: .4, pointerEvents: "none" }}/>
      {particles.map(p => <div key={p.id} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, borderRadius: "50%", background: p.color, "--op": p.op, opacity: p.op, animation: `tw ${p.dur}s ${p.delay}s ease-in-out infinite`, pointerEvents: "none" }}/>)}
      {/* Orbital rings */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 320, height: 320, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid #c084fc22", animation: "spin 20s linear infinite" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", animation: "ao1 8s linear infinite" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c084fc", boxShadow: "0 0 10px #c084fc", transform: "translate(-50%,-50%)" }}/></div>
        </div>
        <div style={{ position: "absolute", inset: 40, borderRadius: "50%", border: "1px solid #818cf822", animation: "spin 14s linear infinite reverse" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", animation: "ao2 5s linear infinite" }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#818cf8", boxShadow: "0 0 10px #818cf8", transform: "translate(-50%,-50%)" }}/></div>
        </div>
      </div>
      {/* Card */}
      <div style={{ position: "relative", zIndex: 2, background: "rgba(8,8,15,.88)", backdropFilter: "blur(32px)", border: "1px solid #c084fc28", borderRadius: 28, padding: "40px 36px", maxWidth: 460, width: "calc(100% - 32px)", textAlign: "center", boxShadow: "0 0 0 1px #1a1a2e,0 40px 80px rgba(0,0,0,.6)", animation: "fadeUp .7s cubic-bezier(0.34,1.26,0.64,1)" }}>
        <div style={{ marginBottom: 16, animation: "agf 4s ease-in-out infinite, agl 3s ease-in-out infinite", display: "inline-block" }}><AppIcon size={64}/></div>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#c084fc,#f472b6)", fontSize: 16, fontWeight: 900, color: "white", marginBottom: 16, boxShadow: "0 0 0 8px #c084fc18,0 0 40px #c084fc44" }}>18+</div>
        <div style={{ marginBottom: 6 }}><Logo size={28}/></div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#f0f0f8", marginBottom: 10, fontFamily: "'Syne',sans-serif" }}>Age Verification Required</h2>
        <div style={{ width: 40, height: 3, margin: "0 auto 14px", background: "linear-gradient(90deg,#c084fc,#818cf8)", borderRadius: 99 }}/>
        <p style={{ fontSize: 13, color: "#6b6b8a", lineHeight: 1.8, marginBottom: 24 }}>
          This website contains <strong style={{ color: "#f0f0f8" }}>adult content</strong>.<br/>
          By entering you confirm you are <strong style={{ color: "#c084fc" }}>18 years or older</strong> and agree to our Terms of Service.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={onEnter} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#c084fc,#818cf8)", color: "white", fontFamily: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 0 30px #c084fc44", transition: "all .25s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            ✓ I am 18+ — Enter Now
          </button>
          <button onClick={leave} style={{ width: "100%", padding: "13px", borderRadius: 14, border: "1px solid #1a1a2e", background: "rgba(255,255,255,.04)", color: "#6b6b8a", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#f8717166"; e.currentTarget.style.color = "#f87171"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a1a2e"; e.currentTarget.style.color = "#6b6b8a"; }}>
            ✕ I am under 18 — Leave
          </button>
        </div>
        <div style={{ marginTop: 16, fontSize: 11, color: "#6b6b8a66", lineHeight: 1.6 }}>🔒 We do not store personal data during verification.</div>
      </div>
    </div>
  );
}
