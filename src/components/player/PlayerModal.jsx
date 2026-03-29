import { useState, useEffect, useRef, useCallback } from "react";
import { C, Avatar, VipBadge, VerifiedBadge, fmtNum, fmtTime, timeAgo, AppIcon } from "../ui/index";
import { useApp } from "../../context/AppContext";
import { useIsMobile, useVideoLike } from "../../hooks/index";
import { videoAPI, historyAPI, likeAPI, supabase } from "../../lib/supabase";
import { DEMO_VIDEOS } from "../../data/theme";
import CommentSection from "./CommentSection";
import ControlsBar from "./ControlsBar";
import { useCaptions } from "../../hooks/useCaptions";

// ─────────────────────────────────────────────────────────────────────────────
// AD STRATEGY TABLE
// ─────────────────────────────────────────────────────────────────────────────
const AD_STRATEGY = {
  1: { pre: 5, post: 0, label: "Low Friction Start" },
  2: { pre: 0, post: 5, label: "Trust Build & Bank" },
  3: { pre: 10, post: 0, label: "Committed User" },
  4: { pre: 0, post: 10, label: "Pure Breather" },
  5: { pre: 15, post: 5, label: "Money Peak" },
  6: { pre: 0, post: 10, label: "Recovery Phase" },
  7: { pre: 6, post: 0, label: "Guaranteed Revenue" },
  8: { pre: 0, post: 5, label: "Browse-Time Ad" },
  9: { pre: 10, post: 0, label: "Final Wave Push" },
  10: { pre: 5, post: 30, label: "Premium Milestone" },
  11: { pre: 5, post: 0, label: "Premium Milestone2" },
  12: { pre: 0, post: 30, label: "Premium Milestone3" },
  13: { pre: 6, post: 0, label: "Quick Tap" },
  14: { pre: 6, post: 0, label: "Quick Tap" },
  15: { pre: 6, post: 0, label: "Quick Tap" },
  16: { pre: 6, post: 0, label: "Quick Tap" },
  17: { pre: 6, post: 0, label: "Fast CPM Spike" },
  19: { pre: 5, post: 0, label: "Final Stretch" },
  20: { pre: 0, post: 30, label: "The Big Check" },
};

const getStrategy = (count, videoId = "") => {
  const strat = AD_STRATEGY[count];
  if (strat) return { pre: strat.pre || 0, post: strat.post || 0, label: strat.label || "Standard" };
  const isBumper = count > 20 && (count % 3 === 0 || videoId.length % 2 === 0);
  return isBumper
    ? { pre: 6, post: 0, label: "Power Bumper" }
    : { pre: 0, post: 0, label: "Organic" };
};

const UNSKIPPABLE_DURATIONS = new Set([5, 6, 10, 30]);

const DUMMY_ADS = [
  {
    id: 1,
    brand: "NovaDrive",
    tagline: "The Future, Delivered.",
    cta: "Learn More →",
    description: "Experience the all-new NovaDrive EV. Zero emissions, infinite possibilities.",
    badge: "⚡ Electric",
    bg: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    accent: "#7c6bfa",
    logo: "🚗",
    category: "Automotive",
    url: "#",
  },
  {
    id: 2,
    brand: "PureBlend Coffee",
    tagline: "Taste the Altitude.",
    cta: "Shop Now →",
    description: "Single-origin beans from 2,000 m above sea level. Your morning ritual, elevated.",
    badge: "☕ Premium",
    bg: "linear-gradient(135deg, #3b1f0a, #7b4f2e, #3b1f0a)",
    accent: "#e8a96b",
    logo: "☕",
    category: "Food & Drink",
    url: "#",
  },
  {
    id: 3,
    brand: "ArcFit Pro",
    tagline: "Train Smarter. Live Longer.",
    cta: "Get Free Trial →",
    description: "AI-powered workout plans that adapt to YOU. 500,000+ athletes already inside.",
    badge: "💪 Health",
    bg: "linear-gradient(135deg, #001a12, #00412c, #001a12)",
    accent: "#00e676",
    logo: "🏋️",
    category: "Health & Fitness",
    url: "#",
  },
  {
    id: 4,
    brand: "Stellarware",
    tagline: "Your App, Supercharged.",
    cta: "Start for Free →",
    description: "All-in-one productivity suite trusted by 2M+ teams. Launch in 60 seconds.",
    badge: "🚀 SaaS",
    bg: "linear-gradient(135deg, #020024, #090979, #00d4ff22)",
    accent: "#00d4ff",
    logo: "🌐",
    category: "Technology",
    url: "#",
  },
  {
    id: 5,
    brand: "TerraScents",
    tagline: "Wear the Earth.",
    cta: "Explore Collection →",
    description: "Sustainable luxury fragrances crafted from ethically sourced botanicals.",
    badge: "🌿 Eco",
    bg: "linear-gradient(135deg, #1a2a1a, #2d5016, #1a2a1a)",
    accent: "#a8e063",
    logo: "🌿",
    category: "Beauty & Lifestyle",
    url: "#",
  },
];

const getAdForSession = (sessionCount) =>
  DUMMY_ADS[(sessionCount - 1) % DUMMY_ADS.length];

