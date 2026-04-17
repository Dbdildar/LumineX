import { useState, useEffect, useRef, useCallback } from "react";
import { C, Avatar, VipBadge, VerifiedBadge, fmtNum, fmtTime, timeAgo, AppIcon } from "../ui/index";
import { useApp } from "../../context/AppContext";
import { useIsMobile, useVideoLike } from "../../hooks/index";
import { videoAPI, likeAPI } from "../../lib/supabase";
import { DEMO_VIDEOS } from "../../data/theme";
import CommentSection from "./CommentSection";
import ControlsBar from "./ControlsBar";

// ─────────────────────────────────────────────────────────────────────────────
// AD STRATEGY TABLE
// ─────────────────────────────────────────────────────────────────────────────
const AD_STRATEGY = {
  1:{pre:5,post:0,label:"Low Friction Start"},2:{pre:0,post:5,label:"Trust Build & Bank"},
  3:{pre:10,post:0,label:"Committed User"},4:{pre:0,post:10,label:"Pure Breather"},
  5:{pre:15,post:5,label:"Money Peak"},6:{pre:0,post:10,label:"Recovery Phase"},
  7:{pre:6,post:0,label:"Guaranteed Revenue"},8:{pre:0,post:5,label:"Browse-Time Ad"},
  9:{pre:10,post:0,label:"Final Wave Push"},10:{pre:5,post:30,label:"Premium Milestone"},
  11:{pre:5,post:0,label:"PM2"},12:{pre:0,post:30,label:"PM3"},
  13:{pre:6,post:0,label:"Quick Tap"},14:{pre:6,post:0,label:"Quick Tap"},
  15:{pre:6,post:0,label:"Quick Tap"},16:{pre:6,post:0,label:"Quick Tap"},
  17:{pre:6,post:0,label:"Fast CPM Spike"},19:{pre:5,post:0,label:"Final Stretch"},
  20:{pre:0,post:30,label:"The Big Check"},
};

const getStrategy = (count, videoId = "") => {
  const s = AD_STRATEGY[count];
  if (s) return { pre: s.pre || 0, post: s.post || 0, label: s.label || "Standard" };
  const isBumper = count > 20 && (count % 3 === 0 || videoId.length % 2 === 0);
  return isBumper ? { pre: 6, post: 0, label: "Power Bumper" } : { pre: 0, post: 0, label: "Organic" };
};

const UNSKIPPABLE = new Set([5, 6, 10, 30]);

const DUMMY_ADS = [
  {id:1,brand:"NovaDrive",tagline:"The Future, Delivered.",cta:"Learn More →",description:"Experience the all-new NovaDrive EV. Zero emissions, infinite possibilities.",badge:"⚡ Electric",bg:"linear-gradient(135deg,#0f0c29,#302b63,#24243e)",accent:"#7c6bfa",logo:"🚗",category:"Automotive",url:"#"},
  {id:2,brand:"PureBlend Coffee",tagline:"Taste the Altitude.",cta:"Shop Now →",description:"Single-origin beans from 2,000m above sea level.",badge:"☕ Premium",bg:"linear-gradient(135deg,#3b1f0a,#7b4f2e,#3b1f0a)",accent:"#e8a96b",logo:"☕",category:"Food & Drink",url:"#"},
  {id:3,brand:"ArcFit Pro",tagline:"Train Smarter. Live Longer.",cta:"Get Free Trial →",description:"AI-powered workout plans that adapt to YOU. 500K+ athletes inside.",badge:"💪 Health",bg:"linear-gradient(135deg,#001a12,#00412c,#001a12)",accent:"#00e676",logo:"🏋️",category:"Health",url:"#"},
  {id:4,brand:"Stellarware",tagline:"Your App, Supercharged.",cta:"Start for Free →",description:"All-in-one productivity suite trusted by 2M+ teams.",badge:"🚀 SaaS",bg:"linear-gradient(135deg,#020024,#090979,#00d4ff22)",accent:"#00d4ff",logo:"🌐",category:"Technology",url:"#"},
  {id:5,brand:"TerraScents",tagline:"Wear the Earth.",cta:"Explore Collection →",description:"Sustainable luxury fragrances from ethically sourced botanicals.",badge:"🌿 Eco",bg:"linear-gradient(135deg,#1a2a1a,#2d5016,#1a2a1a)",accent:"#a8e063",logo:"🌿",category:"Beauty",url:"#"},
];
const getAdForSession = n => DUMMY_ADS[(n - 1) % DUMMY_ADS.length];

