import { useState, useEffect, useMemo } from "react";
import { AppIcon, Logo } from "../components/ui/index";

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => onDone(), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const particles = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 3 + 1, delay: Math.random() * 1.5,
    dur: Math.random() * 4 + 3,
    color: i % 3 === 0 ? "#c084fc" : i % 3 === 1 ? "#818cf8" : "#f472b6",
  })), []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999, background: "#030308",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Syne', sans-serif",
      opacity: phase === 2 ? 0 : 1, transform: phase === 2 ? "scale(1.05)" : "scale(1)",
      transition: "opacity .6s ease, transform .6s ease",
    }}>
      <style>{`
        @keyframes sr { 0%{transform:scale(.4);opacity:.8} 100%{transform:scale(2.2);opacity:0} }
        @keyframes si { 0%{opacity:0;transform:scale(.5) rotate(-15deg)} 60%{transform:scale(1.1) rotate(3deg)} 100%{opacity:1;transform:scale(1) rotate(0deg)} }
        @keyframes st { 0%{opacity:0;letter-spacing:14px} 100%{opacity:1;letter-spacing:1px} }
        @keyframes sg { 0%{opacity:0;transform:translateY(12px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes fp { 0%,100%{transform:translateY(0) scale(1);opacity:var(--op)} 50%{transform:translateY(-20px) scale(1.3);opacity:calc(var(--op)*.3)} }
        @keyframes df { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
      `}</style>

      {/* Background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,#c084fc18 0%,transparent 70%)" }}/>
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,#818cf814 0%,transparent 70%)" }}/>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#1a1a2e22 1px,transparent 1px),linear-gradient(90deg,#1a1a2e22 1px,transparent 1px)", backgroundSize: "60px 60px", opacity: .35 }}/>
      </div>

      {/* Particles */}
      {particles.map(p => (
        <div key={p.id} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, borderRadius: "50%", background: p.color, "--op": 0.4, animation: `fp ${p.dur}s ${p.delay}s ease-in-out infinite`, pointerEvents: "none" }}/>
      ))}

      {/* Rings */}
      <div style={{ position: "relative", zIndex: 2, marginBottom: 28 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 80, height: 80, borderRadius: "50%", border: "2px solid #c084fc", opacity: 0, animation: `sr 2.4s ${i * .6}s ease-out infinite`, pointerEvents: "none" }}/>
        ))}
        <div style={{ animation: "si .9s cubic-bezier(0.34,1.26,0.64,1) both", filter: "drop-shadow(0 0 30px #c084fc88)" }}>
          <AppIcon size={80}/>
        </div>
      </div>

      <div style={{ animation: "st .8s .5s ease both", marginBottom: 10 }}><Logo size={32}/></div>
      <div style={{ fontSize: 13, color: "#6b6b8a", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif", animation: "sg .6s .9s ease both", marginBottom: 48 }}>Stream Your World</div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", animation: "sg .4s 1.1s ease both" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "linear-gradient(135deg,#c084fc,#818cf8)", animation: `df 1.2s ${i * .18}s ease-in-out infinite` }}/>
        ))}
      </div>

      <div style={{ position: "absolute", bottom: 24, fontSize: 11, color: "#6b6b8a88", letterSpacing: 1, animation: "sg .4s 1.3s ease both" }}>v2.0.0 · LumineX</div>
    </div>
  );
}