const SIDEBAR_ADS = [
  {
    id: "s1",
    brand: "CloudVault",
    tagline: "Store everything. Access anywhere.",
    description: "1 TB free for new users. Military-grade encryption.",
    accent: "#4fc3f7",
    bg: "linear-gradient(135deg,#0d1b2a,#1b3a5c)",
    logo: "☁️",
    cta: "Try Free",
  },
  {
    id: "s2",
    brand: "PixelForge",
    tagline: "Design without limits.",
    description: "The professional creative suite. Now on every device.",
    accent: "#ff6b9d",
    bg: "linear-gradient(135deg,#1a0a1a,#4a1942)",
    logo: "🎨",
    cta: "Start Creating",
  },
  {
    id: "s3",
    brand: "SwiftLearn",
    tagline: "Skills that pay bills.",
    description: "5,000+ expert-led courses. Learn at your pace.",
    accent: "#ffb347",
    bg: "linear-gradient(135deg,#1a1000,#3d2800)",
    logo: "📚",
    cta: "Browse Courses",
  },
  {
    id: "s4",
    brand: "NexaBank",
    tagline: "Banking. Reimagined.",
    description: "Zero fees. Instant transfers. 4.5% APY savings.",
    accent: "#69f0ae",
    bg: "linear-gradient(135deg,#001a0d,#003320)",
    logo: "🏦",
    cta: "Open Account",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — read video from sessionStorage, preserving created_at and all
// fields from the original initVideo so nothing goes missing on cache hit
// ─────────────────────────────────────────────────────────────────────────────
function buildVideoState(initVideo) {
  try {
    const cached = sessionStorage.getItem(`video_${initVideo.id}`);
    const initViews = Number(initVideo.views_count ?? initVideo.views ?? 0);

    let finalState = { ...initVideo };

    if (cached) {
      const parsed = JSON.parse(cached);
      const cachedViews = Number(parsed.views_count ?? parsed.views ?? 0);
      
      finalState = {
        ...initVideo,
        ...parsed,
        views: Math.max(cachedViews, initViews)
      };
    } else {
      finalState.views = initViews;
    }

    // CRITICAL: Remove the old keys so the UI doesn't accidentally use them
    delete finalState.views_count; 
    
    return finalState;
  } catch (e) {
    return { ...initVideo, views: Number(initVideo.views_count ?? 0) };
  }
}
// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function SeekFlash({ seekFlash, arcProg }) {
  if (!seekFlash) return null;
  const C2 = 188.5;
  const arc = Math.min((arcProg / 100) * C2, C2);
  const Panel = ({ side, active, icon }) => (
    <div style={{ position: "absolute", [side]: 0, top: 0, bottom: 0, width: "32%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: active ? `linear-gradient(to ${side === "left" ? "right" : "left"},rgba(255,255,255,.13),transparent)` : "transparent", transition: "background .15s", pointerEvents: "none" }}>
      {active && (
        <div style={{ position: "relative", width: 68, height: 68 }}>
          <svg width={68} height={68} style={{ transform: `rotate(-90deg)${side === "right" ? " scaleX(-1)" : ""}` }}>
            <circle cx={34} cy={34} r={28} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={4} />
            <circle cx={34} cy={34} r={28} fill="none" stroke="white" strokeWidth={4} strokeLinecap="round" strokeDasharray={`${arc * (28 / 30)} ${C2 * (28 / 30)}`} style={{ transition: "stroke-dasharray .25s ease" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
            <span style={{ fontSize: 17, lineHeight: 1 }}>{icon}</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: "white", letterSpacing: .3 }}>10s</span>
          </div>
        </div>
      )}
    </div>
  );
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 20, animation: "fadeIn .12s" }}>
      <Panel side="left" active={seekFlash === "bwd"} icon="⏪" />
      <Panel side="right" active={seekFlash === "fwd"} icon="⏩" />
      {seekFlash === "2x" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "rgba(0,0,0,.82)", border: `2px solid ${C.accent}`, borderRadius: 14, padding: "12px 28px", fontSize: 22, fontWeight: 900, color: C.accent, letterSpacing: 3 }}>2× SPEED</div>
        </div>
      )}
    </div>
  );
}

