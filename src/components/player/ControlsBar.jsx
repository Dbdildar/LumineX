import { useState, useRef, useEffect, useCallback } from "react";
import { C, fmtTime } from "../ui/index";

const CAPTION_LANGS = [
  { code: "off", label: "Off", flag: "🚫" },
  { code: "en",  label: "English", flag: "🇬🇧" },
  { code: "hi",  label: "Hindi",   flag: "🇮🇳" },
  { code: "fr",  label: "French",  flag: "🇫🇷" },
];

function PBtn({ onClick, children, title, active, style: s }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: active || hov ? `${C.accent}22` : "none", border: active || hov ? "1px solid var(--accent)55" : "1px solid transparent", borderRadius: 8, color: active || hov ? C.accent : "white", fontSize: 15, cursor: "pointer", padding: "5px 8px", lineHeight: 1, fontFamily: "inherit", transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 32, flexShrink: 0, ...s }}>
      {children}
    </button>
  );
}

function Seekbar({ prog, dur, buffered, onSeek }) {
  const ref = useRef(null);
  const [hoverPct, setHoverPct] = useState(null);
  const [dragging, setDragging] = useState(false);
  const getPct = (clientX) => { const r = ref.current?.getBoundingClientRect(); if (!r) return 0; return Math.max(0, Math.min(1, (clientX - r.left) / r.width)); };
  const onDown = (e) => { setDragging(true); onSeek(getPct(e.clientX)); };
  const onMove = (e) => { if (dragging) onSeek(getPct(e.clientX)); setHoverPct(getPct(e.clientX)); };
  useEffect(() => {
    if (!dragging) return;
    const m = (e) => onSeek(getPct(e.clientX)), u = () => setDragging(false);
    window.addEventListener("mousemove", m); window.addEventListener("mouseup", u);
    return () => { window.removeEventListener("mousemove", m); window.removeEventListener("mouseup", u); };
  }, [dragging]);
  return (
    <div ref={ref} onMouseDown={onDown} onMouseMove={onMove} onMouseLeave={() => setHoverPct(null)}
      onTouchMove={(e) => { e.stopPropagation(); onSeek(getPct(e.touches[0].clientX)); }}
      data-seekbar
      style={{ height: 4, background: "rgba(255,255,255,.2)", borderRadius: 4, marginBottom: 12, cursor: "pointer", position: "relative", transition: "height .15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.height = "7px")}>
      {buffered > 0 && <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${buffered}%`, background: "rgba(255,255,255,.22)", borderRadius: 4 }} />}
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${prog}%`, background: `linear-gradient(90deg,${C.accent},${C.accent2 || "#818cf8"})`, borderRadius: 4, transition: "width .08s linear" }} />
      <div style={{ position: "absolute", top: "50%", left: `${prog}%`, transform: "translate(-50%,-50%)", width: 14, height: 14, borderRadius: "50%", background: "white", boxShadow: `0 0 8px ${C.accent}`, transition: "left .08s linear", zIndex: 2 }} />
      {hoverPct !== null && dur > 0 && (<>
        <div style={{ position: "absolute", top: 0, left: `${hoverPct * 100}%`, bottom: 0, width: 2, background: "rgba(255,255,255,.5)", transform: "translateX(-50%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "calc(100% + 10px)", left: `${hoverPct * 100}%`, transform: "translateX(-50%)", background: "rgba(0,0,0,.9)", border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 700, color: "white", whiteSpace: "nowrap", pointerEvents: "none", boxShadow: "0 4px 12px rgba(0,0,0,.5)" }}>
          {fmtTime(hoverPct * dur)}
        </div>
      </>)}
    </div>
  );
}

// ── FIX: Mobile bottom sheet — renders in document.body portal-style via fixed positioning ──
// Key fix: use position:fixed with very high z-index so it escapes any
// parent overflow:hidden or transform contexts (which trap fixed children on iOS).
// The sheet content uses overflow-y:auto with explicit max-height so ALL items are scrollable.
function MobileSheet({ open, onClose, title, children }) {
  // Lock body scroll while sheet is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes slideUpSheet { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeInSheet  { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* Backdrop — fixed, full screen, very high z */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,.75)",
        zIndex: 9999990,
        WebkitTapHighlightColor: "transparent",
        backdropFilter: "blur(4px)",
        animation: "fadeInSheet .2s ease",
      }} />

      {/* Sheet — fixed to bottom of VIEWPORT (not parent) */}
      <div onClick={e => e.stopPropagation()} style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        // FIX: cap at 60vh so it never fills the screen and all items are reachable
        maxHeight: "60vh",
        background: C.bg2 || "#1a1a2e",
        borderRadius: "20px 20px 0 0",
        borderTop: `1px solid ${C.border}`,
        zIndex: 9999991,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 -8px 40px rgba(0,0,0,.9)",
        animation: "slideUpSheet .28s cubic-bezier(0.36,0.07,0.19,0.97)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 6px", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,.28)" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 10px", borderBottom: `1px solid ${C.border}44`, flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: C.text, textTransform: "uppercase", letterSpacing: 0.8 }}>{title}</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.1)", border: "none", borderRadius: "50%", color: "white", width: 28, height: 28, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* FIX: Scrollable content area — explicit overflow-y:auto ensures ALL items visible */}
        <div style={{
          overflowY: "auto",
          flex: "1 1 auto",
          WebkitOverflowScrolling: "touch",
          // Never let this collapse to 0
          minHeight: 0,
        }}>
          {children}
        </div>
      </div>
    </>
  );
}

