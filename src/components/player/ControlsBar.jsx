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

// ── Pill button ───────────────────────────────────────────────────────────────
function PBtn({ onClick, children, title, active, style: s }) {
  const [hov,setHov]=useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        background:active||hov?`${C.accent}22`:"none",
        border:active||hov?`1px solid var(--accent)55`:"1px solid transparent",
        borderRadius:8,color:active||hov?C.accent:"white",
        fontSize:15,cursor:"pointer",padding:"5px 8px",
        lineHeight:1,fontFamily:"inherit",transition:"all .15s",
        display:"flex",alignItems:"center",justifyContent:"center",minWidth:32,flexShrink:0,...s,
      }}>{children}</button>
  );
}

// ── Seekbar with hover preview ────────────────────────────────────────────────
function Seekbar({ prog, dur, buffered, onSeek }) {
  const ref=useRef(null);
  const [hoverPct,setHoverPct]=useState(null);
  const [dragging,setDragging]=useState(false);
  const getPct=clientX=>{ const r=ref.current?.getBoundingClientRect();if(!r)return 0;return Math.max(0,Math.min(1,(clientX-r.left)/r.width)); };

  const onDown=e=>{ setDragging(true); onSeek(getPct(e.clientX)); };
  const onMove=e=>{ if(dragging){onSeek(getPct(e.clientX));} setHoverPct(getPct(e.clientX)); };
  const onUp=e=>{ setDragging(false); onSeek(getPct(e.clientX)); };

  useEffect(()=>{
    if (!dragging) return;
    const m=e=>onSeek(getPct(e.clientX));
    const u=()=>setDragging(false);
    window.addEventListener("mousemove",m); window.addEventListener("mouseup",u);
    return()=>{ window.removeEventListener("mousemove",m); window.removeEventListener("mouseup",u); };
  },[dragging]); // eslint-disable-line

  return (
    <div ref={ref} onMouseDown={onDown} onMouseMove={onMove} onMouseLeave={()=>setHoverPct(null)}
      onTouchMove={e=>{e.stopPropagation();onSeek(getPct(e.touches[0].clientX));}}
      data-seekbar
      style={{ height:4,background:"rgba(255,255,255,.2)",borderRadius:4,marginBottom:12,cursor:"pointer",position:"relative",transition:"height .15s" }}
      onMouseEnter={e=>e.currentTarget.style.height="7px"}
    >
      {/* Buffered */}
      {buffered>0&&<div style={{ position:"absolute",top:0,left:0,bottom:0,width:`${buffered}%`,background:"rgba(255,255,255,.22)",borderRadius:4 }}/>}
      {/* Played */}
      <div style={{ position:"absolute",top:0,left:0,bottom:0,width:`${prog}%`,background:`linear-gradient(90deg,${C.accent},${C.accent2||"#818cf8"})`,borderRadius:4,transition:"width .08s linear" }}/>
      {/* Thumb */}
      <div style={{ position:"absolute",top:"50%",left:`${prog}%`,transform:"translate(-50%,-50%)",width:14,height:14,borderRadius:"50%",background:"white",boxShadow:`0 0 8px ${C.accent}`,transition:"left .08s linear",zIndex:2 }}/>
      {/* Hover time */}
      {hoverPct!==null&&dur>0&&(
        <>
          <div style={{ position:"absolute",top:0,left:`${hoverPct*100}%`,bottom:0,width:2,background:"rgba(255,255,255,.5)",transform:"translateX(-50%)",pointerEvents:"none" }}/>
          <div style={{ position:"absolute",bottom:"calc(100% + 10px)",left:`${hoverPct*100}%`,transform:"translateX(-50%)",background:"rgba(0,0,0,.9)",border:`1px solid ${C.border}`,borderRadius:6,padding:"3px 9px",fontSize:11,fontWeight:700,color:"white",whiteSpace:"nowrap",pointerEvents:"none",boxShadow:"0 4px 12px rgba(0,0,0,.5)" }}>
            {fmtTime(hoverPct*dur)}
          </div>
        </>
      )}
    </div>
  );
}