function AutoPlayCountdown({ seconds, onPlay, onCancel }) {
  return (
    <div style={{ position: "absolute", bottom: 70, right: 16, zIndex: 30, background: "rgba(0,0,0,.88)", border: `1px solid ${C.accent}44`, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, animation: "fadeIn .3s ease" }}>
      <div style={{ position: "relative", width: 36, height: 36 }}>
        <svg width={36} height={36} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={18} cy={18} r={14} fill="none" stroke={C.border} strokeWidth={3} />
          <circle cx={18} cy={18} r={14} fill="none" stroke={C.accent} strokeWidth={3} strokeLinecap="round" strokeDasharray={`${(seconds / 5) * 87.96} 87.96`} style={{ transition: "stroke-dasharray 1s linear" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: C.accent }}>{seconds}</div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>Up Next</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Auto-playing…</div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onPlay} style={{ background: C.accent, border: "none", borderRadius: 6, color: "white", padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Play Now</button>
        <button onClick={onCancel} style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
      </div>
    </div>
  );
}

function SidebarAdWidget({ ad }) {
  const isMobile = useIsMobile();
  if (!ad) return null;
  return (
    <div style={{
      borderRadius: 14,
      overflow: "hidden",
      border: `1px solid ${ad.accent}33`,
      marginBottom: 20,
      animation: "fadeIn .4s ease",
      position: "relative",
    }}>
      <div style={{
        position: "absolute", top: 8, right: 10, fontSize: 9,
        color: "rgba(255,255,255,.4)", fontWeight: 700, letterSpacing: 1,
        textTransform: "uppercase", zIndex: 2,
      }}>Sponsored</div>
      <div style={{
        background: ad.bg,
        padding: "18px 16px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${ad.accent}22`,
            border: `1px solid ${ad.accent}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
          }}>{ad.logo}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{ad.brand}</div>
            <div style={{ fontSize: 10, color: ad.accent, fontWeight: 600 }}>{ad.tagline}</div>
          </div>
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,.65)", lineHeight: 1.5, margin: 0 }}>{ad.description}</p>
        <button style={{
          marginTop: 4, padding: "8px 0", width: "100%",
          background: `linear-gradient(90deg, ${ad.accent}, ${ad.accent}bb)`,
          border: "none", borderRadius: 8, color: "#fff",
          fontSize: 11, fontWeight: 800, cursor: "pointer",
          letterSpacing: .5, fontFamily: "inherit",
        }}>{ad.cta}</button>
      </div>
    </div>
  );
}

function AdOverlay({ adData, adTime, adTotalDuration, canSkip, currentAdPart, isMobile, onSkip }) {
  const progress = adTotalDuration > 0 ? adTime / adTotalDuration : 0;

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 100,
      background: adData.bg, display: "flex", flexDirection: "column",
      overflow: "hidden", animation: "fadeIn 0.25s ease",
    }}>
      <div style={{
        position: "absolute", width: "120%", height: "120%", top: "-10%", left: "-10%",
        background: `radial-gradient(ellipse at 60% 40%, ${adData.accent}28 0%, transparent 65%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isMobile ? "10px 12px" : "14px 20px",
        minHeight: isMobile ? 50 : "auto",
        borderBottom: `1px solid ${adData.accent}22`,
        position: "relative", zIndex: 2,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: isMobile ? 24 : 36, height: isMobile ? 24 : 36,
            borderRadius: 8, background: `${adData.accent}22`,
            border: `1px solid ${adData.accent}55`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: isMobile ? 12 : 18,
          }}>{adData.logo}</div>
          <div>
            <div style={{ fontSize: isMobile ? 11 : 14, fontWeight: 800, color: "#fff" }}>{adData.brand}</div>
            {!isMobile && <div style={{ fontSize: 9, color: adData.accent, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{adData.category}</div>}
          </div>
        </div>
        <div style={{
          padding: "3px 10px", borderRadius: 20,
          background: `${adData.accent}22`, border: `1px solid ${adData.accent}44`,
          fontSize: 10, fontWeight: 800, color: adData.accent, textTransform: "uppercase",
        }}>Ad</div>
      </div>
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: isMobile ? "10px 20px" : "24px 40px",
        position: "relative", zIndex: 2, textAlign: "center",
        gap: isMobile ? 8 : 16, minHeight: 0,
      }}>
        <div style={{
          width: isMobile ? 50 : 88, height: isMobile ? 50 : 88,
          borderRadius: 20, background: `${adData.accent}18`,
          border: `2px solid ${adData.accent}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: isMobile ? 24 : 44, boxShadow: `0 0 40px ${adData.accent}33`,
        }}>{adData.logo}</div>
        <div>
          <h2 style={{ fontSize: isMobile ? 18 : 28, fontWeight: 900, color: "#fff", margin: "0 0 6px", lineHeight: 1.2 }}>{adData.tagline}</h2>
        </div>
        <button style={{
          marginTop: 4, padding: isMobile ? "8px 20px" : "12px 32px",
          borderRadius: 10, background: adData.accent, border: "none",
          color: "#fff", fontSize: isMobile ? 12 : 14, fontWeight: 800, fontFamily: "inherit",
        }}>{adData.cta}</button>
      </div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "flex-start",
        padding: isMobile ? "10px 16px" : "14px 20px",
        borderTop: `1px solid ${adData.accent}22`,
        position: "relative", zIndex: 2, flexWrap: "nowrap", gap: 10,
        minHeight: isMobile ? 60 : "auto",
        background: isMobile ? "rgba(0,0,0,0.4)" : "transparent",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginRight: "auto" }}>
          <div style={{ position: "relative", width: 40, height: 40 }}>
            <svg width={40} height={40} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={20} cy={20} r={18} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={3} />
              <circle
                cx={20} cy={20} r={18} fill="none"
                stroke={adData.accent} strokeWidth={3} strokeLinecap="round"
                strokeDasharray={`${(2 * Math.PI * 18) * (1 - progress)} ${2 * Math.PI * 18}`}
                style={{ transition: "stroke-dasharray 0.3s linear" }}
              />
            </svg>
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: "#fff",
            }}>{Math.ceil(adTime)}</div>
          </div>
          <button
            disabled={!canSkip}
            onClick={onSkip}
            style={{
              padding: isMobile ? "8px 16px" : "10px 22px",
              fontSize: isMobile ? 11 : 13,
              background: "#fff", color: "#0a0a0a",
              border: "none", borderRadius: 8, fontWeight: 800,
              cursor: canSkip ? "pointer" : "default",
              transition: "all 0.2s ease", opacity: 0.6, whiteSpace: "nowrap",
            }}
          >End in</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function PlayerModal({ video: initVideo, onClose }) {
  const { session, profile, setAuthModal, showToast, setActiveProfile, setPlayer, setTab, incrementView } = useApp();

  const isMobile = useIsMobile();
  const wrapRef = useRef(null);
  const vRef = useRef(null);
  const ctrlTimer = useRef(null);
  const lpRef = useRef(null);
  const touchX0 = useRef(null);
  const touchT0 = useRef(null);
  const flashTimer = useRef(null);
  const autoTimer = useRef(null);
  const adTimerRef = useRef(null);

  // ── Single source of truth for view-increment guard ───────────────────────
  // ONE ref, reset in ONE place only (the video.id effect below).
  const viewIncremented = useRef(false);

  // ── Video state — built once from initVideo + sessionStorage ──────────────
  const [video, setVideo] = useState(() => buildVideoState(initVideo));

  // ── Reset guard + reload video data when initVideo.id changes ─────────────
  // This is the ONLY place viewIncremented is reset.
  // We also re-run buildVideoState so switching videos always shows fresh data.
  useEffect(() => {
    viewIncremented.current = false;
    setVideo(buildVideoState(initVideo));
  }, [initVideo.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [related, setRelated] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [vol, setVol] = useState(1);
  const [prog, setProg] = useState(0);
  const [curTime, setCurTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [showCtrl, setShowCtrl] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [is2x, setIs2x] = useState(false);
  const [seekFlash, setSeekFlash] = useState(null);
  const [arcProg, setArcProg] = useState(0);
  const [isFS, setIsFS] = useState(false);
  const [captionLang, setCaptionLang] = useState("off");
  const [saved, setSaved] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(4);

  const { liked, count: likeCount, toggle: toggleLike } = useVideoLike(video.id, false, video.likes_count);

  const { captionStatus } = useCaptions({
    vRef,
    captionLang,
    videoUrl: video.video_url,
    videoId: video.id,
  });

  const UNSKIPPABLE_DURATIONS = new Set([5, 6, 10, 30]);
  const [isDownloadPending, setIsDownloadPending] = useState(false);

  // ── Session / Ad state ────────────────────────────────────────────────────
  const [sessionCount, setSessionCount] = useState(() =>
    parseInt(sessionStorage.getItem("lx_vcount") || "1")
  );
  const [adActive, setAdActive] = useState(false);
  const [adTime, setAdTime] = useState(0);
  const [adTotalDuration, setAdTotalDuration] = useState(0);
  const [requiredWait, setRequiredWait] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [currentAdPart, setCurrentAdPart] = useState(null);
  const [currentAdData, setCurrentAdData] = useState(null);

  // ── Smart Refresh sidebar ad ──────────────────────────────────────────────
  const [sidebarAd, setSidebarAd] = useState(() => SIDEBAR_ADS[0]);
  const sidebarRefreshRef = useRef(null);

  useEffect(() => {
    let adIdx = 0;
    sidebarRefreshRef.current = setInterval(() => {
      adIdx = (adIdx + 1) % SIDEBAR_ADS.length;
      setSidebarAd(SIDEBAR_ADS[adIdx]);
    }, 30_000);
    return () => clearInterval(sidebarRefreshRef.current);
  }, []);

  // ── startAd ───────────────────────────────────────────────────────────────
  const startAd = useCallback((duration, type, adIdx) => {
    if (duration <= 0) return;
    if (adTimerRef.current) clearInterval(adTimerRef.current);

    const isUnskippable = UNSKIPPABLE_DURATIONS.has(duration);
    const waitTime = isUnskippable ? duration : 5;

    setAdTotalDuration(duration);
    setRequiredWait(waitTime);
    setAdActive(true);
    setAdTime(duration);
    setCanSkip(false);
    setCurrentAdPart(type);
    setCurrentAdData(adIdx !== undefined ? DUMMY_ADS[adIdx % DUMMY_ADS.length] : getAdForSession(1));

    setPlaying(false);
    if (vRef.current) {
      vRef.current.pause();
      vRef.current.currentTime = 0;
    }

    let elapsed = 0;
    adTimerRef.current = setInterval(() => {
      elapsed += 1;
      if (!isUnskippable && elapsed >= waitTime) setCanSkip(true);
      setAdTime(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(adTimerRef.current);
          adTimerRef.current = null;
          if (isUnskippable) setCanSkip(true);
          return 0;
        }
        return next;
      });
    }, 1500);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { if (adTimerRef.current) clearInterval(adTimerRef.current); };
  }, []);

  const cancelAuto = useCallback(() => {
    clearInterval(autoTimer.current);
    setAutoCountdown(null);
  }, []);

  const playNext = useCallback(() => {
    cancelAuto();
    const next = related[0];
    if (next) {
      setVideo(buildVideoState(next));
      setProg(0); setCurTime(0); setDur(0);
    }
  }, [related, cancelAuto]);

  const executeDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = video.video_url;
    a.download = (video.title || "video") + ".mp4";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Download started!", "success");
  }, [video]);

  // ── Revenue constant ──────────────────────────────────────────────────────
  // Minimum Indian Market Rate: $0.50 CPM = $0.000033 per second
  const MIN_REVENUE_PER_SECOND = 0.000033;

  // ── skipAd ────────────────────────────────────────────────────────────────
  const skipAd = useCallback(async () => {
    if (adTimerRef.current) {
      clearInterval(adTimerRef.current);
      adTimerRef.current = null;
    }

    const totalGenerated = adTotalDuration * MIN_REVENUE_PER_SECOND;

    try {
      if (totalGenerated > 0) {
        await supabase.rpc('track_ad_revenue_80_split', {
          vid: video.id,
          total_val: totalGenerated,
        });
        console.log(`Ad: ${adTotalDuration}s. Generated: $${totalGenerated}. User (80%): $${totalGenerated * 0.8}`);
      }
    } catch (err) {
      console.error("Revenue tracking failed:", err);
    }

    setAdActive(false);
    setAdTime(0);
    setCanSkip(false);
    setCurrentAdData(null);

    if (currentAdPart === "pre") {
      if (vRef.current) {
        vRef.current.currentTime = 0;
        vRef.current.play().then(() => setPlaying(true)).catch(() => {});
      }
    } else if (currentAdPart === "post") {
      if (isDownloadPending) {
        executeDownload();
        setIsDownloadPending(false);
      } else {
        playNext();
      }
    }
  }, [currentAdPart, isDownloadPending, executeDownload, playNext, adTotalDuration, video.id]);

  // ── Auto-skip when adTime hits 0 and canSkip is true ─────────────────────
  useEffect(() => {
    if (adActive && canSkip && adTime === 0) {
      const t = setTimeout(() => {
        if (adActive && canSkip) skipAd();
      }, 500);
      return () => clearTimeout(t);
    }
  }, [adActive, canSkip, adTime, skipAd]);

  const playNextRef = useRef(playNext);
  useEffect(() => { playNextRef.current = playNext; }, [playNext]);

  // ── Pre-roll ad decision — fires on video.id change ───────────────────────
  useEffect(() => {
    const strategy = getStrategy(sessionCount, video.id);

    if (!adActive) {
      if (strategy.pre > 0) {
        startAd(strategy.pre, "pre", sessionCount);
      } else {
        setAdActive(false);
        setAdTime(0);
        setCanSkip(false);
        if (adTimerRef.current) {
          clearInterval(adTimerRef.current);
          adTimerRef.current = null;
        }
      }
      const next = sessionCount + 1;
      setSessionCount(next);
      sessionStorage.setItem("lx_vcount", next.toString());
    }
  }, [video.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── View count increment ──────────────────────────────────────────────────
  // ONE useEffect only. Guard is reset solely in the initVideo.id effect above.
// ── View count increment ──────────────────────────────────────────────────
  useEffect(() => {
    // 1. Reset guard when the video actually changes
    // (Note: This is usually handled by the ID change, but we ensure it here)
    const timer = setTimeout(async () => {
      // 2. Strict Check: Only increment if playing, no ad, and not already done
      if (video?.id && !viewIncremented.current && playing && !adActive) {
        
        // 3. Set guard immediately BEFORE the async call to block duplicates
        viewIncremented.current = true;
        
        try {
          await incrementView(video.id);
          
          // 4. Update local state and SessionStorage for persistence
          setVideo(prev => {
            const updated = { 
              ...prev, 
              views: (Number(prev.views) || 0) + 1 
            };
            sessionStorage.setItem(`video_${video.id}`, JSON.stringify(updated));
            
            // 5. Notify other tabs/components (if applicable)
            window.dispatchEvent(new CustomEvent("video_view_updated", {
              detail: { videoId: video.id, views: updated.views }
            }));
            
            return updated;
          });
        } catch (err) {
          console.error("Failed to increment view:", err);
          // Only reset on error so it can retry if the user pauses/plays
          viewIncremented.current = false;
        }
      }
    }, 5000); // 5 second watch threshold

    // 6. CRITICAL: Clear timer if user pauses or closes modal before 5s
    return () => clearTimeout(timer);
  }, [playing, video?.id, adActive, incrementView]);

  // ── Sync view count from other tabs ──────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.detail.videoId === video.id) {
        setVideo(prev => ({ ...prev, views: e.detail.views }));
      }
    };
    window.addEventListener("video_view_updated", handler);
    return () => window.removeEventListener("video_view_updated", handler);
  }, [video.id]);

  // ── Load related videos ───────────────────────────────────────────────────
  useEffect(() => {
    setDisplayLimit(4);
    setRelated(DEMO_VIDEOS.filter(v => v.id !== video.id));
    videoAPI.getFeed({ limit: 100 })
      .then(data => { if (data?.length) setRelated(data.filter(v => v.id !== video.id)); })
      .catch(() => {});
  }, [video.id]);

  // ── Watch history ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (session?.user?.id && video?.id) {
      const timer = setTimeout(() => {
        historyAPI.addToHistory(session.user.id, video.id);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [video.id, session?.user?.id]);

  // ── Buffering & video element events ─────────────────────────────────────
  const startAutoCountdown = useCallback(() => {
    if (!related.length) return;
    setAutoCountdown(5);
    let count = 5;
    autoTimer.current = setInterval(() => {
      count--;
      setAutoCountdown(count);
      if (count <= 0) {
        clearInterval(autoTimer.current);
        setAutoCountdown(null);
        const next = related[0];
        if (next) {
          setVideo(buildVideoState(next));
          setProg(0); setCurTime(0); setDur(0);
        }
      }
    }, 1000);
  }, [related]);

  useEffect(() => {
    const v = vRef.current;
    if (!v) return;

    setBuffered(0); setProg(0); setCurTime(0); setDur(0);

    if (!adActive) setIsBuffering(true);
    else { setIsBuffering(false); v.pause(); v.currentTime = 0; }

    const tryPlay = () => {
      if (!vRef.current) return;
      if (adActive) {
        vRef.current.pause();
        vRef.current.currentTime = 0;
      } else {
        vRef.current.currentTime = 0;
        vRef.current.play().then(() => setPlaying(true)).catch(() => {});
      }
    };

    if (v.readyState >= 2) tryPlay();
    else v.addEventListener("canplay", tryPlay, { once: true });

    const upd = () => {
      setCurTime(v.currentTime);
      setDur(v.duration || 0);
      setProg(v.duration ? (v.currentTime / v.duration) * 100 : 0);
    };

    const onWaiting  = () => { if (!adActive) setIsBuffering(true); };
    const onPlay2    = () => setIsBuffering(false);
    const onSeeking  = () => { if (!adActive) setIsBuffering(true); };
    const onSeeked   = () => setIsBuffering(false);
    const onProgress = () => {
      if (v.buffered.length && v.duration)
        setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
    };
    const handleEnded = () => {
      const strategy = getStrategy(sessionCount - 1, video.id);
      if (strategy.post > 0) startAd(strategy.post, "post", sessionCount);
      else startAutoCountdown();
    };

    v.addEventListener("timeupdate", upd);
    v.addEventListener("loadedmetadata", upd);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlay2);
    v.addEventListener("seeking", onSeeking);
    v.addEventListener("seeked", onSeeked);
    v.addEventListener("progress", onProgress);
    v.addEventListener("ended", handleEnded);

    return () => {
      v.removeEventListener("timeupdate", upd);
      v.removeEventListener("loadedmetadata", upd);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlay2);
      v.removeEventListener("seeking", onSeeking);
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("progress", onProgress);
      v.removeEventListener("ended", handleEnded);
      clearTimeout(ctrlTimer.current);
      clearTimeout(flashTimer.current);
      clearInterval(autoTimer.current);
    };
  }, [video.id, video.video_url, adActive, sessionCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Misc effects ──────────────────────────────────────────────────────────
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  useEffect(() => { if (!session) return; likeAPI.isSaved(session.user.id, video.id).then(setSaved); }, [session, video.id]);
  useEffect(() => {
    const fn = () => setIsFS(!!(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", fn);
    document.addEventListener("webkitfullscreenchange", fn);
    return () => { document.removeEventListener("fullscreenchange", fn); document.removeEventListener("webkitfullscreenchange", fn); };
  }, []);

  // ── Controls ──────────────────────────────────────────────────────────────
  const playRelated = useCallback(v => {
    cancelAuto();
    setVideo(buildVideoState(v));
    setProg(0); setCurTime(0); setDur(0);
    wrapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [cancelAuto]);

  const revealCtrl = useCallback(() => {
    setShowCtrl(true);
    clearTimeout(ctrlTimer.current);
    ctrlTimer.current = setTimeout(() => setShowCtrl(false), 3000);
  }, []);

  const togglePlay = useCallback(() => {
    const v = vRef.current;
    if (!v || adActive) return;
    if (v.paused) { v.play().then(() => setPlaying(true)).catch(() => {}); revealCtrl(); }
    else { v.pause(); setPlaying(false); setShowCtrl(true); clearTimeout(ctrlTimer.current); }
  }, [revealCtrl, adActive]);

  const seekBy = useCallback(secs => {
    const v = vRef.current; if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + secs));
    const pct = v.duration ? Math.min((Math.abs(secs) / v.duration) * 100 * 6, 100) : 40;
    clearTimeout(flashTimer.current);
    setArcProg(0);
    setSeekFlash(secs > 0 ? "fwd" : "bwd");
    requestAnimationFrame(() => requestAnimationFrame(() => setArcProg(pct)));
    flashTimer.current = setTimeout(() => { setSeekFlash(null); setArcProg(0); }, 800);
    revealCtrl();
  }, [revealCtrl]);

  const enterFS = useCallback(() => {
    const el = wrapRef.current; if (!el) return;
    try { if (window.screen.orientation?.lock) window.screen.orientation.lock("landscape").catch(() => {}); } catch (e) {}
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req) req.call(el).catch(() => {});
  }, []);

  const exitFS = useCallback(() => {
    try { if (window.screen.orientation?.unlock) window.screen.orientation.unlock(); } catch (e) {}
    const ex = document.exitFullscreen || document.webkitExitFullscreen;
    if (ex) ex.call(document).catch(() => {});
  }, []);

  const toggleFS = useCallback(() => {
    if (isFS) exitFS(); else enterFS();
    revealCtrl();
  }, [isFS, enterFS, exitFS, revealCtrl]);

  useEffect(() => {
    const h = e => {
      if (e.key === "Escape") { if (isFS) exitFS(); else onClose(); return; }
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      if (e.key === "ArrowRight") seekBy(10);
      if (e.key === "ArrowLeft") seekBy(-10);
      if (e.key === "f" || e.key === "F") toggleFS();
      if (e.key === "n" || e.key === "N") playNext();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const handleTouchStart = e => {
    touchX0.current = e.touches[0].clientX;
    touchT0.current = Date.now();
    lpRef.current = setTimeout(() => {
      const v = vRef.current; if (!v) return;
      v.playbackRate = 2; setSpeed(2); setIs2x(true);
      clearTimeout(flashTimer.current);
      setSeekFlash("2x");
      flashTimer.current = setTimeout(() => setSeekFlash(null), 900);
    }, 600);
  };

  const handleTouchEnd = e => {
    clearTimeout(lpRef.current);
    if (is2x) {
      const v = vRef.current; if (v) v.playbackRate = 1;
      setSpeed(1); setIs2x(false); return;
    }
    const elapsed = Date.now() - (touchT0.current || 0);
    const dx = e.changedTouches[0].clientX - (touchX0.current || 0);
    if (elapsed < 500 && Math.abs(dx) < 10) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.changedTouches[0].clientX - rect.left;
      const third = rect.width / 3;
      if (x < third) seekBy(-10); else if (x > third * 2) seekBy(10); else togglePlay();
    }
    revealCtrl();
  };

  const handleShare = async () => {
    const shareData = {
      title: video.title || "Check out this video on LumineX",
      text: `Watch ${video.title} on LumineX`,
      url: `${window.location.origin}?v=${video.id}`,
    };
    try {
      if (navigator.share) { await navigator.share(shareData); showToast("Thanks for sharing!", "success"); }
      else { await navigator.clipboard.writeText(shareData.url); showToast("Link copied to clipboard! 📋", "success"); }
    } catch (error) {
      if (error.name !== "AbortError") showToast("Could not share link", "error");
    }
  };

  const handleDownload = () => {
    if (video.is_vip && profile?.is_vip) {
      executeDownload();
      return;
    }
    showToast("Ad starting... Download will begin after 30s 📥", "info");
    setIsDownloadPending(true);
    startAd(30, "post", sessionCount);
  };

  const handleSave = async () => {
    if (!session) { setAuthModal("login"); return; }
    const next = !saved;
    setSaved(next);
    await likeAPI.toggleSave(session.user.id, video.id, saved);
    showToast(next ? "❤️ Saved!" : "Removed from saved", "success");
  };

  const handleProfileClick = (e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const profileData = video?.profiles || pf;
    const identifier = profileData?.username || profileData?.id;
    if (!identifier) return;
    window.dispatchEvent(new CustomEvent("lx_pause_video"));
    window.scrollTo(0, 0);
    setTimeout(() => {
      setActiveProfile(profileData);
      setTab(`profile:${identifier}`);
    }, 50);
  };

  useEffect(() => {
    const handlePause = () => { if (vRef.current) vRef.current.pause(); };
    window.addEventListener("lx_pause_video", handlePause);
    return () => window.removeEventListener("lx_pause_video", handlePause);
  }, []);

  const controlProps = {
    playing, muted, vol, prog, dur, curTime, speed, isFS, isMobile,
    showCtrl, vRef, captionLang, onCaptionChange: setCaptionLang,
    buffered, isBuffering,
    captionStatus,
    togglePlay, seekBy, toggleFS,
    setSpeedTo: s => { const v = vRef.current; if (v) v.playbackRate = s; setSpeed(s); },
    onMute: () => { const v = vRef.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); },
    onVolume: n => { setVol(n); if (vRef.current) { vRef.current.volume = n; vRef.current.muted = n === 0; setMuted(n === 0); } },
  };

  const pf = video.profiles || {};

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: C.bg,
      overflowY: "auto", overflowX: "hidden", animation: "fadeIn .15s ease",
    }}>
      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--headerBg)", backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 12,
        padding: isMobile ? "10px 12px" : "10px 20px", height: 52,
      }}>
        <button onClick={onClose} style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: "50%", width: 34, height: 34, color: C.text, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
        <AppIcon size={24} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: C.text }}>{video.title}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{pf.display_name || pf.username || ""}</div>
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1fr) 340px", maxWidth: "100%", paddingBottom: isMobile ? 80 : 0 }}>

        {/* LEFT */}
        <div style={{ minWidth: 0 }}>

          {/* PLAYER WRAPPER */}
          <div
            ref={wrapRef}
            onMouseMove={revealCtrl}
            onMouseLeave={() => {
              if (playing) {
                clearTimeout(ctrlTimer.current);
                ctrlTimer.current = setTimeout(() => setShowCtrl(false), 600);
              }
            }}
            style={{
              position: "relative", background: "#000", width: "100%",
              overflow: "hidden", aspectRatio: isFS ? "unset" : "16/9",
              userSelect: "none",
              ...(isFS ? { position: "fixed", inset: 0, zIndex: 99999 } : {}),
            }}
          >
            <video
              ref={vRef}
              src={video.video_url}
              playsInline
              onTimeUpdate={() => {
                if (adActive && vRef.current && vRef.current.currentTime > 0) {
                  vRef.current.currentTime = 0;
                }
              }}
              onPlay={() => {
                if (adActive) {
                  vRef.current.pause();
                  vRef.current.currentTime = 0;
                } else {
                  setPlaying(true);
                }
              }}
              onPause={() => setPlaying(false)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onClick={!isMobile ? togglePlay : undefined}
              onTouchStart={isMobile ? handleTouchStart : undefined}
              onTouchEnd={isMobile ? handleTouchEnd : undefined}
              onTouchMove={isMobile ? () => clearTimeout(lpRef.current) : undefined}
            />

            {/* Buffering spinner */}
            {isBuffering && !adActive && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 15, pointerEvents: "none" }}>
                <div style={{ position: "relative", width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid rgba(255,255,255,.1)" }} />
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: C.accent, borderRightColor: C.accent2, animation: "spin .8s linear infinite" }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accent2})`, boxShadow: `0 0 12px ${C.accent}` }} />
                </div>
              </div>
            )}

            {/* Paused play icon */}
            {!playing && !isBuffering && !adActive && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 10 }}>
                <div style={{
                  width: isMobile ? 50 : 76, height: isMobile ? 50 : 76,
                  fontSize: isMobile ? 20 : 32, borderRadius: "50%",
                  background: `${C.accent}cc`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 60px ${C.accent}88`,
                  animation: "pulseRing 1.8s infinite",
                }}>▶</div>
              </div>
            )}

            <SeekFlash seekFlash={seekFlash} arcProg={arcProg} />
            {is2x && <div style={{ position: "absolute", top: 14, right: 14, zIndex: 25, background: C.accent, color: "white", fontWeight: 800, fontSize: 12, padding: "4px 12px", borderRadius: 8 }}>2× SPEED</div>}

            {isMobile && showCtrl && !is2x && !seekFlash && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", pointerEvents: "none", zIndex: 8 }}>
                {[{ icon: "↺", l: "10" }, {}, { icon: "↻", l: "10" }].map((item, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.icon && (
                      <div style={{ background: "rgba(0,0,0,.45)", borderRadius: 40, width: 46, height: 46, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,.14)" }}>
                        <span style={{ fontSize: 14 }}>{item.icon}</span>
                        <span style={{ fontSize: 8, color: "rgba(255,255,255,.7)", fontWeight: 700 }}>{item.l}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {autoCountdown !== null && (
              <AutoPlayCountdown seconds={autoCountdown} onPlay={playNext} onCancel={cancelAuto} />
            )}

            {adActive && currentAdData && (
              <AdOverlay
                adData={currentAdData}
                adTime={adTime}
                adTotalDuration={adTotalDuration}
                canSkip={canSkip}
                currentAdPart={currentAdPart}
                isMobile={isMobile}
                onSkip={skipAd}
              />
            )}

            <ControlsBar {...controlProps} />
          </div>

          {/* INFO SECTION */}
          <div style={{ padding: isMobile ? "14px 12px" : "18px 20px" }}>
            <h1 style={{ fontSize: isMobile ? 16 : 21, fontWeight: 800, lineHeight: 1.35, marginBottom: 12, fontFamily: "'Syne',sans-serif", color: C.text }}>
              {video.title}
            </h1>

            <div
              onClick={handleProfileClick}
              style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "all 0.2s ease", padding: "4px 8px", marginLeft: "-8px", borderRadius: "8px" }}
              onMouseEnter={e => { e.currentTarget.style.opacity = 0.8; const n = e.currentTarget.querySelector(".profile-name-text"); if (n) n.style.textDecoration = "underline"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = 1; const n = e.currentTarget.querySelector(".profile-name-text"); if (n) n.style.textDecoration = "none"; }}
            >
              <Avatar profile={pf} size={isMobile ? 34 : 42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="profile-name-text" style={{ fontSize: 14, fontWeight: 700, color: C.text, transition: "color 0.2s" }}>
                    {pf.display_name || pf.username || video.channel}
                  </span>
                  {pf.is_verified && <VerifiedBadge />}
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>{fmtNum(pf.followers_count || 0)} followers</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: C.muted }}>👁 {fmtNum(video.views)}</span>
                <span style={{ fontSize: 11, color: C.muted }}>· {video.created_at ? timeAgo(video.created_at) : ""}</span>
                {video.is_vip && <VipBadge />}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, marginTop: 12 }}>
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
                {video.tags.map(t => (
                  <span key={t} style={{ padding: "4px 10px", background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, color: C.muted }}>#{t}</span>
                ))}
              </div>
            )}

            {isMobile && <SidebarAdWidget ad={sidebarAd} />}

            {isMobile && (
              <div style={{ marginBottom: 24 }}>
                <RelatedList videos={related.slice(0, displayLimit)} onPlay={playRelated} isMobile />
                {related.length > displayLimit && (
                  <button onClick={() => setDisplayLimit(p => p + 20)} style={loadMoreButtonStyle}>
                    Show More Videos
                  </button>
                )}
              </div>
            )}

            <CommentSection videoId={video.id} videoOwnerId={pf.id} />
          </div>
        </div>

        {/* RIGHT: Related (desktop sticky) */}
        {!isMobile && (
          <div style={{ borderLeft: `1px solid ${C.border}`, height: "calc(100vh - 52px)", position: "sticky", top: 52, overflowY: "auto", scrollbarWidth: "none", padding: "16px 16px 24px" }}>
            <SidebarAdWidget ad={sidebarAd} />
            <RelatedList videos={related.slice(0, displayLimit)} onPlay={playRelated} isMobile={false} />
            {related.length > displayLimit && (
              <button
                onClick={() => setDisplayLimit(p => p + 20)}
                style={loadMoreButtonStyle}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)"; }}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1.02)"}
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
// SHARED SUB-COMPONENTS
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

const loadMoreButtonStyle = {
  width: "100%", padding: "14px 0", marginTop: "20px",
  background: `linear-gradient(135deg, ${C.accent}, ${C.accent2 || C.accent + "dd"})`,
  border: "none", borderRadius: "14px", color: "white",
  fontSize: "14px", fontWeight: "800", textTransform: "uppercase",
  letterSpacing: "1px", cursor: "pointer",
  boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  fontFamily: "inherit", display: "flex", alignItems: "center",
  justifyContent: "center", outline: "none",
};