const SIDEBAR_ADS = [
  {id:"s1",brand:"CloudVault",tagline:"Store everything. Access anywhere.",description:"1TB free for new users. Military-grade encryption.",accent:"#4fc3f7",bg:"linear-gradient(135deg,#0d1b2a,#1b3a5c)",logo:"☁️",cta:"Try Free"},
  {id:"s2",brand:"PixelForge",tagline:"Design without limits.",description:"The professional creative suite. Now on every device.",accent:"#ff6b9d",bg:"linear-gradient(135deg,#1a0a1a,#4a1942)",logo:"🎨",cta:"Start Creating"},
  {id:"s3",brand:"SwiftLearn",tagline:"Skills that pay bills.",description:"5,000+ expert-led courses. Learn at your pace.",accent:"#ffb347",bg:"linear-gradient(135deg,#1a1000,#3d2800)",logo:"📚",cta:"Browse Courses"},
  {id:"s4",brand:"NexaBank",tagline:"Banking. Reimagined.",description:"Zero fees. Instant transfers. 4.5% APY savings.",accent:"#69f0ae",bg:"linear-gradient(135deg,#001a0d,#003320)",logo:"🏦",cta:"Open Account"},
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function buildVideoState(v) {
  try {
    const cached = sessionStorage.getItem(`video_${v.id}`);
    const initViews = Number(v.views_count ?? v.views ?? 0);
    if (cached) {
      const p = JSON.parse(cached);
      return { ...v, ...p, views: Math.max(Number(p.views_count ?? p.views ?? 0), initViews) };
    }
    return { ...v, views: initViews };
  } catch { return { ...v, views: Number(v.views_count ?? v.views ?? 0) }; }
}

// ─────────────────────────────────────────────────────────────────────────────
// SEEK FLASH (arc ring + ripple)
// ─────────────────────────────────────────────────────────────────────────────
function SeekFlash({ seekFlash, arcProg }) {
  if (!seekFlash) return null;
  const C2 = 188.5, arc = Math.min((arcProg / 100) * C2, C2);
  const Panel = ({ side, active, icon, label }) => (
    <div style={{
      position: "absolute", [side]: 0, top: 0, bottom: 0, width: "38%",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: active
        ? `radial-gradient(ellipse at ${side === "left" ? "30%" : "70%"} 50%, rgba(255,255,255,.18) 0%, transparent 70%)`
        : "transparent",
      transition: "background .15s", pointerEvents: "none",
    }}>
      {active && (
        <div style={{ position: "relative", width: 76, height: 76 }}>
          <svg width={76} height={76} style={{ transform: `rotate(-90deg)${side === "right" ? " scaleX(-1)" : ""}` }}>
            <circle cx={38} cy={38} r={32} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth={4} />
            <circle cx={38} cy={38} r={32} fill="none" stroke="white" strokeWidth={4}
              strokeLinecap="round" strokeDasharray={`${arc * (32 / 30)} ${C2 * (32 / 30)}`}
              style={{ transition: "stroke-dasharray .25s ease" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: "white", letterSpacing: .5 }}>{label}</span>
          </div>
        </div>
      )}
    </div>
  );
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 20, animation: "fadeIn .1s" }}>
      <Panel side="left"  active={seekFlash === "bwd"} icon="⏪" label="-10s" />
      <Panel side="right" active={seekFlash === "fwd"} icon="⏩" label="+10s" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BUFFERING OVERLAY — only shown after a meaningful delay to avoid flash
