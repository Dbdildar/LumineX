import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  C, SectionHeader, HScroll, FilterChip, Skeleton,
  EmptyState, fmtNum, VerifiedBadge,
} from "../components/ui/index";
import { useApp } from "../context/AppContext";
import { videoAPI, followAPI, likeAPI, historyAPI, supabase } from "../lib/supabase";
import { useIsMobile } from "../hooks/index";
import VideoCard from "../components/VideoCard";
import { getAdLink, AD_CONFIG } from "../lib/ads";


// ─────────────────────────────────────────────────────────────────────────────
const MultiplexAdUnit = () => (
  <div style={{
    /* Remove gridColumn: '1 / -1' so it fits in a single slot */
    background: C.bg2,
    borderRadius: '12px',
    border: `1px solid ${C.border}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%', // Ensures it matches the height of neighboring cards
  }}>
    {/* Ad Placeholder/Thumbnail Area - matches VideoCard aspect ratio */}
    <div style={{
      aspectRatio: '16/9',
      background: '#1a1a1a',
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      position: 'relative'
    }}>
      <span style={{ fontSize: '10px', color: '#666', position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4 }}>
        Sponsored
      </span>
      <div id="ad-slot-12345" style={{ width: '100%', height: '100%' }} />
    </div>

    {/* Content Area - matches VideoCard padding and text style */}
    <div style={{ padding: '10px' }}>
      <span style={{ fontSize: '13px', fontWeight: '600', color: C.text, display: 'block', marginBottom: '4px' }}>
        Recommended for You
      </span>
      <span style={{ fontSize: '11px', color: C.muted }}>
        Promoted Content
      </span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY ICON MAP  — maps category name → emoji for display
// ─────────────────────────────────────────────────────────────────────────────
const CAT_ICONS = {
  music: "🎵", gaming: "🎮", sports: "⚽", news: "📰", comedy: "😂",
  education: "📚", technology: "💻", travel: "✈️", food: "🍕",
  fitness: "💪", fashion: "👗", beauty: "💄", science: "🔬",
  movies: "🎬", art: "🎨", business: "💼", health: "❤️",
  politics: "🏛️", nature: "🌿", animals: "🐾", diy: "🔧",
  finance: "💰", lifestyle: "☀️", kids: "🧒", cooking: "👨‍🍳",
};
const catIcon = (name = "") => CAT_ICONS[name.toLowerCase()] || "📂";
const catColor = (name = "") => {
  const palette = ["#7c6bfa", "#f472b6", "#34d399", "#60a5fa", "#fbbf24", "#fb7185", "#a78bfa", "#2dd4bf"];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return palette[h % palette.length];
};

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", background: C.bg3, border: `1px solid ${C.border}` }}>
      <Skeleton width="100%" height={0} style={{ aspectRatio: "16/9", height: "unset" }} />
      <div style={{ padding: 10 }}>
        <Skeleton width="80%" height={12} style={{ marginBottom: 6 }} />
        <Skeleton width="50%" height={10} />
      </div>
    </div>
  );
}

function SkeletonUserCard() {
  return (
    <div style={{ flexShrink: 0, width: 130, padding: "20px 10px", background: C.bg3, borderRadius: 20, border: `1px solid ${C.border}`, textAlign: "center" }}>
      <Skeleton width={70} height={70} style={{ borderRadius: "50%", margin: "0 auto 12px" }} />
      <Skeleton width="70%" height={12} style={{ margin: "0 auto 8px" }} />
      <Skeleton width="50%" height={10} style={{ margin: "0 auto 12px" }} />
      <Skeleton width="100%" height={28} style={{ borderRadius: 10 }} />
    </div>
  );
}

function SkeletonCategoryChip() {
  return <Skeleton width={80} height={32} style={{ borderRadius: 20, flexShrink: 0 }} />;
}

function SkeletonCategoryCard() {
  return (
    <div style={{ borderRadius: 16, padding: "18px 14px", background: C.bg3, border: `1px solid ${C.border}`, textAlign: "center" }}>
      <Skeleton width={40} height={40} style={{ borderRadius: "50%", margin: "0 auto 10px" }} />
      <Skeleton width="60%" height={12} style={{ margin: "0 auto 6px" }} />
      <Skeleton width="40%" height={10} style={{ margin: "0 auto" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY CARD (desktop grid)
// ─────────────────────────────────────────────────────────────────────────────
export function CategoryCard({ name, onClick }) {
  const [hov, setHov] = useState(false);
  const color = catColor(name);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        background: hov ? `${color}40` : `${color}25`,
        border: `1px solid ${hov ? color : `${color}60`}`,
        borderRadius: 16, padding: "18px 14px", textAlign: "center", cursor: "pointer",
        transition: "all .3s cubic-bezier(0.34,1.2,0.64,1)",
        transform: hov ? "translateY(-6px) scale(1.04)" : "none",
        boxShadow: hov
          ? `0 10px 30px -10px ${color}, 0 0 15px ${color}30`
          : "0 4px 15px rgba(0,0,0,0.3)",
        position: "relative", overflow: "hidden",
      }}
    >
      {hov && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 40%,${color}18 0%,transparent 70%)`, pointerEvents: "none" }} />}
      <div style={{ fontSize: 32, marginBottom: 10, transition: "transform .3s", transform: hov ? "scale(1.2) rotate(-5deg)" : "scale(1)", display: "inline-block", position: "relative", zIndex: 1 }}>
        {catIcon(name)}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: hov ? color : C.text, marginBottom: 3, transition: "color .3s", position: "relative", zIndex: 1, textTransform: "capitalize" }}>{name}</div>
      <div style={{ position: "absolute", bottom: 0, left: "50%", transform: `translateX(-50%) scaleX(${hov ? 1 : 0})`, width: "80%", height: 2, background: `linear-gradient(90deg,${color},${color}88)`, transition: "transform .3s ease", borderRadius: "99px 99px 0 0" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE CATEGORY STRIP  (horizontal scroll)
// ─────────────────────────────────────────────────────────────────────────────
function MobileCategoryStrip({ categories, loading, selectedCat, onSelect }) {
  if (loading) return (
    <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4, marginBottom: 8 }}>
      {Array(8).fill(0).map((_, i) => <SkeletonCategoryChip key={i} />)}
    </div>
  );
  return (
    <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4, marginBottom: 8 }}>
      {categories.map(name => {
        const color = catColor(name);
        const active = selectedCat === name;
        return (
          <div
            key={name} onClick={() => onSelect(name)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
              flexShrink: 0, cursor: "pointer",
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: active ? color + "44" : color + "22",
              border: `1.5px solid ${active ? color : color + "44"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, transition: "all .2s",
              boxShadow: active ? `0 0 12px ${color}66` : "none",
            }}
              onTouchStart={e => e.currentTarget.style.transform = "scale(0.92)"}
              onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
            >
              {catIcon(name)}
            </div>
            <span style={{ fontSize: 9, color: active ? color : C.muted, fontWeight: active ? 700 : 600, letterSpacing: .3, textTransform: "capitalize" }}>{name}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO BANNER  (pulls from trending data, no static dependency)
// ─────────────────────────────────────────────────────────────────────────────
function HeroBanner({ items }) {
  const { playVideo } = useApp();
  const isMobile = useIsMobile();
  const [idx, setIdx] = useState(0);
  const [liveViews, setLiveViews] = useState({});

  useEffect(() => {
    if (!items?.length) return;
    const t = setInterval(() => setIdx(i => (i + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items?.length]);

  useEffect(() => {
    const handleUpdate = (e) => {
      setLiveViews(prev => ({
        ...prev,
        [e.detail.videoId]: e.detail.views
      }));
    };

    window.addEventListener('video_view_updated', handleUpdate);
    return () => window.removeEventListener('video_view_updated', handleUpdate);
  }, []);


  if (!items?.length) return (
    <div style={{ borderRadius: isMobile ? 0 : 20, overflow: "hidden", marginBottom: 24, height: isMobile ? 220 : 320, background: C.bg3, marginLeft: isMobile ? -12 : 0, marginRight: isMobile ? -12 : 0 }}>
      <Skeleton width="100%" height="100%" />
    </div>
  );

  const item = items[idx % items.length];

  const displayViews = liveViews[item.id] || item.views || 0;

  return (
    <div style={{ position: "relative", borderRadius: isMobile ? 0 : 20, overflow: "hidden", marginBottom: 24, height: isMobile ? 220 : 320, background: C.bg3, marginLeft: isMobile ? -12 : 0, marginRight: isMobile ? -12 : 0 }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${item.thumbnail_url})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.8, transition: "background-image .8s ease" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(3,3,8,.95) 0%,rgba(3,3,8,.5) 60%,transparent 100%)" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: isMobile ? 16 : 32 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>🔥 Featured</div>
        <h2 style={{ fontSize: isMobile ? 18 : 26, fontWeight: 900, marginBottom: 8, maxWidth: 480, color: C.text, lineHeight: 1.3 }}>{item.title}</h2>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
          {item.profiles?.display_name || item.channel || "Creator"} · {fmtNum(displayViews)} views views
        </div>
        <button onClick={() => playVideo(item)} style={{ alignSelf: "flex-start", padding: "11px 28px", borderRadius: 999, background: `linear-gradient(135deg,${C.accent},${C.accent2})`, border: "none", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
          ▶ Watch Now
        </button>
      </div>
      {/* Dot indicators */}
      <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
        {items.map((_, i) => (
          <div key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 3, background: i === idx ? C.accent : "rgba(255,255,255,.3)", transition: "all .3s", cursor: "pointer" }} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function VideoGrid({ videos, loading, isMobile }) {
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(260px,1fr))",
    gap: isMobile ? 10 : 14,
  };

  if (loading && !videos.length) return (
    <div style={gridStyle}>
      {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );

  return (
    <div style={gridStyle}>
      {videos.map((v, i) => (
        <React.Fragment key={v.id || i}>
          {/* 1. Show the Video Card */}
          <VideoCard video={v} />

          {/* 2. Show the Ad Card every 6 items */}
          {/* No wrapper div with gridColumn here! It will just take the next grid slot */}
          {(i + 1) % 6 === 0 && <MultiplexAdUnit />}
        </React.Fragment>
      ))}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// FOLLOW REQUEST TOAST
// ─────────────────────────────────────────────────────────────────────────────
function FollowRequestToast({ requests, onAccept, onReject, isMobile }) {
  if (!requests?.length) return null;
  return (
    <div style={{ position: "fixed", top: isMobile ? 60 : 70, right: isMobile ? 0 : 20, left: isMobile ? 0 : "auto", zIndex: 99999, display: "flex", flexDirection: "column", gap: 10, padding: isMobile ? "0 12px" : 0, pointerEvents: "none" }}>
      {requests.map(req => (
        <div key={req.id} style={{
          background: "rgba(15,15,25,0.97)", backdropFilter: "blur(20px)",
          border: `1px solid ${C.accent}44`, borderRadius: 16, padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 12,
          boxShadow: `0 8px 32px rgba(0,0,0,.6),0 0 0 1px ${C.accent}22`,
          animation: "slideInToast 0.35s cubic-bezier(0.34,1.2,0.64,1)",
          pointerEvents: "all", maxWidth: isMobile ? "100%" : 360, width: isMobile ? "100%" : "auto",
        }}>
          <img src={req.sender_avatar} alt="" style={{ width: 42, height: 42, borderRadius: "50%", border: `2px solid ${C.accent}`, flexShrink: 0, objectFit: "cover" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>Follow Request</div>
            <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <span style={{ color: C.accent, fontWeight: 600 }}>{req.sender_display_name || req.sender_username}</span>{" "}wants to follow you
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={() => onAccept(req)} style={{ padding: "6px 12px", borderRadius: 8, background: `linear-gradient(135deg,${C.accent},${C.accent2 || C.accent})`, border: "none", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ Accept</button>
            <button onClick={() => onReject(req)} style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,.07)", border: `1px solid ${C.border}`, color: C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
          </div>
        </div>
      ))}
      <style>{`@keyframes slideInToast{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  );
}

function UserFollowCard({ user, initialFollowed = false, initialRequested = false }) {
  const { session, setTab, setActiveProfile, setAuthModal, showToast } = useApp();

  const [followed, setFollowed] = useState(initialFollowed);
  const [requested, setRequested] = useState(initialRequested);
  const [loading, setLoading] = useState(false);
  const [hov, setHov] = useState(false);
  const isMobile = useIsMobile();

  const username = user.username || "anonymous";
  const avatar = user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  const displayName = user.display_name || username;

  // Generate a distinct theme color based on username for the banner
  const coverColor = `hsl(${(username.length * 55) % 360}, 60%, 25%)`;

  const handleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) return setAuthModal("login");
    if (loading || followed) return;

    // OPTIMISTIC UPDATE
    const wasRequested = requested;
    setRequested(!wasRequested);
    setLoading(true);

    try {
      if (wasRequested) {
        const res = await followAPI.cancelFollowRequest(session.user.id, user.id);
        if (res && res.success === false) setRequested(true);
      } else {
        await followAPI.sendFollowRequest(session.user.id, user.id);
      }
    } catch (err) {
      setRequested(wasRequested);
      showToast("Connection error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onMouseEnter={() => !isMobile && setHov(true)}
      onMouseLeave={() => !isMobile && setHov(false)}
      onClick={() => { setActiveProfile(user); setTab(`profile:${username}`); }}
      style={{
        flexShrink: 0,
        width: 140, // Slightly wider for the new design
        background: C.bg2,
        borderRadius: 20,
        border: `1px solid ${hov ? C.accent + "88" : C.border}`,
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: hov ? "translateY(-6px)" : "none",
        boxShadow: hov ? `0 12px 24px rgba(0,0,0,0.5)` : "none",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* 1. Mini Banner Area */}
      <div style={{
        height: 40,
        background: `linear-gradient(45deg, ${coverColor}, ${C.bg3})`,
        position: "relative"
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
          animation: "glass-shine 3s infinite"
        }} />
      </div>

      <div style={{ padding: "0 10px 14px", marginTop: -25, flex: 1 }}>
        {/* 2. Avatar Area */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: 8 }}>
          <img
            src={avatar}
            alt={username}
            style={{
              width: 56, height: 56, borderRadius: "50%",
              background: C.bg2,
              border: `3px solid ${followed ? "#4caf50" : C.bg2}`,
              padding: 2,
              transition: "all 0.3s",
              objectFit: "cover",
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)"
            }}
          />
          {user.is_verified && (
            <div style={{
              position: "absolute", bottom: 2, right: 0,
              background: C.bg, borderRadius: "50%", padding: 1
            }}>
              <VerifiedBadge size={14} />
            </div>
          )}
        </div>

        {/* 3. User Info */}
        <div style={{
          fontSize: 12, fontWeight: 800, color: C.text,
          marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
        }}>
          {displayName}
        </div>

        <div style={{
          fontSize: 10, color: C.muted, fontWeight: 600, marginBottom: 8
        }}>
          @{username.toLowerCase()}
        </div>

        {/* 4. Only Follower Count Stat */}
        <div style={{
          fontSize: 11, fontWeight: 700, color: C.accent,
          background: "rgba(255,255,255,0.03)",
          padding: "4px 0", borderRadius: 8, marginBottom: 10,
          border: `1px solid ${C.border}`
        }}>
          {fmtNum(user.followers_count || 0)} <span style={{ fontSize: 9, opacity: 0.7 }}>fans</span>
        </div>

        {/* 5. Follow Button */}
        <button
          onClick={handleFollow}
          disabled={loading || followed}
          style={{
            width: "100%", padding: "7px 0", borderRadius: 10,
            background: followed ? C.bg3 : requested ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${C.accent}, ${C.accent2 || C.accent})`,
            border: (followed || requested) ? `1px solid ${C.border}` : "none",
            color: (followed || requested) ? C.text : "white",
            fontSize: 10, fontWeight: 800,
            cursor: (loading || followed) ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            opacity: loading ? 0.7 : 1,
            fontFamily: "inherit"
          }}
        >
          {loading ? "..." : followed ? "✓ Following" : requested ? "✕ Cancel" : "+ Follow"}
        </button>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
function UserSuggestions({ onSeeAll }) {
  const { session, authLoading } = useApp();
  const [ready, setReady] = useState(false);
  const [creators, setCreators] = useState([]);
  const [followingSet, setFollowingSet] = useState(new Set());
  const [requestedSet, setRequestedSet] = useState(new Set());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // START public fetch immediately, don't wait for auth
        const creatorsPromise = followAPI.getRandomCreators(30);

        // Only fetch private data if we actually have a session
        const uid = session?.user?.id;
        const followingPromise = uid ? followAPI.getFollowingIds(uid) : Promise.resolve([]);
        const pendingPromise = uid
          ? supabase.from("follow_requests")
            .select("recipient_id")
            .eq("sender_id", uid)
            .eq("status", "pending")
            .then(r => (r.data || []).map(x => x.recipient_id))
          : Promise.resolve([]);

        const [allCreators, followingIds, pendingReqs] = await Promise.all([
          creatorsPromise,
          followingPromise,
          pendingPromise
        ]);

        if (cancelled) return;

        const fSet = new Set(followingIds);
        const rSet = new Set(pendingReqs);
        const filtered = allCreators
          .filter(u => u.id !== uid && !fSet.has(u.id))
          .slice(0, 20);

        setCreators(filtered);
        setFollowingSet(fSet);
        setRequestedSet(rSet);
      } catch (err) {
        console.error("UserSuggestions load error:", err);
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    // Only run if auth check is finished OR if we already have a session
    if (!authLoading || session?.user) {
      load();
    }

    return () => { cancelled = true; };
  }, [authLoading, session?.user?.id]);

  if (authLoading || !ready) return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 13, fontWeight: 800, paddingBottom: 12, marginBottom: 4, borderBottom: `1px solid ${C.border}`, color: C.text }}>🌟 Suggested Creators</div>
      <div style={{ display: "flex", gap: 15, overflowX: "auto", scrollbarWidth: "none", padding: "10px 0" }}>
        {Array(5).fill(0).map((_, i) => <SkeletonUserCard key={i} />)}
      </div>
    </div>
  );

  if (!creators.length) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <SectionHeader title="🌟 Suggested Creators" action={onSeeAll} actionLabel="See all" />
      <div style={{ display: "flex", gap: 15, overflowX: "auto", scrollbarWidth: "none", padding: "10px 0" }}>
        {creators.map(user => (
          <UserFollowCard
            key={user.id}
            user={user}
            initialFollowed={followingSet.has(user.id)}
            initialRequested={requestedSet.has(user.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// useFollowRequests HOOK  — realtime incoming follow request management
// ─────────────────────────────────────────────────────────────────────────────
function useFollowRequests(session, showToast) {
  const [pendingRequests, setPendingRequests] = useState([]);

  // Load existing pending on mount
  useEffect(() => {
    if (!session?.user?.id) return;
    followAPI.getPendingRequests(session.user.id).then(setPendingRequests).catch(() => { });
  }, [session?.user?.id]);

  // Realtime subscription
  useEffect(() => {
    if (!session?.user?.id) return;
    const ch = followAPI.subscribeToFollowRequests(session.user.id, (newReq) => {
      setPendingRequests(prev => prev.find(r => r.id === newReq.id) ? prev : [newReq, ...prev]);
    });
    return () => supabase.removeChannel(ch);
  }, [session?.user?.id]);

  const handleAccept = useCallback(async (req) => {
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    try {
      await followAPI.acceptFollowRequest(req.id, req.sender_id, session.user.id);
      showToast(`✅ Now connected with ${req.sender_display_name || req.sender_username}!`, "success");
    } catch (err) {
      setPendingRequests(prev => [req, ...prev]);
      showToast("Failed to accept request", "error");
    }
  }, [session?.user?.id, showToast]);

  const handleReject = useCallback(async (req) => {
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    try {
      await followAPI.rejectFollowRequest(req.id);
    } catch { setPendingRequests(prev => [req, ...prev]); }
  }, []);

  return { pendingRequests, handleAccept, handleReject };
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER CHIPS
// ─────────────────────────────────────────────────────────────────────────────
const CONTENT_FILTERS = [
  { label: "All", value: "all" },
  { label: "🔥 Hot", value: "hot" },
  { label: "✨ New", value: "new" },
  { label: "👑 VIP", value: "vip" },
  { label: "Free", value: "free" },
];

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage({ tab, catFilter, setCatFilter, filter, setFilter }) {
  const { session, playVideo, setTab, showToast, authLoading } = useApp();
  const isMobile = useIsMobile();

  // ── Video state ───────────────────────────────────────────────────────────
  const [videos, setVideos] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  //const [filter, setFilter] = useState("all");
  //const [catFilter, setCatFilter] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 30;

  // ── Category state (fetched from DB) ─────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // ── Infinite scroll sentinel ──────────────────────────────────────────────
  const sentinelRef = useRef(null);

  // ── Follow request system ─────────────────────────────────────────────────
  const { pendingRequests, handleAccept, handleReject } = useFollowRequests(session, showToast);




  // ... inside HomePage component
  useEffect(() => {
    const handlePopUnder = (e) => {
      const last = localStorage.getItem('last_pop_time');
      const now = Date.now();

      if (!last || (now - parseInt(last)) > AD_CONFIG.COOLDOWN) {
        const adUrl = getAdLink();
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
          // --- MOBILE FRIENDLY "TAB-UNDER" ---
          // 1. Open your website in a new background tab
          window.open(window.location.href, '_blank');
          // 2. Redirect the CURRENT tab to the Ad (No popup blocker can stop this)
          window.location.href = adUrl;
        } else {
          // --- STANDARD DESKTOP POP-UNDER ---
          const link = document.createElement('a');
          link.href = adUrl;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        localStorage.setItem('last_pop_time', now.toString());
        window.removeEventListener('click', handlePopUnder);
      }
    };
    // Attach listener to the whole window
    window.addEventListener('click', handlePopUnder);

    return () => window.removeEventListener('click', handlePopUnder);
  }, []);


  // ── Scroll to top on tab/filter change ────────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab, catFilter]); // Removed 'filter' from here

  // ── Saved video update event ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (tab === "saved" && !e.detail.isSaved) setVideos(prev => prev.filter(v => v.id !== e.detail.videoId));
    };
    window.addEventListener('video_save_updated', handler);
    return () => window.removeEventListener('video_save_updated', handler);
  }, [tab]);

  // ── Fetch categories from DB ──────────────────────────────────────────────
  useEffect(() => {
    setCategoriesLoading(true);
    videoAPI.getCategories()
      .then(cats => setCategories(cats))
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
  }, []);

  // ── Fetch trending for hero banner ────────────────────────────────────────
  useEffect(() => {
    if (tab === "home") {
      videoAPI.getTrending(8).then(setTrending).catch(() => { });
    }
  }, [tab]);

  const loadVideos = useCallback(async (reset = false) => {
    const isFirstLoad = reset;
    if (isFirstLoad) setLoading(true);
    else setLoadingMore(true);

    try {
      const nextPage = reset ? 0 : page;
      let data = [];

      // 1. HANDLE PRIVATE TABS (History / Saved)
      // These do not use the Universal Feed because they are private collections
      if (tab === "history") {
        if (session?.user?.id) {
          data = await historyAPI.getHistory(session.user.id);
        }
        setVideos(data);
        setHasMore(false);
        return;
      }

      if (tab === "saved") {
        if (session?.user?.id) {
          data = await likeAPI.getSaved(session.user.id);
        }
        setVideos(data);
        setHasMore(false);
        return;
      }

      // 2. UNIVERSAL FEED LOGIC (Home / Trending / New / Search)
      // This calls your PostgreSQL RPC which handles: 
      // Friends First -> Viral Fill -> Category Filter -> Content Filter (VIP/Hot/etc)
      data = await videoAPI.getUniversalFeed(
        session?.user?.id || null, // If null, the SQL automatically skips "Friends" tiers
        nextPage,
        LIMIT,
        catFilter, // Unique category from your DB
        filter     // 'all', 'hot', 'new', 'vip', 'free'
      );

      // 3. UPDATE STATE
      if (reset) {
        setVideos(data);
        setPage(nextPage + 1); // Next page will be 1
      } else {
        setVideos(prev => [...prev, ...data]);
        setPage(p => p + 1);
      }

      // If we got fewer videos than the LIMIT, we've reached the end
      setHasMore(data.length === LIMIT);

    } catch (err) {
      console.error("loadVideos error:", err);
      showToast("Failed to load feed", "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tab, page, session, catFilter, filter, LIMIT, showToast]);


  // Reset + reload when tab, catFilter, or the sub-filter changes
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    loadVideos(true);
  }, [tab, catFilter, filter]); // Added 'filter' here

  // ── IntersectionObserver for infinite scroll ──────────────────────────────
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !loading && !loadingMore) loadVideos(false); },
      { rootMargin: "300px" }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading, loadingMore, loadVideos]);

  // ── Client-side filter (hot/new/vip/free) applied to already-loaded videos ─
  // Replace the complex useMemo with a simple assignment
  const displayed = videos;

  // History handlers
  const handleDeleteHistory = async (e, historyId) => {
    e.stopPropagation();
    const { error } = await historyAPI.deleteHistoryItem(historyId);
    if (!error) setVideos(prev => prev.filter(v => v.historyId !== historyId));
  };
  const handleClearAll = async () => {
    if (window.confirm("Clear your entire watch history?")) {
      const { error } = await historyAPI.clearAllHistory(session.user.id);
      if (!error) setVideos([]);
    }
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Follow request toasts */}
      <FollowRequestToast requests={pendingRequests} onAccept={handleAccept} onReject={handleReject} isMobile={isMobile} />

      {/* Hero banner — only on home with no category filter */}
      {tab === "home" && !catFilter && <HeroBanner items={trending} />}

      {/* Active category badge */}
      {catFilter && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "12px 16px", background: C.bg3, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 20 }}>{catIcon(catFilter)}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text, textTransform: "capitalize" }}>{catFilter}</span>
          <button onClick={() => { setCatFilter(null); setFilter("all"); }} style={{ marginLeft: "auto", background: C.accent, border: "none", borderRadius: 999, color: "white", padding: "4px 12px", fontSize: 12, cursor: "pointer" }}>Clear ✕</button>
        </div>
      )}

      {tab === "home" && !catFilter && (
        <>
          {/* Suggested creators */}
          <UserSuggestions onSeeAll={() => setTab("channels")} />

          {/* Trending horizontal scroll */}
          {trending.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <SectionHeader title="🔥 Trending Now" action={() => setTab("trending")} actionLabel="See all" />
              <HScroll hideArrows={isMobile}>
                {trending.map(v => <VideoCard key={v.id} video={v} cardWidth={isMobile ? 200 : 260} />)}
              </HScroll>
            </div>
          )}
        </>
      )}

      {tab === "home" && !catFilter && (
        <div style={{ marginBottom: 20 }}>
          {/* Added the action and actionLabel props to the SectionHeader */}
          <SectionHeader
            title="🏷 Browse Categories"
            action={() => setTab("categories")}
            actionLabel="See all"
          />

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))",
            gap: 10
          }}>


            {/* OTHER DB CATEGORIES */}
            {categories.slice(0, 11).map(name => (
              <CategoryCard
                key={name}
                name={name}
                onClick={() => setCatFilter(name)}
              />
            ))}
          </div>
        </div>
      )}



      {/* CONTENT FILTERS (Hot, New, VIP, Free) */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {CONTENT_FILTERS.map(f => (
          <FilterChip
            key={f.value}
            label={f.label}
            active={filter === f.value}
            onClick={() => setFilter(f.value)}
          />
        ))}
      </div>

      {/* Section header */}
      <div style={{ marginTop: isMobile && tab !== "home" ? 20 : 0, padding: isMobile ? "0 4px" : 0 }}>
        <SectionHeader
          title={
            tab === "history" ? "🕒 Watch History" :
              tab === "trending" ? "🔥 Trending Videos" :
                tab === "new" ? "✨ New Videos" :
                  tab === "saved" ? "❤️ Saved Videos" :
                    catFilter ? `${catIcon(catFilter)} ${catFilter}` : "🎬 All Videos"
          }
          action={tab === "history" && videos.length > 0 ? handleClearAll : null}
          actionLabel={tab === "history" && videos.length > 0 ? "Clear All" : null}
        />
      </div>

      {/* Empty state */}
      {!loading && displayed.length === 0 ? (
        <EmptyState
          emoji={tab === "saved" ? "💔" : tab === "history" ? "🕒" : "🔍"}
          title={tab === "saved" ? "No saved videos" : tab === "history" ? "No history yet" : "No videos found"}
        />
      ) : (
        <>
          {tab === "history" ? (
            loading && !videos.length
              ? <VideoGrid videos={[]} loading={true} isMobile={isMobile} />
              : <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fill,minmax(280px,1fr))", gap: isMobile ? 10 : 20 }}>
                {displayed.map(video => (
                  <div key={video.historyId || video.id} style={{ position: "relative", cursor: "pointer" }} onClick={() => playVideo(video)}>
                    <button onClick={e => handleDeleteHistory(e, video.historyId)} style={{ position: "absolute", top: 8, left: 8, zIndex: 10, background: "rgba(0,0,0,.7)", border: "none", borderRadius: "50%", width: 28, height: 28, color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✕</button>
                    <VideoCard video={video} />
                    <div style={{ marginTop: 8, padding: "0 4px" }}>
                      <div style={{ fontSize: 12, color: C.text, fontWeight: 600, marginBottom: 4 }}>{video.title}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted }}>
                        <span>{fmtNum(video.views || 0)} views</span>
                        <span>{video.watched_at ? new Date(video.watched_at).toLocaleDateString() : ""}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          ) : (
            <VideoGrid videos={displayed} loading={loading && !videos.length} isMobile={isMobile} />
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} style={{ height: 1 }} />

          {/* Loading more indicator */}
          {loadingMore && (
            <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, animation: `pulse 1.2s ${i * .2}s infinite` }} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
