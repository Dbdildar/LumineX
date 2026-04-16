import { useState, useRef, useEffect, useCallback } from "react";
import { C, Avatar, VipBadge, VerifiedBadge, fmtNum, timeAgo } from "./ui/index";
import { useApp } from "../context/AppContext";
import { useIsMobile, useVideoLike } from "../hooks/index";

// ── Stylish long-press / loading ring ─────────────────────────────────────────
function LongPressRing({ progress, show }) {
  if (!show) return null;
  const R = 36, CIRC = 2 * Math.PI * R;
  const dash = (progress / 100) * CIRC;
  return (
    <div style={{
      position:"absolute",inset:0,zIndex:12,
      display:"flex",alignItems:"center",justifyContent:"center",
      background:"rgba(0,0,0,.55)",backdropFilter:"blur(4px)",
    }}>
      <div style={{ position:"relative",width:90,height:90,display:"flex",alignItems:"center",justifyContent:"center" }}>
        {/* Outer glow ring */}
        <div style={{
          position:"absolute",inset:0,borderRadius:"50%",
          background:`radial-gradient(circle, ${C.accent}18 0%, transparent 70%)`,
          animation:"pulseRing 1.2s ease-in-out infinite",
        }}/>
        {/* SVG arc */}
        <svg width={90} height={90} style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
          {/* Track */}
          <circle cx={45} cy={45} r={R} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth={4}/>
          {/* Progress arc */}
          <circle cx={45} cy={45} r={R} fill="none"
            stroke="url(#lpGrad)" strokeWidth={4} strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRC}`}
            style={{transition:"stroke-dasharray .05s linear"}}/>
          <defs>
            <linearGradient id="lpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent)"/>
              <stop offset="100%" stopColor="var(--accent3,#f472b6)"/>
            </linearGradient>
          </defs>
        </svg>
        {/* Center icon */}
        <div style={{
          width:40,height:40,borderRadius:"50%",
          background:`linear-gradient(135deg,${C.accent},${C.accent2||"#818cf8"})`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:18,color:"white",zIndex:1,
          boxShadow:`0 0 20px ${C.accent}88`,
        }}>▶</div>
      </div>
      {/* Hint text */}
      <div style={{
        position:"absolute",bottom:10,left:0,right:0,textAlign:"center",
        fontSize:10,fontWeight:700,color:"rgba(255,255,255,.6)",letterSpacing:.5,
      }}>Hold to preview</div>
    </div>
  );
}

// ── Buffering overlay for card preview ───────────────────────────────────────
function CardBuffering({ show }) {
  if (!show) return null;
  return (
    <div style={{
      position:"absolute",inset:0,zIndex:11,pointerEvents:"none",
      display:"flex",alignItems:"center",justifyContent:"center",
    }}>
      <style>{`@keyframes cvSpin{to{stroke-dashoffset:-251}}`}</style>
      <svg width={44} height={44} style={{filter:`drop-shadow(0 0 8px ${C.accent})`}}>
        <circle cx={22} cy={22} r={18} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={3}/>
        <circle cx={22} cy={22} r={18} fill="none" stroke="var(--accent)" strokeWidth={3}
          strokeLinecap="round" strokeDasharray="30 113"
          style={{animation:"cvSpin .9s linear infinite",transformOrigin:"22px 22px"}}/>
      </svg>
    </div>
  );
}

export default function VideoCard({ video, cardWidth, compact, showChannel=true }) {
  const { playVideo } = useApp();
  const isMobile = useIsMobile();
  const vRef        = useRef(null);
  const timerRef    = useRef(null);   // hover delay (desktop)
  const lpTimerRef  = useRef(null);   // long-press timer (mobile)
  const tickRef     = useRef(null);   // progress tick
  const startTRef   = useRef(null);   // touch start time

  const [active,   setActive]   = useState(false);   // video playing
  const [hov,      setHov]      = useState(false);   // hover/lp active
  const [vidProg,  setVidProg]  = useState(0);       // 0-100 playback progress
  const [lpProg,   setLpProg]   = useState(0);       // 0-100 long-press ring
  const [lpOn,     setLpOn]     = useState(false);   // long-press ring visible
  const [buffering,setBuffering]= useState(false);   // video buffering

  const { liked, count: likeCount, toggle: toggleLike } = useVideoLike(video.id, false, video.likes_count);

  // ── Play preview ───────────────────────────────────────────────────────────
  const startPreview = useCallback(()=>{
    const v=vRef.current; if(!v) return;
    setBuffering(true);
    v.muted=true; v.volume=0; v.currentTime=0;
    v.play()
      .then(()=>{ setActive(true); setBuffering(false); })
      .catch(()=>{ setBuffering(false); });
  },[]);

  const stopPreview = useCallback(()=>{
    const v=vRef.current; if(!v) return;
    v.pause(); v.currentTime=0;
    setActive(false); setVidProg(0); setBuffering(false);
  },[]);

  // ── Desktop hover ─────────────────────────────────────────────────────────
  const onEnter = useCallback(()=>{
    if (isMobile) return;
    setHov(true);
    timerRef.current = setTimeout(startPreview, 400);
  },[isMobile,startPreview]);

  const onLeave = useCallback(()=>{
    if (isMobile) return;
    clearTimeout(timerRef.current);
    setHov(false); stopPreview();
  },[isMobile,stopPreview]);

  // ── Mobile touch ──────────────────────────────────────────────────────────
  const onTouchStart = useCallback(e=>{
    if (!isMobile) return;
    e.preventDefault();
    startTRef.current = Date.now();
    setLpOn(true); setLpProg(0);

    // Progress ring animation
    const t0 = Date.now();
    tickRef.current = setInterval(()=>{
      const pct = Math.min(((Date.now()-t0)/700)*100, 100);
      setLpProg(pct);
    },16);

    // After 700ms fire preview
    lpTimerRef.current = setTimeout(()=>{
      clearInterval(tickRef.current);
      setLpOn(false); setHov(true);
      startPreview();
    },700);
  },[isMobile,startPreview]);

  const onTouchEnd = useCallback(e=>{
    if (!isMobile) return;
    clearTimeout(lpTimerRef.current);
    clearInterval(tickRef.current);
    const held = Date.now() - (startTRef.current||0);
    setLpOn(false); setLpProg(0);

    if (active) {
      // Was previewing — stop and open player
      stopPreview(); setHov(false);
      playVideo(video);
    } else if (held < 600) {
      // Short tap — open player directly
      setHov(false); stopPreview();
      playVideo(video);
    } else {
      // Held but video didn't start — still open
      stopPreview(); setHov(false);
      playVideo(video);
    }
  },[isMobile,active,stopPreview,playVideo,video]);

  const onTouchMove = useCallback(()=>{
    // Cancel long-press on move/scroll
    clearTimeout(lpTimerRef.current);
    clearInterval(tickRef.current);
    setLpOn(false); setLpProg(0);
    if (!active) { setHov(false); stopPreview(); }
  },[active,stopPreview]);

  // ── Track playback progress ──────────────────────────────────────────────
  useEffect(()=>{
    const v=vRef.current; if(!v) return;
    const fn=()=>v.duration&&setVidProg((v.currentTime/v.duration)*100);
    v.addEventListener("timeupdate",fn);
    return()=>v.removeEventListener("timeupdate",fn);
  },[]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(()=>()=>{
    clearTimeout(timerRef.current); clearTimeout(lpTimerRef.current); clearInterval(tickRef.current);
  },[]);

  const pf = video.profiles||{ username:video.channel||"Unknown" };
  const isHovering = hov || active;

  return (
    <div
      onClick={!isMobile ? ()=>playVideo(video) : undefined}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
      style={{
        background:isHovering?C.cardH:C.card,
        borderRadius:14, overflow:"hidden", cursor:"pointer",
        border:`1px solid ${isHovering?"var(--accent)44":C.border}`,
        transform:isHovering?"translateY(-5px) scale(1.015)":"none",
        transition:"all .3s cubic-bezier(0.34,1.2,0.64,1)",
        boxShadow:isHovering?`0 20px 50px rgba(0,0,0,.5),0 0 40px var(--accent)12`:"0 2px 12px rgba(0,0,0,.2)",
        width:cardWidth||"100%",
        flexShrink:cardWidth?0:undefined,
        scrollSnapAlign:cardWidth?"start":undefined,
        position:"relative",
        WebkitTapHighlightColor:"transparent",
        userSelect:"none",
      }}
    >
      {/* ── Thumbnail + video layer ── */}
      <div style={{ position:"relative",aspectRatio:"16/9",overflow:"hidden",background:"#111" }}>

        {/* Thumbnail — always mounted, fades out when active */}
        <img
          src={video.thumbnail_url||`https://picsum.photos/640/360?random=${String(video.id).charCodeAt(0)||1}`}
          alt={video.title} loading="lazy"
          style={{
            position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
            transform:isHovering?"scale(1.07)":"scale(1)",
            transition:"transform .5s ease, opacity .4s ease",
            opacity:active?0:1, zIndex:1,
          }}
        />

        {/* Video preview element (mounted when hovering) */}
        {(hov||active||isHovering)&&(
          <video ref={vRef} src={video.video_url} muted playsInline loop
            onCanPlay={e=>{
              e.target.muted=true; e.target.volume=0;
              e.target.play().then(()=>{setActive(true);setBuffering(false);}).catch(()=>setBuffering(false));
            }}
            onWaiting={()=>setBuffering(true)}
            onPlaying={()=>setBuffering(false)}
            style={{
              position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
              zIndex:2,opacity:active?1:0,transition:"opacity .4s ease",
            }}
          />
        )}

        {/* Gradient overlay on hover */}
        <div style={{
          position:"absolute",inset:0,zIndex:3,pointerEvents:"none",
          background:"linear-gradient(to top,rgba(0,0,0,.72) 0%,transparent 55%)",
          opacity:isHovering?1:0,transition:"opacity .3s",
        }}/>

        {/* Desktop: play icon before video starts */}
        {!isMobile&&hov&&!active&&!buffering&&(
          <div style={{ position:"absolute",inset:0,zIndex:4,pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <div style={{
              width:52,height:52,borderRadius:"50%",
              background:`${C.accent}cc`,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:20,color:"white",
              boxShadow:`0 0 0 10px ${C.accent}28`,animation:"pulseRing 1.4s infinite",
            }}>▶</div>
          </div>
        )}

        {/* Mobile: long-press progress ring */}
        <LongPressRing progress={lpProg} show={lpOn}/>

        {/* Buffering spinner (card preview) */}
        <CardBuffering show={buffering&&isHovering}/>

        {/* Mobile: stop button when preview active */}
        {isMobile&&active&&(
          <button onClick={e=>{e.stopPropagation();stopPreview();setHov(false);}} style={{
            position:"absolute",top:8,right:8,zIndex:14,
            background:"rgba(0,0,0,.8)",border:"none",borderRadius:"50%",
            width:30,height:30,color:"white",fontSize:13,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>⏹</button>
        )}

        {/* VIP badge */}
        {video.is_vip&&(
          <div style={{ position:"absolute",top:8,left:8,zIndex:5 }}><VipBadge small/></div>
        )}

        {/* Duration */}
        {video.duration&&(
          <div style={{ position:"absolute",bottom:active?12:8,right:8,zIndex:5,background:"rgba(0,0,0,.85)",color:"white",fontSize:11,fontWeight:700,padding:"2px 6px",borderRadius:4,transition:"bottom .2s" }}>
            {video.duration}
          </div>
        )}

        {/* Like button (desktop hover) */}
        {!compact&&!isMobile&&(
          <button onClick={e=>{e.stopPropagation();toggleLike();}} style={{
            position:"absolute",top:8,right:8,zIndex:5,
            background:"rgba(0,0,0,.72)",border:"none",borderRadius:"50%",
            width:32,height:32,cursor:"pointer",fontSize:15,
            display:"flex",alignItems:"center",justifyContent:"center",
            opacity:isHovering||liked?1:0,transition:"opacity .2s, transform .2s",
            transform:liked?"scale(1.2)":"scale(1)",
          }}>{liked?"❤️":"🤍"}</button>
        )}

        {/* Playback progress bar */}
        <div style={{ position:"absolute",bottom:0,left:0,right:0,height:3,background:"rgba(255,255,255,.1)",zIndex:6,opacity:active?1:0,transition:"opacity .3s" }}>
          <div style={{ height:"100%",background:`linear-gradient(90deg,${C.accent},${C.accent2||"#818cf8"})`,width:`${vidProg}%`,transition:"width .1s linear" }}/>
        </div>
      </div>

      {/* ── Card body ── */}
      {!compact&&showChannel&&(
        <div style={{ padding:"10px 12px 12px" }}>
          <div style={{ display:"flex",gap:9,alignItems:"flex-start" }}>
            <Avatar profile={pf} size={32}/>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:13,fontWeight:600,color:C.text,lineHeight:1.4,marginBottom:3,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>
                {video.title}
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.muted }}>
                <span style={{ color:C.accent,fontWeight:600 }}>{pf.display_name||pf.username}</span>
                {pf.is_verified&&<VerifiedBadge size={11}/>}
              </div>
              <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>
                {fmtNum(video.views||0)} views · {timeAgo(video.created_at)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