// ─────────────────────────────────────────────────────────────────────────────
function BufferingOverlay({ show }) {
  // Delay rendering the spinner by 400ms so quick loads don't flash it
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!show) { setVisible(false); return; }
    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, [show]);

  if (!visible) return null;
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 15, pointerEvents: "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,.35)", backdropFilter: "blur(2px)",
    }}>
      <style>{`
        @keyframes lxSpinRing { to { stroke-dashoffset: -251.2; } }
        @keyframes lxPulseGlow { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
      `}</style>
      <div style={{ position: "relative", width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg style={{ position: "absolute", inset: 0 }} width={72} height={72} viewBox="0 0 72 72">
          <circle cx={36} cy={36} r={32} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={4} />
        </svg>
        <svg style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} width={72} height={72} viewBox="0 0 72 72">
          <circle cx={36} cy={36} r={32} fill="none"
            stroke="url(#lxGrad)" strokeWidth={4} strokeLinecap="round"
            strokeDasharray="60 140"
            style={{ animation: "lxSpinRing .9s linear infinite", transformOrigin: "36px 36px" }} />
          <defs>
            <linearGradient id="lxGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--accent2,#818cf8)" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{
          width: 14, height: 14, borderRadius: "50%",
          background: `linear-gradient(135deg,var(--accent),var(--accent2,#818cf8))`,
          boxShadow: `0 0 20px var(--accent)`,
          animation: "lxPulseGlow 1.2s ease-in-out infinite",
        }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-PLAY COUNTDOWN
// ─────────────────────────────────────────────────────────────────────────────
function AutoPlayCountdown({ seconds, onPlay, onCancel }) {
  return (
    <div style={{
      position: "absolute", bottom: 80, right: 16, zIndex: 30,
      background: "rgba(0,0,0,.88)", backdropFilter: "blur(12px)",
      border: `1px solid ${C.accent}44`, borderRadius: 14, padding: "12px 16px",
      display: "flex", alignItems: "center", gap: 12, animation: "fadeIn .3s ease",
    }}>
      <div style={{ position: "relative", width: 40, height: 40 }}>
        <svg width={40} height={40} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={20} cy={20} r={16} fill="none" stroke={C.border} strokeWidth={3} />
          <circle cx={20} cy={20} r={16} fill="none" stroke={C.accent} strokeWidth={3}
            strokeLinecap="round" strokeDasharray={`${(seconds / 5) * 100.53} 100.53`}
            style={{ transition: "stroke-dasharray 1s linear" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: C.accent }}>{seconds}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Up Next</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Auto-playing…</div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onPlay} style={{ background: C.accent, border: "none", borderRadius: 8, color: "white", padding: "5px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Play Now</button>
        <button onClick={onCancel} style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AD OVERLAY
// ─────────────────────────────────────────────────────────────────────────────
function AdOverlay({ adData, adTime, adTotalDuration, canSkip, isMobile, onSkip }) {
  const progress = adTotalDuration > 0 ? adTime / adTotalDuration : 0;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 100, background: adData.bg, display: "flex", flexDirection: "column", overflow: "hidden", animation: "fadeIn .25s ease" }}>
      <div style={{ position: "absolute", width: "120%", height: "120%", top: "-10%", left: "-10%", background: `radial-gradient(ellipse at 60% 40%,${adData.accent}28 0%,transparent 65%)`, pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "10px 12px" : "14px 20px", borderBottom: `1px solid ${adData.accent}22`, position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: isMobile ? 26 : 36, height: isMobile ? 26 : 36, borderRadius: 8, background: `${adData.accent}22`, border: `1px solid ${adData.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 13 : 18 }}>{adData.logo}</div>
          <div>
            <div style={{ fontSize: isMobile ? 11 : 14, fontWeight: 800, color: "#fff" }}>{adData.brand}</div>
            {!isMobile && <div style={{ fontSize: 9, color: adData.accent, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{adData.category}</div>}
          </div>
        </div>
        <div style={{ padding: "3px 10px", borderRadius: 20, background: `${adData.accent}22`, border: `1px solid ${adData.accent}44`, fontSize: 10, fontWeight: 800, color: adData.accent, textTransform: "uppercase" }}>Ad</div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "10px 20px" : "24px 40px", position: "relative", zIndex: 2, textAlign: "center", gap: isMobile ? 8 : 16, minHeight: 0 }}>
        <div style={{ width: isMobile ? 56 : 88, height: isMobile ? 56 : 88, borderRadius: 20, background: `${adData.accent}18`, border: `2px solid ${adData.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 26 : 44, boxShadow: `0 0 40px ${adData.accent}33` }}>{adData.logo}</div>
        <h2 style={{ fontSize: isMobile ? 18 : 28, fontWeight: 900, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>{adData.tagline}</h2>
        <p style={{ fontSize: isMobile ? 11 : 13, color: "rgba(255,255,255,.7)", lineHeight: 1.5, margin: 0, maxWidth: 320 }}>{adData.description}</p>
        <button style={{ marginTop: 4, padding: isMobile ? "8px 20px" : "12px 32px", borderRadius: 10, background: adData.accent, border: "none", color: "#fff", fontSize: isMobile ? 12 : 14, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}>{adData.cta}</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", padding: isMobile ? "10px 16px" : "14px 20px", borderTop: `1px solid ${adData.accent}22`, position: "relative", zIndex: 2, gap: 12, background: isMobile ? "rgba(0,0,0,.4)" : "transparent" }}>
        <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
          <svg width={40} height={40} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={20} cy={20} r={18} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={3} />
            <circle cx={20} cy={20} r={18} fill="none" stroke={adData.accent} strokeWidth={3} strokeLinecap="round"
              strokeDasharray={`${(2 * Math.PI * 18) * (1 - progress)} ${2 * Math.PI * 18}`}
              style={{ transition: "stroke-dasharray .3s linear" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>{Math.ceil(adTime)}</div>
        </div>
        <button
          disabled={!canSkip}
          onClick={onSkip}
          style={{
            padding: isMobile ? "7px 16px" : "9px 22px", fontSize: isMobile ? 11 : 13,
            background: canSkip ? "#fff" : "rgba(255,255,255,.25)", color: "#0a0a0a",
            border: "none", borderRadius: 8, fontWeight: 800, cursor: canSkip ? "pointer" : "default",
            transition: "all .2s", whiteSpace: "nowrap", fontFamily: "inherit",
          }}
        >
          {canSkip ? "Skip Ad ›" : `End in ${Math.ceil(adTime)}s`}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR AD
// ─────────────────────────────────────────────────────────────────────────────
function SidebarAdWidget({ ad }) {
  if (!ad) return null;
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${ad.accent}33`, marginBottom: 20, animation: "fadeIn .4s ease", position: "relative" }}>
      <div style={{ position: "absolute", top: 8, right: 10, fontSize: 9, color: "rgba(255,255,255,.4)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", zIndex: 2 }}>Sponsored</div>
      <div style={{ background: ad.bg, padding: "18px 16px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${ad.accent}22`, border: `1px solid ${ad.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{ad.logo}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{ad.brand}</div>
            <div style={{ fontSize: 10, color: ad.accent, fontWeight: 600 }}>{ad.tagline}</div>
          </div>
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,.65)", lineHeight: 1.5, margin: 0 }}>{ad.description}</p>
        <button style={{ marginTop: 4, padding: "8px 0", width: "100%", background: `linear-gradient(90deg,${ad.accent},${ad.accent}bb)`, border: "none", borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: .5, fontFamily: "inherit" }}>{ad.cta}</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PLAYER MODAL
// ─────────────────────────────────────────────────────────────────────────────
export default function PlayerModal({ video: initVideo, onClose }) {
  const { session, profile, setAuthModal, showToast, setActiveProfile, setTab, incrementView } = useApp();
  const isMobile   = useIsMobile();
  const wrapRef    = useRef(null);
  const vRef       = useRef(null);
  const ctrlTimer  = useRef(null);
  const flashTimer = useRef(null);
  const autoTimer  = useRef(null);
  const adTimerRef = useRef(null);
  const lpTimerRef = useRef(null);
  const tapTimerRef= useRef(null);
  const lastTap    = useRef({ time: 0, x: 0 });
  const viewGuard  = useRef(false);
  // Track whether the video src has been set for the current video id
  // to avoid re-triggering the play effect on unrelated state changes
  const currentVideoId = useRef(null);

  const [video,         setVideo]         = useState(() => buildVideoState(initVideo));
  const [related,       setRelated]       = useState([]);
  const [playing,       setPlaying]       = useState(false);
  const [muted,         setMuted]         = useState(false);
  const [vol,           setVol]           = useState(1);
  const [prog,          setProg]          = useState(0);
  const [curTime,       setCurTime]       = useState(0);
  const [dur,           setDur]           = useState(0);
  const [showCtrl,      setShowCtrl]      = useState(true);
  const [speed,         setSpeed]         = useState(1);
  const [is3x,          setIs3x]          = useState(false);
  const [seekFlash,     setSeekFlash]     = useState(null);
  const [arcProg,       setArcProg]       = useState(0);
  const [isFS,          setIsFS]          = useState(false);
  const [captionLang,   setCaptionLang]   = useState("off");
  const [saved,         setSaved]         = useState(false);
  const [autoCountdown, setAutoCountdown] = useState(null);
  // ── FIX: start buffering as false; only set true on actual 'waiting' event ──
  const [isBuffering,   setIsBuffering]   = useState(false);
  const [buffered,      setBuffered]      = useState(0);
  const [descExpanded,  setDescExpanded]  = useState(false);
  const [displayLimit,  setDisplayLimit]  = useState(4);
  // Track any open dropdown/sheet to prevent controls from hiding
  const [isMenuOpen,    setIsMenuOpen]    = useState(false);

  // Ad state
  const [sessionCount, setSessionCount] = useState(() => parseInt(sessionStorage.getItem("lx_vcount") || "1"));
  const [adActive,     setAdActive]     = useState(false);
  const [adTime,       setAdTime]       = useState(0);
  const [adTotalDur,   setAdTotalDur]   = useState(0);
  const [canSkip,      setCanSkip]      = useState(false);
  const [adPart,       setAdPart]       = useState(null);
  const [adData,       setAdData]       = useState(null);
  const [dlPending,    setDlPending]    = useState(false);
  const [sidebarAd,    setSidebarAd]    = useState(() => SIDEBAR_ADS[0]);

  const { liked, count: likeCount, toggle: toggleLike } = useVideoLike(video.id, false, video.likes_count);

  // Rotate sidebar ad
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % SIDEBAR_ADS.length; setSidebarAd(SIDEBAR_ADS[i]); }, 30000);
    return () => clearInterval(t);
  }, []);

  const handleProfileClick = (e) => {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  
  // Use the profiles object from the video data
  const profileData = video?.profiles;
  const identifier = profileData?.username || video?.channel;
  
  if (!identifier) return;

  // 1. Pause the video so it doesn't play in the background
  if (vRef.current) vRef.current.pause();
  window.dispatchEvent(new CustomEvent("lx_pause_video"));
  
  // 2. Close the current modal (if required by your logic)
  onClose(); 

  // 3. Navigate
  window.scrollTo(0, 0);
  setTimeout(() => {
    if (profileData) setActiveProfile(profileData);
    setTab(`profile:${identifier}`);
  }, 50);
};

  // ADD THIS EFFECT to listen for the pause event
  useEffect(() => {
    const handlePause = () => { if (vRef.current) vRef.current.pause(); };
    window.addEventListener("lx_pause_video", handlePause);
    return () => window.removeEventListener("lx_pause_video", handlePause);
  }, []);

  
  
  // Reset on video change
  useEffect(() => {
    viewGuard.current = false;
    setVideo(buildVideoState(initVideo));
  }, [initVideo.id]); // eslint-disable-line

  // ── startAd ────────────────────────────────────────────────────────────────
  const startAd = useCallback((duration, type, idx) => {
    if (duration <= 0) return;
    if (adTimerRef.current) clearInterval(adTimerRef.current);
    const unskippable = UNSKIPPABLE.has(duration);
    const wait = unskippable ? duration : 5;
    setAdTotalDur(duration); setAdActive(true); setAdTime(duration);
    setCanSkip(false); setAdPart(type);
    setAdData(idx !== undefined ? DUMMY_ADS[idx % DUMMY_ADS.length] : getAdForSession(1));
    setPlaying(false);
    if (vRef.current) { vRef.current.pause(); }
    let elapsed = 0;
    adTimerRef.current = setInterval(() => {
      elapsed++;
      if (!unskippable && elapsed >= wait) setCanSkip(true);
      setAdTime(prev => {
        const n = prev - 1;
        if (n <= 0) {
          clearInterval(adTimerRef.current);
          adTimerRef.current = null;
          if (unskippable) setCanSkip(true);
          return 0;
        }
        return n;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (adTimerRef.current) clearInterval(adTimerRef.current); }, []);

  // Add this after your existing useEffects (approx. line 310)
useEffect(() => {
    const timer = setTimeout(async () => {
        // Guard: ID exists, not already incremented in this session, video playing, and no ad overlay
        if (video?.id && !viewGuard.current && playing && !adActive) {
            viewGuard.current = true; // Mark as done for this video instance
            try {
                // This calls the database RPC via your AppContext
                await incrementView(video.id);
            } catch (err) {
                console.error("Failed to increment view:", err);
                viewGuard.current = false; // Reset if the network call failed
            }
        }
    }, 5000); // 5000ms (5 seconds) watch threshold
    return () => clearTimeout(timer);
}, [playing, video?.id, adActive, incrementView]);

  // Add this right after the previous block
useEffect(() => {
    const handler = (e) => {
        if (e.detail.videoId === video.id) {
            const newViews = e.detail.views;

            // 1. Update the current component UI state
            setVideo(prev => ({ ...prev, views: newViews }));

            // 2. Sync with sessionStorage so refresh doesn't revert the number
            const cached = sessionStorage.getItem(`video_${video.id}`);
            let updatedData = { views: newViews };
            if (cached) {
                updatedData = { ...JSON.parse(cached), views: newViews };
            }
            sessionStorage.setItem(`video_${video.id}`, JSON.stringify(updatedData));
        }
    };
    window.addEventListener("video_view_updated", handler);
    return () => window.removeEventListener("video_view_updated", handler);
}, [video.id]);

  // ── executeDownload ─────────────────────────────────────────────────────────
  const executeDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = video.video_url;
    a.download = (video.title || "video") + ".mp4";
    a.target = "_blank";
    document.body.appendChild(a); a.click(); document.body.removeChid(a);
    showToast("Download started!", "success");
  }, [video, showToast]);

  // ── skipAd ─────────────────────────────────────────────────────────────────
  const skipAd = useCallback(() => {
    if (adTimerRef.current) { clearInterval(adTimerRef.current); adTimerRef.current = null; }
    setAdActive(false); setAdTime(0); setCanSkip(false); setAdData(null);
    if (adPart === "pre") {
      const v = vRef.current;
      if (v) { v.play().then(() => setPlaying(true)).catch(() => {}); }
    } else if (adPart === "post") {
      if (dlPending) { executeDownload(); setDlPending(false); }
      else {
        const next = related[0];
        if (next) { setVideo(buildVideoState(next)); setProg(0); setCurTime(0); setDur(0); }
      }
    }
  }, [adPart, dlPending, executeDownload, related]);

  // Auto-skip on adTime=0 && canSkip
  useEffect(() => {
    if (adActive && canSkip && adTime === 0) {
      const t = setTimeout(() => { if (adActive && canSkip) skipAd(); }, 500);
      return () => clearTimeout(t);
    }
  }, [adActive, canSkip, adTime, skipAd]);

  // ── Pre-roll decision on video change ──────────────────────────────────────
  useEffect(() => {
    const strat = getStrategy(sessionCount, video.id);
    if (!adActive) {
      if (strat.pre > 0) startAd(strat.pre, "pre", sessionCount);
      else {
        setAdActive(false); setAdTime(0); setCanSkip(false);
        if (adTimerRef.current) { clearInterval(adTimerRef.current); adTimerRef.current = null; }
      }
      const n = sessionCount + 1;
      setSessionCount(n);
      sessionStorage.setItem("lx_vcount", n.toString());
    }
  }, [video.id]); // eslint-disable-line

  // ── cancelAuto / playNext ───────────────────────────────────────────────────
  const cancelAuto = useCallback(() => { clearInterval(autoTimer.current); setAutoCountdown(null); }, []);
  const playNext   = useCallback(() => {
    cancelAuto();
    const next = related[0];
    if (next) { setVideo(buildVideoState(next)); setProg(0); setCurTime(0); setDur(0); }
  }, [related, cancelAuto]);

  const startAutoCountdown = useCallback(() => {
    if (!related.length) return;
    setAutoCountdown(5); let count = 5;
    autoTimer.current = setInterval(() => {
      count--; setAutoCountdown(count);
      if (count <= 0) {
        clearInterval(autoTimer.current); setAutoCountdown(null);
        const n = related[0];
        if (n) { setVideo(buildVideoState(n)); setProg(0); setCurTime(0); setDur(0); }
      }
    }, 1000);
  }, [related]);

  // ── Load related ────────────────────────────────────────────────────────────
  useEffect(() => {
    setDisplayLimit(4);
    setRelated(DEMO_VIDEOS.filter(v => v.id !== video.id));
    videoAPI.getFeed({ limit: 100 }).then(data => {
      if (data?.length) setRelated(data.filter(v => v.id !== video.id));
    }).catch(() => {});
  }, [video.id]);

  // ── Video element events ────────────────────────────────────────────────────
  // FIX: Completely rewritten to avoid the buffering-forever bug.
  // Key changes:
  //   1. Do NOT set isBuffering=true on mount — let the browser decide
  //   2. Do NOT call vRef.current.currentTime=0 before playing (causes seek loop)
  //   3. Do NOT reset currentTime in onTimeUpdate while adActive (causes perpetual waiting)
  //   4. Only set isBuffering=true on the 'waiting' event (actual stall)
  //   5. Clear isBuffering on 'playing', 'canplay', 'seeked'
  useEffect(() => {
    const v = vRef.current;
    if (!v) return;

    // Only reset playback state when the video source actually changes
    if (currentVideoId.current !== video.id) {
      currentVideoId.current = video.id;
      setProg(0); setCurTime(0); setDur(0);
      setBuffered(0);
      // Don't pre-set buffering — the browser will fire 'waiting' if needed
      setIsBuffering(false);
    }

    // FIX: If an ad is active, just pause the video element quietly.
    // Do NOT touch currentTime — that was causing the seek→waiting loop.
    if (adActive) {
      v.pause();
      setPlaying(false);
      return;
    }

    // Attempt autoplay as soon as there's enough data
    // Use 'canplay' event if not yet ready, else play immediately
    const tryAutoPlay = () => {
      if (!vRef.current || adActive) return;
      vRef.current.play()
        .then(() => { setPlaying(true); setIsBuffering(false); })
        .catch(() => {
          // Autoplay blocked (common on mobile without user gesture) — show play button
          setPlaying(false);
          setIsBuffering(false);
        });
    };

    if (v.readyState >= 3) {
      // HAVE_FUTURE_DATA or better — play immediately, no spinner needed
      tryAutoPlay();
    } else if (v.readyState >= 1) {
      // Has metadata but not enough data — show spinner, wait for canplay
      setIsBuffering(true);
      v.addEventListener("canplay", tryAutoPlay, { once: true });
    } else {
      // No data yet — listen for canplay
      v.addEventListener("canplay", tryAutoPlay, { once: true });
    }

    // ── Event handlers ──────────────────────────────────────────────────────
    const onLoadedMeta = () => { setDur(v.duration || 0); };
    const onTimeUpdate = () => {
      // FIX: Never manipulate currentTime here — just read it
      setCurTime(v.currentTime);
      setDur(v.duration || 0);
      setProg(v.duration ? (v.currentTime / v.duration) * 100 : 0);
    };
    // FIX: Only flag buffering on actual stall, not on seek start
    const onWaiting  = () => { setIsBuffering(true); };
    const onPlaying  = () => { setIsBuffering(false); setPlaying(true); };
    const onPause    = () => { setPlaying(false); };
    const onCanPlay  = () => { setIsBuffering(false); };
    const onSeeked   = () => { setIsBuffering(false); };
    const onProgress = () => {
      if (v.buffered.length && v.duration) {
        setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
      }
    };
    const onEnded = () => {
      const strat = getStrategy(sessionCount - 1, video.id);
      if (strat.post > 0) startAd(strat.post, "post", sessionCount);
      else startAutoCountdown();
    };

    v.addEventListener("loadedmetadata", onLoadedMeta);
    v.addEventListener("timeupdate",     onTimeUpdate);
    v.addEventListener("waiting",        onWaiting);
    v.addEventListener("playing",        onPlaying);
    v.addEventListener("pause",          onPause);
    v.addEventListener("canplay",        onCanPlay);
    v.addEventListener("seeked",         onSeeked);
    v.addEventListener("progress",       onProgress);
    v.addEventListener("ended",          onEnded);

    return () => {
      v.removeEventListener("loadedmetadata", onLoadedMeta);
      v.removeEventListener("timeupdate",     onTimeUpdate);
      v.removeEventListener("waiting",        onWaiting);
      v.removeEventListener("playing",        onPlaying);
      v.removeEventListener("pause",          onPause);
      v.removeEventListener("canplay",        onCanPlay);
      v.removeEventListener("seeked",         onSeeked);
      v.removeEventListener("progress",       onProgress);
      v.removeEventListener("ended",          onEnded);
      v.removeEventListener("canplay",        tryAutoPlay);
    };
  }, [video.id, video.video_url, adActive]); // eslint-disable-line

  // ── Misc effects ────────────────────────────────────────────────────────────
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  useEffect(() => { if (!session) return; likeAPI.isSaved(session.user.id, video.id).then(setSaved); }, [session, video.id]);
  useEffect(() => {
    const fn = () => setIsFS(!!(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", fn);
    document.addEventListener("webkitfullscreenchange", fn);
    return () => {
      document.removeEventListener("fullscreenchange", fn);
      document.removeEventListener("webkitfullscreenchange", fn);
    };
  }, []);

  // ── Controls visibility ─────────────────────────────────────────────────────
  // FIX: Never hide controls when a menu is open
  const revealCtrl = useCallback(() => {
    setShowCtrl(true);
    clearTimeout(ctrlTimer.current);
    if (!isMenuOpen) {
      ctrlTimer.current = setTimeout(() => setShowCtrl(false), 3500);
    }
  }, [isMenuOpen]);

  // When menu opens, cancel any pending hide timer and keep controls visible
  // When menu closes, restart the hide timer
  const handleMenuToggle = useCallback((isOpen) => {
    setIsMenuOpen(isOpen);
    if (isOpen) {
      clearTimeout(ctrlTimer.current);
      setShowCtrl(true);
    } else {
      // Short delay before restarting auto-hide after menu close
      ctrlTimer.current = setTimeout(() => setShowCtrl(false), 4000);
    }
  }, []);

  const togglePlay = useCallback(() => {
    const v = vRef.current;
    if (!v || adActive) return;
    if (v.paused) {
      v.play().then(() => setPlaying(true)).catch(() => {});
      revealCtrl();
    } else {
      v.pause();
      setPlaying(false);
      setShowCtrl(true);
      clearTimeout(ctrlTimer.current);
    }
  }, [revealCtrl, adActive]);

  const seekBy = useCallback(secs => {
    const v = vRef.current;
    if (!v || adActive) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + secs));
    const pct = v.duration ? Math.min((Math.abs(secs) / v.duration) * 100 * 6, 100) : 40;
    clearTimeout(flashTimer.current);
    setArcProg(0); setSeekFlash(secs > 0 ? "fwd" : "bwd");
    requestAnimationFrame(() => requestAnimationFrame(() => setArcProg(pct)));
    flashTimer.current = setTimeout(() => { setSeekFlash(null); setArcProg(0); }, 800);
    revealCtrl();
  }, [revealCtrl, adActive]);

  // ── iOS/Safari/Chrome fullscreen ────────────────────────────────────────────
  const enterFS = useCallback(() => {
    const el = wrapRef.current; const v = vRef.current;
    if (!el) return;
    try { if (window.screen?.orientation?.lock) window.screen.orientation.lock("landscape").catch(() => {}); } catch (e) {}
    if (v?.webkitEnterFullscreen) { try { v.webkitEnterFullscreen(); return; } catch (e) {} }
    if (v?.webkitRequestFullScreen) { try { v.webkitRequestFullScreen(); return; } catch (e) {} }
    const req = el.requestFullscreen || el.mozRequestFullScreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (req) req.call(el).catch(() => {});
  }, []);

  const exitFS = useCallback(() => {
    try { if (window.screen?.orientation?.unlock) window.screen.orientation.unlock(); } catch (e) {}
    const ex = document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (ex) ex.call(document).catch(() => {});
  }, []);

  const toggleFS = useCallback(() => { if (isFS) exitFS(); else enterFS(); revealCtrl(); }, [isFS, enterFS, exitFS, revealCtrl]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const h = e => {
      if (e.key === "Escape") { if (isFS) exitFS(); else onClose(); return; }
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      if (e.key === "ArrowRight") seekBy(10);
      if (e.key === "ArrowLeft")  seekBy(-10);
      if (e.key === "f" || e.key === "F") toggleFS();
      if (e.key === "n" || e.key === "N") playNext();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  // ── Mobile touch handler ────────────────────────────────────────────────────
  const touchStartRef = useRef({ x: 0, y: 0, t: 0 });

  const handleTouchStart = useCallback(e => {
    if (adActive) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
    clearTimeout(lpTimerRef.current);
    lpTimerRef.current = setTimeout(() => {
      const v = vRef.current;
      if (!v || v.paused) return;
      v.playbackRate = 3; setSpeed(3); setIs3x(true);
      setSeekFlash("3x"); clearTimeout(flashTimer.current);
    }, 600);
  }, [adActive]);

  const handleTouchEnd = useCallback(e => {
    clearTimeout(lpTimerRef.current);
    if (is3x) {
      const v = vRef.current;
      if (v) { v.playbackRate = 1; setSpeed(1); }
      setIs3x(false); setSeekFlash(null); setArcProg(0);
      return;
    }
    if (adActive) return;

    const rect  = e.currentTarget.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const x     = touch.clientX - rect.left;
    const third = rect.width / 3;
    const dx    = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy    = Math.abs(touch.clientY - touchStartRef.current.y);
    if (dx > 15 || dy > 15) return;

    const now      = Date.now();
    const prevTap  = lastTap.current;
    const gap      = now - prevTap.time;
    const sameSide = Math.abs(x - prevTap.x) < 50;

    if (gap < 300 && sameSide) {
      clearTimeout(tapTimerRef.current);
      lastTap.current = { time: 0, x: 0 };
      if (x < third) seekBy(-10);
      else if (x > third * 2) seekBy(10);
    } else {
      lastTap.current = { time: now, x };
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = setTimeout(() => {
        if (x > third && x < third * 2) {
          togglePlay();
        } else {
          if (showCtrl) { setShowCtrl(false); clearTimeout(ctrlTimer.current); }
          else revealCtrl();
        }
        lastTap.current = { time: 0, x: 0 };
      }, 280);
    }
  }, [adActive, is3x, seekBy, togglePlay, showCtrl, revealCtrl]);

  // ── Action handlers ─────────────────────────────────────────────────────────
  const handleShare = async () => {
    const url = `${window.location.origin}?v=${video.id}`;
    try {
      if (navigator.share) { await navigator.share({ title: video.title, url }); showToast("Thanks for sharing!", "success"); }
      else { await navigator.clipboard.writeText(url); showToast("Link copied! 📋", "success"); }
    } catch (e) { if (e.name !== "AbortError") showToast("Could not share", "error"); }
  };

  const handleDownload = () => {
    if (video.is_vip && profile?.is_vip) { executeDownload(); return; }
    showToast("Ad starting… download begins after 30s 📥", "info");
    setDlPending(true); startAd(30, "post", sessionCount);
  };

  const handleSave = async () => {
    if (!session) { setAuthModal("login"); return; }
    const next = !saved; setSaved(next);
    await likeAPI.toggleSave(session.user.id, video.id, saved);
    showToast(next ? "❤️ Saved!" : "Removed from saved", "success");
  };

  const playRelated = useCallback(v => {
    cancelAuto(); setVideo(buildVideoState(v)); setProg(0); setCurTime(0); setDur(0);
    wrapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [cancelAuto]);

  const controlProps = {
    playing, muted, vol, prog, dur, curTime, speed, isFS, isMobile,
    showCtrl, vRef, captionLang, onCaptionChange: setCaptionLang,
    buffered, isBuffering, captionStatus: "off",
    togglePlay, seekBy, toggleFS,
    onMenuToggle: handleMenuToggle,
    setSpeedTo: s => { const v = vRef.current; if (v) v.playbackRate = s; setSpeed(s); },
    onMute: () => { const v = vRef.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); },
    onVolume: n => { setVol(n); if (vRef.current) { vRef.current.volume = n; vRef.current.muted = n === 0; setMuted(n === 0); } },
  };

  const pf = video.profiles || {};

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: C.bg, overflowY: "auto", overflowX: "hidden", animation: "fadeIn .15s ease" }}>

      {/* Top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "var(--headerBg)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, padding: isMobile ? "10px 12px" : "10px 20px", height: 52 }}>
        <button onClick={onClose} style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: "50%", width: 34, height: 34, color: C.text, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 9999, pointerEvents: "auto" }}>✕</button>
        <AppIcon size={24} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: C.text }}>{video.title}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{pf.display_name || pf.username || ""}</div>
        </div>
        {isFS && (
          <button onClick={exitFS} style={{ background: "rgba(0,0,0,.6)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 12px", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
            ⊡ Exit Fullscreen
          </button>
        )}
      </div>

      {/* Grid layout */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1fr) 340px", maxWidth: "100%", paddingBottom: isMobile ? 80 : 0 }}>

        {/* LEFT: player + info */}
        <div style={{ minWidth: 0 }}>

          {/* ── Player ── */}
          <div
            ref={wrapRef}
            onMouseMove={revealCtrl}
            onMouseLeave={() => {
              if (!isMobile && playing && !isMenuOpen) {
                clearTimeout(ctrlTimer.current);
                ctrlTimer.current = setTimeout(() => setShowCtrl(false), 600);
              }
            }}
            style={{
              position: "relative", background: "#000", width: "100%",
              overflow: isMobile ? "visible" : "hidden", 
      aspectRatio: isFS ? "unset" : "16/9",userSelect: "none",
              ...(isFS ? { position: "fixed", inset: 0, zIndex: 99999 } : {}),
            }}
          >
            <video
              ref={vRef}
              src={video.video_url}
              playsInline
              // FIX: Removed onTimeUpdate, onPlay, onPause handlers from JSX —
              // they are all registered via addEventListener in the useEffect above.
              // Having both caused double-registration and race conditions.
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onClick={!isMobile ? togglePlay : undefined}
              onTouchStart={isMobile ? handleTouchStart : undefined}
              onTouchEnd={isMobile ? handleTouchEnd : undefined}
              onTouchMove={isMobile ? () => clearTimeout(lpTimerRef.current) : undefined}
            />

            <BufferingOverlay show={isBuffering && !adActive} />

            {!playing && !isBuffering && !adActive && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 10 }}>
                <div style={{ width: isMobile ? 56 : 76, height: isMobile ? 56 : 76, borderRadius: "50%", background: `${C.accent}cc`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 22 : 32, boxShadow: `0 0 60px ${C.accent}88`, animation: "pulseRing 1.8s infinite" }}>▶</div>
              </div>
            )}

            <SeekFlash seekFlash={seekFlash} arcProg={arcProg} />
            {autoCountdown !== null && <AutoPlayCountdown seconds={autoCountdown} onPlay={playNext} onCancel={cancelAuto} />}
            {adActive && adData && <AdOverlay adData={adData} adTime={adTime} adTotalDuration={adTotalDur} canSkip={canSkip} isMobile={isMobile} onSkip={skipAd} />}

            {isFS && !adActive && (
              <button onClick={exitFS} style={{ position: "absolute", top: 14, right: 14, zIndex: 40, background: "rgba(0,0,0,.6)", border: `1px solid rgba(255,255,255,.2)`, borderRadius: 8, padding: "6px 14px", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", backdropFilter: "blur(8px)" }}>
                ⊡ Exit
              </button>
            )}

            <ControlsBar {...controlProps} />
          </div>

          {/* ── Video info ── */}
          <div style={{ padding: isMobile ? "14px 12px" : "18px 20px" }}>
            <h1 style={{ fontSize: isMobile ? 16 : 21, fontWeight: 800, lineHeight: 1.35, marginBottom: 12, fontFamily: "'Syne',sans-serif", color: C.text }}>{video.title}</h1>

            <div 
              onClick={handleProfileClick}
              style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" ,cursor: "pointer"}}>
              <Avatar profile={pf} size={isMobile ? 34 : 42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{pf.display_name || pf.username || video.channel}</span>
                  {pf.is_verified && <VerifiedBadge />}
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>{fmtNum(pf.followers_count || 0)} followers</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: C.muted }}>👁 {fmtNum(video.views || 0)}</span>
                <span style={{ fontSize: 11, color: C.muted }}>· {timeAgo(video.created_at)}</span>
                {video.is_vip && <VipBadge />}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {[
                { icon: liked ? "❤️" : "🤍", label: fmtNum(likeCount), active: liked, color: C.accent3, onClick: toggleLike },
                { icon: "🔖", label: saved ? "Saved" : "Save", active: saved, color: C.accent, onClick: handleSave },
                { icon: "🔗", label: "Share", color: C.accent2, onClick: handleShare },
                { icon: "📥", label: "Download", color: C.muted, onClick: handleDownload },
              ].map(btn => <ActionBtn key={btn.label} {...btn} />)}
            </div>

            {video.description && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, padding: "12px 14px", background: C.bg3, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden", maxHeight: descExpanded ? "none" : 64, position: "relative" }}>
                  {video.description}
                  {!descExpanded && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 32, background: `linear-gradient(transparent,${C.bg3})` }} />}
                </div>
                <span onClick={() => setDescExpanded(v => !v)} style={{ fontSize: 12, color: C.accent, cursor: "pointer", fontWeight: 600, marginTop: 4, display: "inline-block" }}>
                  {descExpanded ? "Show less ↑" : "Show more ↓"}
                </span>
              </div>
            )}

            {video.tags?.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                {video.tags.map(t => <span key={t} style={{ padding: "4px 10px", background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, color: C.muted }}>#{t}</span>)}
              </div>
            )}

            {isMobile && <SidebarAdWidget ad={sidebarAd} />}
            {isMobile && (
              <div style={{ marginBottom: 24 }}>
                <RelatedList videos={related.slice(0, displayLimit)} onPlay={playRelated} isMobile />
                {related.length > displayLimit && (
                  <button onClick={() => setDisplayLimit(p => p + 20)} style={loadMoreStyle}>Show More Videos</button>
                )}
              </div>
            )}

            <CommentSection videoId={video.id} videoOwnerId={pf.id} />
          </div>
        </div>

        {/* RIGHT: related (desktop sticky) */}
        {!isMobile && (
          <div style={{ borderLeft: `1px solid ${C.border}`, height: "calc(100vh - 52px)", position: "sticky", top: 52, overflowY: "auto", scrollbarWidth: "none", padding: "16px 16px 24px" }}>
            <SidebarAdWidget ad={sidebarAd} />
            <RelatedList videos={related.slice(0, displayLimit)} onPlay={playRelated} isMobile={false} />
            {related.length > displayLimit && (
              <button
                onClick={() => setDisplayLimit(p => p + 20)}
                style={loadMoreStyle}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${C.accent}44`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,.3)"; }}
              >
                Show More Videos
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION BUTTON
// ─────────────────────────────────────────────────────────────────────────────
function ActionBtn({ icon, label, active, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: `1px solid ${active || hov ? color : C.border}`, background: active || hov ? color + "1a" : C.bg3, color: active || hov ? color : C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}
    >
      {icon} {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATED LIST
// ─────────────────────────────────────────────────────────────────────────────
function RelatedList({ videos, onPlay, isMobile }) {
  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 800, paddingBottom: 12, marginBottom: 4, borderBottom: `1px solid ${C.border}`, fontFamily: "'Syne',sans-serif", display: "flex", alignItems: "center", justifyContent: "space-between", color: C.text }}>
        <span>Up Next</span>
        {!isMobile && <span style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>Press N for next</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "1fr", gap: isMobile ? 10 : 4, marginTop: 8 }}>
        {videos.map((v, idx) => <RelatedCard key={v.id} video={v} index={idx} onPlay={onPlay} isMobile={isMobile} />)}
      </div>
    </>
  );
}

function RelatedCard({ video: v, index, onPlay, isMobile }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onPlay(v)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 0 : 10, padding: isMobile ? 0 : "8px 6px", borderRadius: 10, cursor: "pointer", background: hov ? C.bg3 : "transparent", transition: "background .2s", borderBottom: isMobile ? "none" : `1px solid ${C.border}22` }}
    >
      <div style={{ position: "relative", flexShrink: 0, width: isMobile ? "100%" : 120, aspectRatio: "16/9" }}>
        <img
          src={v.thumbnail_url || `https://picsum.photos/640/360?random=${String(v.id).charCodeAt?.(0) || index + 1}`}
          alt={v.title}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: isMobile ? "10px 10px 0 0" : 8 }}
        />
        {v.is_vip && <div style={{ position: "absolute", top: 4, left: 4 }}><VipBadge small /></div>}
        {v.duration && <div style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,.85)", color: "white", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4 }}>{v.duration}</div>}
        {index === 0 && <div style={{ position: "absolute", top: 4, right: 4, background: C.accent, color: "white", fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 4, letterSpacing: .5 }}>NEXT</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: isMobile ? "7px 8px 8px" : 0 }}>
        <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 600, lineHeight: 1.4, marginBottom: 3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", color: C.text }}>{v.title}</div>
        <div style={{ fontSize: 10, color: C.accent, fontWeight: 600, marginBottom: 2 }}>{v.profiles?.display_name || v.channel || "Unknown"}</div>
        <div style={{ fontSize: 9, color: C.muted }}>{fmtNum(v.views_count ?? v.views ?? 0)} views</div>
      </div>
    </div>
  );
}

const loadMoreStyle = {
  width: "100%", padding: "12px 0", marginTop: 16,
  background: `linear-gradient(135deg,var(--accent),var(--accent2,#818cf8))`,
  border: "none", borderRadius: 12, color: "white",
  fontSize: 13, fontWeight: 800, letterSpacing: .8, textTransform: "uppercase",
  cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,.3)",
  transition: "all .3s ease", fontFamily: "inherit",
  display: "flex", alignItems: "center", justifyContent: "center",
};
