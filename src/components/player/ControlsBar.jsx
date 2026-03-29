import { useState, useRef, useEffect } from "react";
import { C, fmtTime } from "../ui/index";

const CAPTION_LANGS = [
  { code:"off", label:"Off",        flag:"🚫" },
  { code:"en",  label:"English",    flag:"🇬🇧" },
  { code:"hi",  label:"Hindi",      flag:"🇮🇳" },
  { code:"es",  label:"Spanish",    flag:"🇪🇸" },
  { code:"fr",  label:"French",     flag:"🇫🇷" },
  { code:"de",  label:"German",     flag:"🇩🇪" },
  { code:"ja",  label:"Japanese",   flag:"🇯🇵" },
  { code:"zh",  label:"Chinese",    flag:"🇨🇳" },
  { code:"ar",  label:"Arabic",     flag:"🇸🇦" },
  { code:"pt",  label:"Portuguese", flag:"🇧🇷" },
  { code:"ko",  label:"Korean",     flag:"🇰🇷" },
];

function PBtn({ onClick, children, title, active, style: s }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: active || hov ? `${C.accent}22` : "none",
        border: active || hov ? `1px solid var(--accent)55` : "1px solid transparent",
        borderRadius: 8, color: active || hov ? C.accent : "white",
        fontSize: 15, cursor: "pointer", padding: "4px 7px",
        lineHeight: 1, fontFamily: "inherit", transition: "all .15s",
        display: "flex", alignItems: "center", justifyContent: "center", minWidth: 30, ...s,
      }}>{children}</button>
  );
}



function CaptionPicker({ selectedLang, onSelect, videoEl, captionStatus }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const handleSelect = lang => {
    onSelect(lang.code);
    setOpen(false);
    // Safety fallback for any pre-existing static tracks
    if (videoEl) {
      const tracks = videoEl.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i].label !== "AI Caption") {
          tracks[i].mode = "hidden";
        }
      }
    }
  };

  const isOn = selectedLang !== "off";
  const current = CAPTION_LANGS.find(l => l.code === selectedLang) || CAPTION_LANGS[0];

  const isLoading = isOn && captionStatus === "loading";
  const isActive  = isOn && captionStatus === "active";
  const isError   = isOn && captionStatus === "error";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Captions / AI Subtitles"
        style={{
          background: isOn ? `${C.accent}22` : "rgba(255,255,255,.12)",
          border: isOn ? `1px solid ${C.accent}55` : "1px solid transparent",
          borderRadius: 6,
          color: isOn ? C.accent : "rgba(255,255,255,.8)",
          fontSize: 11,
          fontWeight: 800,
          cursor: "pointer",
          padding: "4px 8px",
          fontFamily: "inherit",
          transition: "all .15s",
          display: "flex",
          alignItems: "center",
          gap: 4,
          textDecoration: isOn ? "none" : "line-through rgba(255,255,255,.5)",
          position: "relative",
        }}
      >
        CC
        {isOn && <span style={{ fontSize: 9 }}>{current.flag}</span>}

        {isLoading && (
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            border: `1.5px solid ${C.accent}`,
            borderTopColor: "transparent",
            animation: "spin .7s linear infinite",
            display: "inline-block",
            flexShrink: 0,
          }} />
        )}
        {isActive && (
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#00e676",
            display: "inline-block",
            flexShrink: 0,
            boxShadow: "0 0 4px #00e676",
          }} />
        )}
        {isError && (
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#ff5252",
            display: "inline-block",
            flexShrink: 0,
          }} />
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          right: 0,
          background: C.bg2,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          overflow: "hidden",
          zIndex: 999,
          minWidth: 180,
          boxShadow: "0 8px 32px rgba(0,0,0,.8)",
          animation: "fadeUp .18s ease",
        }}>
          <div style={{
            padding: "10px 14px 8px",
            fontSize: 11,
            fontWeight: 700,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: .8,
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span>🌐 Subtitles / CC</span>
            {captionStatus === "loading" && isOn && (
              <span style={{ fontSize: 9, color: C.accent, fontWeight: 600, background: `${C.accent}18`, padding: "2px 6px", borderRadius: 4 }}>
                AI loading…
              </span>
            )}
            {captionStatus === "active" && isOn && (
              <span style={{ fontSize: 9, color: "#00e676", fontWeight: 600, background: "#00e67618", padding: "2px 6px", borderRadius: 4 }}>
                ● AI live
              </span>
            )}
            {captionStatus === "error" && isOn && (
              <span style={{ fontSize: 9, color: "#ff5252", fontWeight: 600, background: "#ff525218", padding: "2px 6px", borderRadius: 4 }}>
                ⚠ Error
              </span>
            )}
          </div>

          {CAPTION_LANGS.map(lang => (
            <div
              key={lang.code}
              onClick={() => handleSelect(lang)}
              style={{
                padding: "9px 14px",
                cursor: "pointer",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: selectedLang === lang.code ? C.accent : C.text,
                background: selectedLang === lang.code ? `${C.accent}15` : "transparent",
                fontWeight: selectedLang === lang.code ? 700 : 400,
                transition: "background .12s",
              }}
              onMouseEnter={e => { if (selectedLang !== lang.code) e.currentTarget.style.background = C.bg3; }}
              onMouseLeave={e => { if (selectedLang !== lang.code) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{lang.flag}</span>
              <span style={{ flex: 1 }}>{lang.label}</span>
              {selectedLang === lang.code && (
                <span style={{ color: C.accent }}>✓</span>
              )}
            </div>
          ))}

          <div style={{
            padding: "8px 14px",
            fontSize: 10,
            color: C.muted,
            borderTop: `1px solid ${C.border}`,
            textAlign: "center",
          }}>
            ⚡ Powered by Whisper AI
          </div>
        </div>
      )}
    </div>
  );
}


