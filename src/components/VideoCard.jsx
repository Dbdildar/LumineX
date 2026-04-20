import { useState, useRef, useEffect } from "react";
import { C, Avatar, VipBadge, VerifiedBadge, fmtNum, timeAgo } from "./ui/index";
import { useApp } from "../context/AppContext";
import { useIsMobile, useVideoLike } from "../hooks/index";
import { likeAPI, videoAPI } from "../lib/supabase";

export default function VideoCard({ video, cardWidth, compact, showViews, showChannel = true, isOwner }) {
  // 1. Define Refs and ID first
  const instanceId = useRef(Math.random().toString(36).substr(2, 9)).current;
  const vRef = useRef(null);
  const lpRef = useRef(null);   
  const tickRef = useRef(null); 
  const stopRef = useRef(null); 
  const longPressTriggered = useRef(false);
  const touchStartPos = useRef({ x: 0, y: 0 });

  const { setTab, playVideo, setActiveProfile, session, showToast } = useApp();
  const isMobile = useIsMobile();

  // 2. State
  const [active, setActive] = useState(false);
  const [hov, setHov] = useState(false);
  const [prog, setProg] = useState(0);
  const [lpProg, setLpProg] = useState(0);
  const [lpOn, setLpOn] = useState(false);
  const [currentViews, setCurrentViews] = useState(video.views_count || video.views || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saved, setSaved] = useState(false);

  const { liked, count: likeCount, toggle: toggleLike } = useVideoLike(video.id, false, video.likes_count);

  // ── Saved state logic ──────────────────────────────────────────
  useEffect(() => {
    if (session?.user?.id) likeAPI.isSaved(session.user.id, video.id).then(setSaved);
  }, [video.id, session?.user?.id]);

  const handleSaveToggle = async (e) => {
    e.stopPropagation();
    if (!session) return showToast("Please login to save videos", "info");
    try {
      const next = !saved;
      await likeAPI.toggleSave(session.user.id, video.id, saved);
      setSaved(next);
      window.dispatchEvent(new CustomEvent("video_save_updated", { detail: { videoId: video.id, isSaved: next } }));
      showToast(next ? "Video saved!" : "Removed from saved", "success");
    } catch { showToast("Failed to update saved videos", "error"); }
  };

  useEffect(() => {
    const h = (e) => { if (e.detail.videoId === video.id) setSaved(e.detail.isSaved); };
    window.addEventListener("video_save_updated", h);
    return () => window.removeEventListener("video_save_updated", h);
  }, [video.id]);

  // ── Delete logic ───────────────────────────────────────────────
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!session?.user?.id) return showToast("Please login", "error");
    if (video.user_id !== session.user.id) return showToast("Unauthorized", "error");
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await videoAPI.delete(video.id);
      showToast("Video deleted permanently", "success");
      window.dispatchEvent(new CustomEvent("video_deleted", { detail: { videoId: video.id } }));
      setShowMenu(false); setConfirmDelete(false);
    } catch (err) {
      showToast(err.message || "Failed to delete video", "error");
    } finally { setIsDeleting(false); }
  };

  // ── View count sync ────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => { if (e.detail.videoId === video.id) setCurrentViews(e.detail.views); };
    window.addEventListener("video_view_updated", h);
    return () => window.removeEventListener("video_view_updated", h);
  }, [video.id]);

  // ── Video playback helpers ────────────────────────────────────────────────
  function startPreview() {
    const v = vRef.current; 
    if (!v) return;

    window.dispatchEvent(new CustomEvent("stop_all_previews", {
      detail: { videoId: video.id, instanceId: instanceId }
    }));

    v.muted = true;
    v.volume = 0;
    v.currentTime = 0;
    v.play().then(() => setActive(true)).catch(() => { });
  }

  function stopPreview() {
    const v = vRef.current; 
    if (!v) return;
    v.pause(); 
    v.currentTime = 0;
    setActive(false); 
    setProg(0); 
    setHov(false);
  }

  // ── FIX: Auto-play when video element mounts ──────────────────────────────
  useEffect(() => {
    if (hov && isMobile && vRef.current) {
      startPreview();
    }
  }, [hov, isMobile]);

  // ── Global Preview Control ────────────────────────────────────────────────
  useEffect(() => {
    const handleStopOthers = (e) => {
      if (e.detail.instanceId !== instanceId && hov) {
        stopPreview();
      }
    };
    window.addEventListener("stop_all_previews", handleStopOthers);
    return () => window.removeEventListener("stop_all_previews", handleStopOthers);
  }, [instanceId, hov]);

  // ── Progress tracker ─────────────────────────────────────────────────────
  useEffect(() => {
    const v = vRef.current; if (!v) return;
    const fn = () => v.duration && setProg((v.currentTime / v.duration) * 100);
    v.addEventListener("timeupdate", fn);
    return () => v.removeEventListener("timeupdate", fn);
  }, [hov]); // Re-bind when video mounts/unmounts

  // ── Mobile Long-Press Logic ──────────────────────────────────────────────
  function onTouchStart(e) {
    if (!isMobile) return;
    const t = e.touches[0];
    touchStartPos.current = { x: t.clientX, y: t.clientY };
    longPressTriggered.current = false;
    clearTimeout(stopRef.current);

    setLpOn(true); 
    setLpProg(0);
    const t0 = Date.now();
    tickRef.current = setInterval(() => setLpProg(Math.min((Date.now() - t0) / 6, 100)), 16);

    lpRef.current = setTimeout(() => {
      if (longPressTriggered.current) return;
      longPressTriggered.current = true;
      clearInterval(tickRef.current);
      setLpOn(false);
      setHov(true); // Trigger re-render to mount <video>
    }, 600);
  }

  function onTouchMove(e) {
    if (!isMobile) return;
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - touchStartPos.current.x);
    const dy = Math.abs(t.clientY - touchStartPos.current.y);
    if (dx > 15 || dy > 15) {
      clearTimeout(lpRef.current);
      clearInterval(tickRef.current);
      setLpOn(false); 
      setLpProg(0);
    }
  }

  function onTouchEnd() {
    if (!isMobile) return;
    clearTimeout(lpRef.current);
    clearInterval(tickRef.current);
    setLpOn(false); 
    setLpProg(0);

    if (longPressTriggered.current) {
      stopRef.current = setTimeout(() => {
        stopPreview();
        longPressTriggered.current = false;
      }, 1200);
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => () => {
    clearTimeout(lpRef.current);
    clearTimeout(stopRef.current);
    clearInterval(tickRef.current);
  }, []);

  const pf = video.profiles || { username: video.channel || "Unknown" };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    window.scrollTo(0, 0);
    setActiveProfile(pf);
    setTab(`profile:${pf.username}`);
  };

  const handleCardClick = () => {
    if (isMobile && longPressTriggered.current) {
      clearTimeout(stopRef.current);
      stopPreview();
      longPressTriggered.current = false;
      playVideo(video);
      return;
    }
    if (!lpOn) playVideo(video);
  };

  const truncateTitle = (str = "", max = 52) =>
    str.length > max ? str.slice(0, max).trimEnd() + "…" : str;

  return (
    <div
      onClick={handleCardClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
      style={{
        background: hov ? C.cardH : C.card,
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        border: `1px solid ${hov ? "var(--accent)44" : C.border}`,
        transform: hov ? "translateY(-4px) scale(1.012)" : "none",
        transition: "all .3s ease",
        boxShadow: hov ? `0 20px 50px rgba(0,0,0,.5),0 0 40px var(--accent)12` : `0 2px 12px rgba(0,0,0,.2)`,
        width: cardWidth || "100%",
        position: "relative",
        WebkitTapHighlightColor: "transparent",
        touchAction: "pan-y",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden", background: "#111" }}>
        <img
          src={video.thumbnail_url || `https://picsum.photos/640/360?random=${video.id}`}
          alt={video.title}
          loading="lazy"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", zIndex: 1,
            opacity: active ? 0 : 1, transition: "opacity .35s ease",
          }}
        />

        {hov && isMobile && (
          <video
            ref={vRef}
            src={video.video_url}
            muted playsInline loop preload="auto"
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", zIndex: 2,
              opacity: active ? 1 : 0, transition: "opacity .4s",
            }}
          />
        )}

        {isMobile && lpOn && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 10,
            background: "rgba(0,0,0,.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ position: "relative", width: 72, height: 72 }}>
              <svg width={72} height={72} style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}>
                <circle cx={36} cy={36} r={30} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={4} />
                <circle cx={36} cy={36} r={30} fill="none" stroke="var(--accent)"
                  strokeWidth={4} strokeLinecap="round"
                  strokeDasharray={`${lpProg * 1.885} 188.5`} />
              </svg>
            </div>
          </div>
        )}

        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
          background: "rgba(255,255,255,.1)", zIndex: 6, opacity: active ? 1 : 0,
        }}>
          <div style={{
            height: "100%", background: `linear-gradient(90deg,${C.accent},${C.accent2})`,
            width: `${prog}%`, transition: "width .12s linear",
          }} />
        </div>

        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4, zIndex: 5 }}>
          {video.is_vip && <VipBadge small />}
        </div>

        {!compact && (
          <div style={{ position: "absolute", top: 8, right: 8, zIndex: 15 }}>
            <button
              onClick={e => {
                e.stopPropagation();
                if (isOwner) { setShowMenu(!showMenu); setConfirmDelete(false); }
                else handleSaveToggle(e);
              }}
              style={{
                background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%",
                width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                opacity: (isMobile ? (saved || hov) : 1) ? 1 : 0, color: isOwner ? "white" : (saved ? C.accent : "white"),
              }}
            >
              {isOwner ? "⋮" : (saved ? "🔖" : "📑")}
            </button>
          </div>
        )}
      </div>

      {!compact && showChannel && (
        <div style={{ padding: "10px 12px 12px" }}>
          <div onClick={(e) => { e.stopPropagation(); playVideo(video); }} style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.3, marginBottom: 10 }}>
            {truncateTitle(video.title, 50)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div onClick={handleProfileClick} style={{ cursor: "pointer" }}>
              <Avatar profile={pf} size={32} />
            </div>
            <div onClick={handleProfileClick} style={{ flex: 1, cursor: "pointer", minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.accent, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {pf.display_name || pf.username}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{fmtNum(currentViews)} views</span>
              <span style={{ fontSize: 10, color: C.muted }}>{timeAgo(video.created_at)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