function CaptionPicker({ selectedLang, onSelect, videoEl, captionStatus, isMobile, onMenuToggle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const handleOpen = useCallback((val) => { setOpen(val); onMenuToggle?.(val); }, [onMenuToggle]);

  useEffect(() => {
    if (!open || isMobile) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) handleOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, isMobile, handleOpen]);

  const handleSelect = (lang) => {
    onSelect(lang.code); handleOpen(false);
    if (videoEl) { const t = videoEl.textTracks; for (let i = 0; i < t.length; i++) if (t[i].label !== "AI Caption") t[i].mode = "hidden"; }
  };

  const isOn = selectedLang !== "off";
  const current = CAPTION_LANGS.find(l => l.code === selectedLang) || CAPTION_LANGS[0];
  const isLoading = isOn && captionStatus === "loading";
  const isActive  = isOn && captionStatus === "active";
  const isError   = isOn && captionStatus === "error";

  const triggerBtn = (
    <button onClick={() => handleOpen(!open)} style={{
      background: isOn ? `${C.accent}22` : "rgba(255,255,255,.12)",
      border: isOn ? `1px solid ${C.accent}55` : "1px solid transparent",
      borderRadius: 6, color: isOn ? C.accent : "rgba(255,255,255,.85)",
      fontSize: 11, fontWeight: 800, cursor: "pointer", padding: "5px 9px",
      fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
      textDecoration: isOn ? "none" : "line-through rgba(255,255,255,.5)",
    }}>
      CC
      {isOn && <span style={{ fontSize: 9 }}>{current.flag}</span>}
      {isLoading && <span style={{ width: 6, height: 6, borderRadius: "50%", border: `1.5px solid ${C.accent}`, borderTopColor: "transparent", animation: "spin .7s linear infinite" }} />}
      {isActive  && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e676", boxShadow: "0 0 4px #00e676" }} />}
      {isError   && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff5252" }} />}
    </button>
  );

  // FIX: Compact row items for mobile sheet — smaller padding, fits more items
  const langList = (
    <div>
      {CAPTION_LANGS.map(lang => (
        <div key={lang.code} onClick={() => handleSelect(lang)} style={{
          padding: "13px 16px", cursor: "pointer", fontSize: 14,
          display: "flex", alignItems: "center", gap: 10,
          color: selectedLang === lang.code ? C.accent : C.text,
          background: selectedLang === lang.code ? `${C.accent}18` : "transparent",
          fontWeight: selectedLang === lang.code ? 700 : 400,
          borderBottom: `1px solid ${C.border}22`,
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{lang.flag}</span>
          <span style={{ flex: 1 }}>{lang.label}</span>
          {selectedLang === lang.code && <span style={{ color: C.accent, fontSize: 15 }}>✓</span>}
        </div>
      ))}
      <div style={{ padding: "10px 16px", fontSize: 10, color: C.muted, textAlign: "center" }}>
        ⚡ Powered by Whisper AI
      </div>
    </div>
  );

  if (isMobile) return (
    <>
      {triggerBtn}
      <MobileSheet open={open} onClose={() => handleOpen(false)} title="🌐 Subtitles / CC">
        {langList}
      </MobileSheet>
    </>
  );

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      {triggerBtn}
      {open && (
        <div style={{ position: "absolute", bottom: "calc(100% + 8px)", right: 0, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", zIndex: 999, minWidth: 200, boxShadow: "0 8px 32px rgba(0,0,0,.8)" }}>
          <div style={{ padding: "12px 16px 10px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>🌐 Subtitles / CC</span>
          </div>
          <div style={{ overflowY: "auto", maxHeight: 280 }}>
            {CAPTION_LANGS.map(lang => (
              <div key={lang.code} onClick={() => handleSelect(lang)} style={{ padding: "12px 16px", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 12, color: selectedLang === lang.code ? C.accent : C.text, background: selectedLang === lang.code ? `${C.accent}15` : "transparent", fontWeight: selectedLang === lang.code ? 700 : 400, borderBottom: `1px solid ${C.border}22` }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{lang.flag}</span>
                <span style={{ flex: 1 }}>{lang.label}</span>
                {selectedLang === lang.code && <span style={{ color: C.accent, fontSize: 15 }}>✓</span>}
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 16px", fontSize: 10, color: C.muted, borderTop: `1px solid ${C.border}`, textAlign: "center" }}>⚡ Powered by Whisper AI</div>
        </div>
      )}
    </div>
  );
}

function SpeedMenu({ speed, setSpeedTo, isMobile, onMenuToggle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const handleOpen = useCallback((val) => { setOpen(val); onMenuToggle?.(val); }, [onMenuToggle]);

  useEffect(() => {
    if (!open || isMobile) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) handleOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, isMobile, handleOpen]);

  const triggerBtn = (
    <button onClick={() => handleOpen(!open)} style={{
      fontSize: 11,
      background: speed !== 1 ? `${C.accent}22` : "rgba(255,255,255,.16)",
      border: speed !== 1 ? "1px solid var(--accent)55" : "1px solid transparent",
      borderRadius: 6, cursor: "pointer",
      color: speed !== 1 ? C.accent : "white",
      padding: "5px 9px", fontFamily: "inherit", fontWeight: 800,
    }}>
      {speed}×
    </button>
  );

  // FIX: Compact speed rows for mobile — 2-column grid so all 8 fit without scrolling
  const speedGrid = (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, padding: "8px" }}>
      {SPEEDS.map(s => (
        <div key={s} onClick={() => { setSpeedTo(s); handleOpen(false); }} style={{
          padding: "14px 10px", cursor: "pointer", fontSize: 14, textAlign: "center",
          color: speed === s ? C.accent : C.text,
          background: speed === s ? `${C.accent}18` : `${C.bg3}`,
          fontWeight: speed === s ? 800 : 400,
          borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          {speed === s && <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.accent, display: "inline-block" }} />}
          <span>{s === 1 ? "Normal" : `${s}×`}</span>
          {speed === s && <span style={{ color: C.accent, fontSize: 13 }}>✓</span>}
        </div>
      ))}
    </div>
  );

  if (isMobile) return (
    <>
      {triggerBtn}
      <MobileSheet open={open} onClose={() => handleOpen(false)} title="⚡ Playback Speed">
        {speedGrid}
      </MobileSheet>
    </>
  );

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      {triggerBtn}
      {open && (
        <div style={{ position: "absolute", bottom: "calc(100% + 8px)", right: 0, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", zIndex: 999, minWidth: 110, boxShadow: "0 8px 30px rgba(0,0,0,.8)" }}>
          <div style={{ padding: "10px 16px 8px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>⚡ Speed</div>
          <div style={{ overflowY: "auto", maxHeight: 240 }}>
            {SPEEDS.map(s => (
              <div key={s} onClick={() => { setSpeedTo(s); handleOpen(false); }} style={{ padding: "10px 16px", cursor: "pointer", fontSize: 14, color: speed === s ? C.accent : C.text, background: speed === s ? `${C.accent}15` : "transparent", fontWeight: speed === s ? 800 : 400, display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.border}22` }}>
                {speed === s && <div style={{ width: 4, height: 18, borderRadius: 2, background: C.accent }} />}
                <span style={{ flex: 1 }}>{s === 1 ? "Normal" : `${s}×`}</span>
                {speed === s && <span style={{ color: C.accent, fontSize: 15 }}>✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ControlsBar({
  playing, muted, vol, prog, dur, curTime, speed, isFS, isMobile,
  showCtrl, vRef, captionLang, onCaptionChange,
  togglePlay, seekBy, toggleFS, setSpeedTo, onMute, onVolume,
  buffered, isBuffering, captionStatus, onMenuToggle,
}) {
  const handleSeek = (pct) => { const v = vRef.current; if (v && v.duration) v.currentTime = pct * v.duration; };

  return (
    <div onClick={e => e.stopPropagation()} style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: "linear-gradient(transparent,rgba(0,0,0,.92))",
      padding: isFS ? "60px 20px 22px" : isMobile ? "38px 12px 14px" : "52px 18px 16px",
      opacity: showCtrl ? 1 : 0,
      transform: showCtrl || isMobile ? "translateY(0)" : "translateY(8px)",
      transition: "opacity .3s ease, transform .3s ease",
      pointerEvents: "auto", zIndex: 10000, overflow: "visible",
    }}>
      <Seekbar prog={prog} dur={dur} buffered={buffered || 0} onSeek={handleSeek} />
      <div style={{
        display: "flex", alignItems: "center",
        gap: isMobile ? 4 : 8,
        opacity: showCtrl ? 1 : 0, transition: "opacity .2s ease",
        ...(isMobile ? { overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none", paddingBottom: 2 } : {}),
      }}>
        <PBtn onClick={togglePlay}>{playing ? "⏸" : "▶"}</PBtn>
        <PBtn onClick={() => seekBy(-10)} title="Rewind 10s">⟲</PBtn>
        <PBtn onClick={() => seekBy(10)}  title="Forward 10s">⟳</PBtn>
        <PBtn onClick={onMute}>{muted ? "🔇" : "🔊"}</PBtn>
        {(!isMobile || isFS) && (
          <input type="range" min={0} max={1} step={0.05}
            value={muted ? 0 : vol} onChange={e => onVolume(+e.target.value)}
            style={{ width: isFS ? 90 : 70, accentColor: "var(--accent)" }} />
        )}
        <span style={{ fontSize: 11, color: "white", whiteSpace: "nowrap" }}>{fmtTime(curTime)} / {fmtTime(dur)}</span>
        <div style={{ flex: 1 }} />
        <CaptionPicker selectedLang={captionLang || "off"} onSelect={onCaptionChange} videoEl={vRef.current} captionStatus={captionStatus} isMobile={isMobile} onMenuToggle={onMenuToggle} />
        <SpeedMenu speed={speed} setSpeedTo={setSpeedTo} isMobile={isMobile} onMenuToggle={onMenuToggle} />
        <PBtn onClick={toggleFS}>{isFS ? "⊡" : "⛶"}</PBtn>
      </div>
    </div>
  );
}