function Seekbar({ prog, dur, buffered, onSeek }) {
  const ref = useRef(null);
  const [hoverPct, setHoverPct] = useState(null);
  const getPct = clientX => { const r = ref.current?.getBoundingClientRect(); if (!r) return 0; return Math.max(0, Math.min(1, (clientX - r.left) / r.width)); };
  return (
    <div ref={ref} onClick={e => { e.stopPropagation(); onSeek(getPct(e.clientX)); }}
      onMouseMove={e => setHoverPct(getPct(e.clientX))}
      onMouseLeave={() => setHoverPct(null)}
      onTouchMove={e => { e.stopPropagation(); onSeek(getPct(e.touches[0].clientX)); }}
      data-seekbar
      style={{ height: 5, background: "rgba(255,255,255,.2)", borderRadius: 5, marginBottom: 12, cursor: "pointer", position: "relative", transition: "height .15s" }}
      onMouseEnter={e => e.currentTarget.style.height = "7px"}
    >
      {buffered > 0 && <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${buffered}%`, background: "rgba(255,255,255,.2)", borderRadius: 5 }}/>}
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${prog}%`, background: `linear-gradient(90deg,${C.accent},${C.accent2})`, borderRadius: 5, transition: "width .1s linear" }}/>
      <div style={{ position: "absolute", top: "50%", left: `${prog}%`, transform: "translate(-50%,-50%)", width: 14, height: 14, borderRadius: "50%", background: "white", boxShadow: `0 0 8px ${C.accent}`, transition: "left .1s linear", zIndex: 2 }}/>
      {hoverPct !== null && dur > 0 && (
        <>
          <div style={{ position: "absolute", top: 0, left: `${hoverPct * 100}%`, bottom: 0, width: 2, background: "rgba(255,255,255,.5)", transform: "translateX(-50%)", pointerEvents: "none" }}/>
          <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: `${hoverPct * 100}%`, transform: "translateX(-50%)", background: "rgba(0,0,0,.85)", border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, color: "white", whiteSpace: "nowrap", pointerEvents: "none" }}>
            {fmtTime(hoverPct * dur)}
          </div>
        </>
      )}
    </div>
  );
}

