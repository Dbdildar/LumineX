import { useState } from "react";
import { C, Btn } from "../components/ui/index";
import { useApp } from "../context/AppContext";
import { useIsMobile } from "../hooks/index";

const PLANS=[{id:"monthly",label:"Monthly",price:"$0.50",period:"/month",badge:null,savings:null},{id:"yearly",label:"Yearly",price:"$4.99",period:"/year",badge:"Most Popular",savings:"Save 17%"},{id:"lifetime",label:"Lifetime",price:"$19.99",period:"once",badge:"Best Value",savings:"Forever"}];
const FEATURES=[{icon:"🎬",title:"VIP-Exclusive Videos",desc:"Watch premium content not available to regular users"},{icon:"🚫",title:"Zero Advertisements",desc:"Enjoy uninterrupted viewing with no ads ever"},{icon:"📥",title:"Download Offline",desc:"Save any video to watch without internet"},{icon:"4K",title:"Priority HD & 4K",desc:"First in line for highest quality streams"},{icon:"⚡",title:"Early Access",desc:"Watch new content before public release"},{icon:"👑",title:"VIP Profile Badge",desc:"Stand out with an exclusive gold VIP badge"},{icon:"🎯",title:"Priority Support",desc:"Get help faster with dedicated VIP support"},{icon:"📺",title:"VIP-Only Channels",desc:"Access channels exclusively for VIP members"}];

export default function VIPPage() {
  const { setVipModal, profile } = useApp();
  const [selected, setSelected] = useState("yearly");
  const isMobile = useIsMobile();
  const plan = PLANS.find(p => p.id === selected);
  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 40, padding: "20px 0" }}>
        <div style={{ fontSize: 64, marginBottom: 16, animation: "float 3s ease-in-out infinite" }}>👑</div>
        <h1 style={{ fontSize: isMobile ? 28 : 38, fontWeight: 900, marginBottom: 12, fontFamily: "'Syne',sans-serif", background: "linear-gradient(135deg,#fbbf24,#f97316,#fbbf24)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "gradShift 3s ease infinite" }}>Unlock VIP Access</h1>
        <p style={{ fontSize: 16, color: C.muted, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>Get unlimited access to premium content, no ads, offline downloads, and an exclusive VIP badge.</p>
        {profile?.is_vip && <div style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 20px", background: "#fbbf2420", border: "1px solid #fbbf2444", borderRadius: 99 }}><span>👑</span><span style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24" }}>You're already a VIP member!</span></div>}
      </div>
      {!profile?.is_vip && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14, marginBottom: 32 }}>
            {PLANS.map(p => (
              <div key={p.id} onClick={() => setSelected(p.id)} style={{ padding: "22px 18px", borderRadius: 18, cursor: "pointer", border: `2px solid ${selected === p.id ? "#fbbf24" : C.border}`, background: selected === p.id ? "#fbbf2410" : C.bg3, transition: "all .25s", position: "relative", textAlign: "center", transform: selected === p.id ? "scale(1.03)" : "scale(1)", boxShadow: selected === p.id ? "0 0 40px #fbbf2433" : "none" }}>
                {p.badge && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#fbbf24,#f97316)", color: "#000", fontSize: 10, fontWeight: 800, padding: "3px 14px", borderRadius: 99, whiteSpace: "nowrap" }}>{p.badge}</div>}
                <div style={{ fontSize: 14, fontWeight: 700, color: C.muted, marginBottom: 8 }}>{p.label}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: selected === p.id ? "#fbbf24" : C.text, marginBottom: 4 }}>{p.price}</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{p.period}</div>
                {p.savings && <div style={{ background: "#fbbf2220", color: "#fbbf24", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, display: "inline-block" }}>{p.savings}</div>}
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <Btn onClick={() => setVipModal(true)} size="lg" style={{ background: "linear-gradient(135deg,#fbbf24,#f97316)", border: "none", boxShadow: "0 0 40px #fbbf2444", fontSize: 16, padding: "14px 48px", borderRadius: 999 }}>
              👑 Get {plan?.label} VIP — {plan?.price}
            </Btn>
            <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>Secure payment · Cancel anytime · Instant access</div>
          </div>
        </>
      )}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Syne',sans-serif", marginBottom: 20, textAlign: "center", color: C.text }}>Everything included</h2>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 12 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ display: "flex", gap: 14, padding: "16px 18px", background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 14, transition: "border-color .2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#fbbf2444"} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{f.icon}</div>
              <div><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3, color: C.text }}>{f.title}</div><div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{f.desc}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