// ── Caption Picker — vertical scroll on mobile ────────────────────────────────
function CaptionPicker({ selectedLang, onSelect, videoEl, captionStatus, isMobile }) {
  const [open,setOpen]=useState(false);
  const ref=useRef(null);

  useEffect(()=>{
    if (!open) return;
    const h=e=>{ if(ref.current&&!ref.current.contains(e.target))setOpen(false); };
    document.addEventListener("mousedown",h); document.addEventListener("touchstart",h);
    return()=>{ document.removeEventListener("mousedown",h); document.removeEventListener("touchstart",h); };
  },[open]);

  const handleSelect=lang=>{ onSelect(lang.code); setOpen(false); if(videoEl){ const t=videoEl.textTracks; for(let i=0;i<t.length;i++) if(t[i].label!=="AI Caption") t[i].mode="hidden"; } };

  const isOn=selectedLang!=="off";
  const current=CAPTION_LANGS.find(l=>l.code===selectedLang)||CAPTION_LANGS[0];
  const isLoading=isOn&&captionStatus==="loading";
  const isActive=isOn&&captionStatus==="active";
  const isError=isOn&&captionStatus==="error";

  // Mobile: bottom sheet style; Desktop: popover
  const dropStyle = isMobile ? {
    position:"fixed",
    bottom:0,left:0,right:0,
    background:C.bg2,
    borderRadius:"20px 20px 0 0",
    border:`1px solid ${C.border}`,
    zIndex:9999,
    maxHeight:"70vh",
    boxShadow:"0 -8px 32px rgba(0,0,0,.8)",
    animation:"fadeUp .2s ease",
    overflow:"hidden",
    display:"flex",
    flexDirection:"column",
    overflowY: "auto",
  } : {
    position:"absolute",bottom:"calc(100% + 8px)",right:0,
    background:C.bg2,border:`1px solid ${C.border}`,
    borderRadius:14,overflow:"hidden",zIndex:999,minWidth:200,
    boxShadow:"0 8px 32px rgba(0,0,0,.8)",animation:"fadeUp .18s ease",
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile&&open&&<div onClick={()=>setOpen(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:9998 }}/>}

      <div ref={ref} style={{ position:"relative" }}>
        <button onClick={()=>setOpen(v=>!v)} title="Captions" style={{
          background:isOn?`${C.accent}22`:"rgba(255,255,255,.12)",
          border:isOn?`1px solid ${C.accent}55`:"1px solid transparent",
          borderRadius:6,color:isOn?C.accent:"rgba(255,255,255,.85)",
          fontSize:11,fontWeight:800,cursor:"pointer",padding:"5px 9px",
          fontFamily:"inherit",transition:"all .15s",
          display:"flex",alignItems:"center",gap:4,flexShrink:0,
          textDecoration:isOn?"none":"line-through rgba(255,255,255,.5)",
        }}>
          CC
          {isOn&&<span style={{fontSize:9}}>{current.flag}</span>}
          {isLoading&&<span style={{ width:6,height:6,borderRadius:"50%",border:`1.5px solid ${C.accent}`,borderTopColor:"transparent",animation:"spin .7s linear infinite",display:"inline-block",flexShrink:0 }}/>}
          {isActive&&<span style={{ width:6,height:6,borderRadius:"50%",background:"#00e676",display:"inline-block",flexShrink:0,boxShadow:"0 0 4px #00e676" }}/>}
          {isError&&<span style={{ width:6,height:6,borderRadius:"50%",background:"#ff5252",display:"inline-block",flexShrink:0 }}/>}
        </button>

        {open&&(
          <div style={dropStyle}>
            {/* Header */}
            <div style={{ padding:"12px 16px 10px",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:.8,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
              <span>🌐 Subtitles / CC</span>
              {isLoading&&isOn&&<span style={{ fontSize:9,color:C.accent,fontWeight:600,background:`${C.accent}18`,padding:"2px 6px",borderRadius:4 }}>AI loading…</span>}
              {isActive&&isOn&&<span style={{ fontSize:9,color:"#00e676",fontWeight:600,background:"#00e67618",padding:"2px 6px",borderRadius:4 }}>● AI live</span>}
              {isError&&isOn&&<span style={{ fontSize:9,color:"#ff5252",fontWeight:600,background:"#ff525218",padding:"2px 6px",borderRadius:4 }}>⚠ Error</span>}
            </div>

            {/* Scrollable language list */}
            <div style={{ overflowY:"auto",flex:1,WebkitOverflowScrolling:"touch" }}>
              {CAPTION_LANGS.map(lang=>(
                <div key={lang.code} onClick={()=>handleSelect(lang)} style={{
                  padding:isMobile?"14px 18px":"10px 16px",cursor:"pointer",fontSize:isMobile?15:13,
                  display:"flex",alignItems:"center",gap:12,
                  color:selectedLang===lang.code?C.accent:C.text,
                  background:selectedLang===lang.code?`${C.accent}15`:"transparent",
                  fontWeight:selectedLang===lang.code?700:400,transition:"background .12s",
                  borderBottom:`1px solid ${C.border}22`,
                }}
                  onTouchStart={e=>e.currentTarget.style.background=`${C.accent}10`}
                  onTouchEnd={e=>e.currentTarget.style.background=selectedLang===lang.code?`${C.accent}15`:"transparent"}
                  onMouseEnter={e=>{ if(selectedLang!==lang.code)e.currentTarget.style.background=C.bg3; }}
                  onMouseLeave={e=>{ if(selectedLang!==lang.code)e.currentTarget.style.background="transparent"; }}
                >
                  <span style={{fontSize:isMobile?22:16,flexShrink:0}}>{lang.flag}</span>
                  <span style={{flex:1}}>{lang.label}</span>
                  {selectedLang===lang.code&&<span style={{color:C.accent,fontSize:16}}>✓</span>}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding:"10px 16px",fontSize:10,color:C.muted,borderTop:`1px solid ${C.border}`,textAlign:"center",flexShrink:0 }}>
              ⚡ Powered by Whisper AI
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Speed Menu — vertical scroll on mobile ─────────────────────────────────
function SpeedMenu({ speed, setSpeedTo, isMobile }) {
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  const SPEEDS=[0.25,0.5,0.75,1,1.25,1.5,1.75,2];

  useEffect(()=>{
    if(!open) return;
    const h=e=>{ if(ref.current&&!ref.current.contains(e.target))setOpen(false); };
    document.addEventListener("mousedown",h); document.addEventListener("touchstart",h);
    return()=>{ document.removeEventListener("mousedown",h); document.removeEventListener("touchstart",h); };
  },[open]);

  const dropStyle = isMobile ? {
    position:"fixed",bottom:0,left:0,right:0,
    background:C.bg2,borderRadius:"20px 20px 0 0",
    border:`1px solid ${C.border}`,zIndex:9999,
    maxHeight:"60vh",boxShadow:"0 -8px 32px rgba(0,0,0,.8)",overflowY: "auto",
    animation:"fadeUp .2s ease",overflow:"hidden",display:"flex",flexDirection:"column",
  } : {
    position:"absolute",bottom:"calc(100% + 8px)",right:0,
    background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,
    overflow:"hidden",zIndex:999,minWidth:110,
    boxShadow:"0 8px 30px rgba(0,0,0,.8)",animation:"fadeUp .18s ease",
  };

  return (
    <>
      {isMobile&&open&&<div onClick={()=>setOpen(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:9998 }}/>}
      <div ref={ref} style={{ position:"relative",flexShrink:0 }}>
        <button onClick={()=>setOpen(v=>!v)} style={{
          fontSize:11,background:speed!==1?`${C.accent}22`:"rgba(255,255,255,.16)",
          border:speed!==1?`1px solid var(--accent)55`:"1px solid transparent",
          borderRadius:6,cursor:"pointer",
          color:speed!==1?C.accent:"white",padding:"5px 9px",
          fontFamily:"inherit",fontWeight:800,transition:"all .15s",flexShrink:0,
        }}>{speed}×</button>
        {open&&(
          <div style={dropStyle}>
            <div style={{ padding:"10px 16px 8px",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:.8,borderBottom:`1px solid ${C.border}`,flexShrink:0 }}>
              ⚡ Playback Speed
            </div>
            <div style={{ overflowY:"auto",flex:1 }}>
              {SPEEDS.map(s=>(
                <div key={s} onClick={()=>{setSpeedTo(s);setOpen(false);}} style={{
                  padding:isMobile?"14px 18px":"9px 16px",cursor:"pointer",fontSize:isMobile?15:13,
                  color:speed===s?C.accent:C.text,
                  background:speed===s?`${C.accent}15`:"transparent",
                  fontWeight:speed===s?800:400,
                  display:"flex",alignItems:"center",gap:10,
                  transition:"background .1s",
                  borderBottom:`1px solid ${C.border}22`,
                }}
                  onMouseEnter={e=>{ if(speed!==s)e.currentTarget.style.background=C.bg3; }}
                  onMouseLeave={e=>{ if(speed!==s)e.currentTarget.style.background="transparent"; }}
                  onTouchStart={e=>e.currentTarget.style.background=`${C.accent}10`}
                  onTouchEnd={e=>e.currentTarget.style.background=speed===s?`${C.accent}15`:"transparent"}
                >
                  {speed===s&&<div style={{ width:4,height:18,borderRadius:2,background:C.accent,flexShrink:0 }}/>}
                  <span style={{flex:1}}>{s===1?"Normal":`${s}×`}</span>
                  {speed===s&&<span style={{color:C.accent,fontSize:16}}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ControlsBar
// ─────────────────────────────────────────────────────────────────────────────
export default function ControlsBar({
  playing,muted,vol,prog,dur,curTime,speed,isFS,isMobile,
  showCtrl,vRef,captionLang,onCaptionChange,
  togglePlay,seekBy,toggleFS,setSpeedTo,onMute,onVolume,
  buffered,isBuffering,captionStatus,
}) {
  const handleSeek=pct=>{ const v=vRef.current;if(v&&v.duration)v.currentTime=pct*v.duration; };

  return (
    <div onClick={e=>e.stopPropagation()} style={{
      position:"absolute",bottom:0,left:0,right:0,
      background:"linear-gradient(transparent,rgba(0,0,0,.92))",
      padding:isFS?"60px 20px 22px":isMobile?"38px 12px 14px":"52px 18px 16px",
      opacity:showCtrl?1:0,
      transform:showCtrl?"translateY(0)":"translateY(8px)",
      transition:"opacity .3s ease, transform .3s ease",
      pointerEvents:showCtrl?"auto":"none",zIndex:30,
    }}>

      {/* Seekbar */}
      <Seekbar prog={prog} dur={dur} buffered={buffered||0} onSeek={handleSeek}/>

      {/* Controls row */}
      <div style={{
        display:"flex",alignItems:"center",
        gap:isMobile?4:8,
        ...(isMobile?{overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",msOverflowStyle:"none",paddingBottom:2}:{}),
      }}>
        {/* Play/Pause */}
        <PBtn onClick={togglePlay} title="Space">{playing?"⏸":"▶"}</PBtn>

        {/* ±10s */}
        <PBtn onClick={()=>seekBy(-10)} title="←">
          <span style={{display:"flex",flexDirection:"column",alignItems:"center",lineHeight:1,gap:1}}>
            <span style={{fontSize:12}}>⟲</span><span style={{fontSize:6,opacity:.8}}>10</span>
          </span>
        </PBtn>
        <PBtn onClick={()=>seekBy(10)} title="→">
          <span style={{display:"flex",flexDirection:"column",alignItems:"center",lineHeight:1,gap:1}}>
            <span style={{fontSize:12}}>⟳</span><span style={{fontSize:6,opacity:.8}}>10</span>
          </span>
        </PBtn>

        {/* Mute */}
        <PBtn onClick={onMute}>{muted?"🔇":"🔊"}</PBtn>

        {/* Volume (desktop/fs only) */}
        {(!isMobile||isFS)&&(
          <input type="range" min={0} max={1} step={0.05} value={muted?0:vol}
            onChange={e=>onVolume(+e.target.value)}
            style={{ width:isFS?90:70,accentColor:"var(--accent)",cursor:"pointer",flexShrink:0 }}/>
        )}

        {/* Time */}
        <span style={{ fontSize:11,color:"rgba(255,255,255,.65)",whiteSpace:"nowrap",flexShrink:0 }}>
          {fmtTime(curTime)} / {fmtTime(dur)}
        </span>

        {/* Spacer */}
        <div style={{flex:1}}/>

        {/* Right-side controls */}
        <CaptionPicker
          selectedLang={captionLang||"off"}
          onSelect={onCaptionChange}
          videoEl={vRef.current}
          captionStatus={captionStatus}
          isMobile={isMobile}
        />

        <SpeedMenu speed={speed} setSpeedTo={setSpeedTo} isMobile={isMobile}/>

        {/* Fullscreen */}
        <PBtn onClick={toggleFS} title="F" active={isFS}>
          {isFS?"⊡":"⛶"}
        </PBtn>
      </div>
    </div>
  );
}