export default function ControlsBar({
  playing, muted, vol, prog, dur, curTime, speed, isFS, isMobile,
  showCtrl, vRef, captionLang, onCaptionChange,
  togglePlay, seekBy, toggleFS, setSpeedTo, onMute, onVolume,
  buffered, isBuffering,captionStatus
}) {
  const [speedMenu, setSpeedMenu] = useState(false);
  const speedRef = useRef(null);
  useEffect(() => {
    if (!speedMenu) return;
    const h = e => { if (speedRef.current && !speedRef.current.contains(e.target)) setSpeedMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [speedMenu]);
  const handleSeek = pct => { const v = vRef.current; if (v && v.duration) v.currentTime = pct * v.duration; };
  return (
    <div onClick={e => e.stopPropagation()} style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: "linear-gradient(transparent,rgba(0,0,0,.95))",
      padding: isFS ? "60px 20px 20px" : isMobile ? "36px 12px 12px" : "48px 16px 14px",
      opacity: showCtrl ? 1 : 0,
      transform: showCtrl ? "translateY(0)" : "translateY(8px)",
      transition: "opacity .35s ease, transform .35s ease",
      pointerEvents: showCtrl ? "auto" : "none", zIndex: 30,
    }}>
      <Seekbar prog={prog} dur={dur} buffered={buffered || 0} onSeek={handleSeek} isBuffering={isBuffering}/>
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 4 : 8 }}>
        <PBtn onClick={togglePlay} title="Space">{playing ? "⏸" : "▶"}</PBtn>
        <PBtn onClick={() => seekBy(-10)} title="-10s">
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
            <span style={{ fontSize: 12 }}>⟲</span><span style={{ fontSize: 7 }}>10</span>
          </span>
        </PBtn>
        <PBtn onClick={() => seekBy(10)} title="+10s">
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
            <span style={{ fontSize: 12 }}>⟳</span><span style={{ fontSize: 7 }}>10</span>
          </span>
        </PBtn>
        <PBtn onClick={onMute}>{muted ? "🔇" : "🔊"}</PBtn>
        {(!isMobile || isFS) && (
          <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : vol}
            onChange={e => onVolume(+e.target.value)}
            style={{ width: isFS ? 90 : 70, accentColor: "var(--accent)", cursor: "pointer" }}/>
        )}
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.65)", whiteSpace: "nowrap" }}>
          {fmtTime(curTime)} / {fmtTime(dur)}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 5, alignItems: "center" }}>
          <CaptionPicker selectedLang={captionLang || "off"} onSelect={onCaptionChange} videoEl={vRef.current} captionStatus={captionStatus}/>
          <div ref={speedRef} style={{ position: "relative" }}>
            <button onClick={() => setSpeedMenu(s => !s)} style={{
              fontSize: 11, background: speed !== 1 ? `${C.accent}22` : "rgba(255,255,255,.16)",
              border: speed !== 1 ? `1px solid var(--accent)55` : "1px solid transparent",
              borderRadius: 6, cursor: "pointer",
              color: speed !== 1 ? C.accent : "white", padding: "4px 9px",
              fontFamily: "inherit", fontWeight: 700, transition: "all .15s",
            }}>{speed}×</button>
            {speedMenu && (
              <div style={{ position: "absolute", bottom: "calc(100% + 8px)", right: 0, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", zIndex: 999, minWidth: 100, boxShadow: "0 8px 30px rgba(0,0,0,.8)", animation: "fadeUp .18s ease" }}>
                <div style={{ padding: "8px 12px 6px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: .8, borderBottom: `1px solid ${C.border}` }}>Speed</div>
                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(s => (
                  <div key={s} onClick={() => { setSpeedTo(s); setSpeedMenu(false); }}
                    style={{ padding: "8px 14px", cursor: "pointer", fontSize: 12, color: speed === s ? C.accent : C.text, background: speed === s ? `${C.accent}15` : "transparent", fontWeight: speed === s ? 700 : 400, display: "flex", alignItems: "center", gap: 8, transition: "background .1s" }}
                    onMouseEnter={e => { if (speed !== s) e.currentTarget.style.background = C.bg3; }}
                    onMouseLeave={e => { if (speed !== s) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span>{s === 1 ? "Normal" : `${s}×`}</span>
                    {speed === s && <span style={{ marginLeft: "auto", color: C.accent }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <PBtn onClick={toggleFS} title="F" active={isFS}>{isFS ? "⊡" : "⛶"}</PBtn>
        </div>
      </div>
    </div>
  );
}
