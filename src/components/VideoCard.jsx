import { useState, useRef, useEffect } from "react";
import { C, Avatar, VipBadge, VerifiedBadge, fmtNum, timeAgo } from "./ui/index";
import { useApp } from "../context/AppContext";
import { useIsMobile, useVideoLike } from "../hooks/index";
import { likeAPI, videoAPI } from "../lib/supabase";

// ── Animated 3-dots loader (xmaster-style) ───────────────────────────────────
function ThreeDotsLoader() {
  return (
    <>
      <style>{`
        @keyframes lpDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%            { transform: scale(1.15); opacity: 1; }
        }
        .lp-dot { 
          width: 9px; height: 9px; border-radius: 50%;
          background: white; display: inline-block;
          animation: lpDot 1.1s ease-in-out infinite;
        }
        .lp-dot:nth-child(1) { animation-delay: 0s; }
        .lp-dot:nth-child(2) { animation-delay: 0.18s; }
        .lp-dot:nth-child(3) { animation-delay: 0.36s; }
      `}</style>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 7, padding: "10px 18px",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(8px)",
        borderRadius: 30,
        border: "1px solid rgba(255,255,255,0.18)",
      }}>
        <span className="lp-dot" />
        <span className="lp-dot" />
        <span className="lp-dot" />
      </div>
    </>
  );
}

export default function VideoCard({ video, cardWidth, compact, showViews, showChannel = true, isOwner }) {
  const { setTab, playVideo, setActiveProfile, session, showToast } = useApp();
  const isMobile = useIsMobile();
  const vRef      = useRef(null);
  const timerRef  = useRef(null);   // hover delay timer
  const lpRef     = useRef(null);   // long-press trigger timer
  const tickRef   = useRef(null);   // lp progress ticker
  const stopRef   = useRef(null);   // stop-preview timer (mobile release)

  const [active,   setActive]   = useState(false);  // video is actually playing
  const [hov,      setHov]      = useState(false);  // hover/preview state
  const [prog,     setProg]     = useState(0);       // playback progress %
  const [lpProg,   setLpProg]   = useState(0);       // long-press circle progress
  const [lpOn,     setLpOn]     = useState(false);   // long-press charging UI
  const [currentViews, setCurrentViews] = useState(video.views_count || video.views || 0);

  const { liked, count: likeCount, toggle: toggleLike } = useVideoLike(video.id, false, video.likes_count);
  const [showMenu,     setShowMenu]     = useState(false);
  const [confirmDelete,setConfirmDelete]= useState(false);
  const [isDeleting,   setIsDeleting]   = useState(false);
  const [saved,        setSaved]        = useState(false);

  // ── long-press state refs (avoids stale closures in touch handlers) ─────────
  const longPressTriggered = useRef(false);
  const touchStartPos      = useRef({ x: 0, y: 0 });

  // ── Saved state ──────────────────────────────────────────────────────────────
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

  // ── Delete ───────────────────────────────────────────────────────────────────
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

  // ── View count sync ───────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => { if (e.detail.videoId === video.id) setCurrentViews(e.detail.views); };
    window.addEventListener("video_view_updated", h);
    return () => window.removeEventListener("video_view_updated", h);
  }, [video.id]);

  // ── Video playback helpers ────────────────────────────────────────────────────
  function startPreview() {
    const v = vRef.current; if (!v) return;
    v.muted = true; v.volume = 0; v.currentTime = 0;
    v.play().then(() => setActive(true)).catch(() => {});
  }

  function stopPreview() {
    const v = vRef.current; if (!v) return;
    v.pause(); v.currentTime = 0;
    setActive(false); setProg(0); setHov(false);
  }

  // ── Progress tracker ─────────────────────────────────────────────────────────
  useEffect(() => {
    const v = vRef.current; if (!v) return;
    const fn = () => v.duration && setProg((v.currentTime / v.duration) * 100);
    v.addEventListener("timeupdate", fn);
    return () => v.removeEventListener("timeupdate", fn);
  }, []);

  // ── Desktop: hover preview ────────────────────────────────────────────────────
  function onEnter() {
    if (isMobile) return;
    setHov(true);
    timerRef.current = setTimeout(startPreview, 350);
  }
  function onLeave() {
    if (isMobile) return;
    clearTimeout(timerRef.current);
    setHov(false);
    stopPreview();
  }

  // ── Mobile: xmaster-style long-press preview ─────────────────────────────────
  // Phase 1: finger down → start charging ring (600 ms)
  // Phase 2: ring completes → swap thumbnail for video, play muted
  // Phase 3: finger up → stop preview (with 1.2s grace so a quick flick doesn't
  //          kill it immediately; matches xmaster feel). If no preview triggered,
  //          treat as a regular tap → open player.
  function onTouchStart(e) {
    if (!isMobile) return;
    // Don't call e.preventDefault() here — we still want scroll to work if the
    // user moves. We detect movement in onTouchMove and cancel if needed.
    const t = e.touches[0];
    touchStartPos.current = { x: t.clientX, y: t.clientY };
    longPressTriggered.current = false;
    clearTimeout(stopRef.current);

    // Start the visual charging ring
    setLpOn(true); setLpProg(0);
    const t0 = Date.now();
    tickRef.current = setInterval(() => setLpProg(Math.min((Date.now() - t0) / 6, 100)), 16);

    // After 600 ms trigger the preview
    lpRef.current = setTimeout(() => {
      longPressTriggered.current = true;
      clearInterval(tickRef.current);
      setLpOn(false);
      setHov(true);
      startPreview();
    }, 600);
  }

  function onTouchMove(e) {
    if (!isMobile) return;
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - touchStartPos.current.x);
    const dy = Math.abs(t.clientY - touchStartPos.current.y);
    // If user is scrolling, cancel the long-press entirely
    if (dx > 10 || dy > 10) {
      clearTimeout(lpRef.current);
      clearInterval(tickRef.current);
      setLpOn(false); setLpProg(0);
      // Don't reset longPressTriggered — if preview already started, let it live
    }
  }

  function onTouchEnd() {
    if (!isMobile) return;
    clearTimeout(lpRef.current);
    clearInterval(tickRef.current);
    setLpOn(false); setLpProg(0);

    if (longPressTriggered.current) {
      // Preview is playing — stop it after a short grace period
      stopRef.current = setTimeout(() => {
        stopPreview();
        longPressTriggered.current = false;
      }, 1200);
      return;
    }
    // Normal tap → open player (handled by onClick)
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────────
  useEffect(() => () => {
    clearTimeout(timerRef.current);
    clearTimeout(lpRef.current);
    clearTimeout(stopRef.current);
    clearInterval(tickRef.current);
  }, []);

  // ── Profile / click routing ───────────────────────────────────────────────────
  const pf = video.profiles || { username: video.channel || "Unknown" };

  // Only profile icon + username text navigate to profile
  const handleProfileClick = (e) => {
    e.stopPropagation();
    window.scrollTo(0, 0);
    setActiveProfile(pf);
    setTab(`profile:${pf.username}`);
  };

  // Card-level click → open player (unless long-press preview was active)
  const handleCardClick = () => {
    if (isMobile && longPressTriggered.current) {
      // Second tap while preview is live → open player normally
      clearTimeout(stopRef.current);
      stopPreview();
      longPressTriggered.current = false;
      playVideo(video);
      return;
    }
    if (!lpOn) playVideo(video);
  };

  // Truncate title to N chars
  const truncateTitle = (str = "", max = 52) =>
    str.length > max ? str.slice(0, max).trimEnd() + "…" : str;

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
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
        boxShadow: hov
          ? `0 20px 50px rgba(0,0,0,.5),0 0 40px var(--accent)12`
          : `0 2px 12px rgba(0,0,0,.2)`,
        width: cardWidth || "100%",
        position: "relative",
        WebkitTapHighlightColor: "transparent",
        touchAction: "pan-y", // allow vertical scroll but detect hold
      }}
    >
      {/* ── Thumbnail + video preview layer ── */}
      <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden", background: "#111" }}>

        {/* Thumbnail — always rendered, fades out when video is active */}
        <img
          src={video.thumbnail_url || `https://picsum.photos/640/360?random=${String(video.id).charCodeAt(0) || 1}`}
          alt={video.title}
          loading="lazy"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover",
            transform: hov ? "scale(1.06)" : "scale(1)",
            transition: "transform .5s ease, opacity .35s ease",
            zIndex: 1,
            // Fade out thumbnail once video is playing
            opacity: active ? 0 : 1,
          }}
        />

        {/* Video preview — always in DOM when hov, hidden until canplay */}
        {hov && (
          <video
            ref={vRef}
            src={video.video_url}
            muted
            playsInline
            loop
            preload="auto"
            onCanPlay={e => {
              e.target.muted = true;
              e.target.volume = 0;
              e.target.play().then(() => setActive(true)).catch(() => {});
            }}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", zIndex: 2,
              opacity: active ? 1 : 0,
              transition: "opacity .4s",
            }}
          />
        )}

        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none",
          background: "linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 55%)",
          opacity: hov ? 1 : 0, transition: "opacity .3s",
        }} />

        {/* ── Long-press charging ring (mobile only) ── */}
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
              {/* 3-dots inside ring while charging */}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ThreeDotsLoader />
              </div>
            </div>
          </div>
        )}

        {/* ── Preview active on mobile: animated 3-dots indicator (no stop button) ── */}
        {/* xmaster style: just show animated dots at bottom, tap again to open player */}
        {isMobile && active && !lpOn && (
          <div style={{
            position: "absolute", bottom: 12, left: "50%",
            transform: "translateX(-50%)",
            zIndex: 12, pointerEvents: "none",
          }}>
            <ThreeDotsLoader />
          </div>
        )}

        {/* Desktop: loading spinner while video not yet active */}
        {!isMobile && hov && !active && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "var(--accent)cc",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, color: "white",
              boxShadow: "0 0 0 8px var(--accent)33",
              animation: "pulseRing 1.5s infinite",
            }}>▶</div>
          </div>
        )}

        {/* Badges */}
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4, zIndex: 5 }}>
          {video.is_vip && <VipBadge small />}
        </div>

        {/* Duration badge */}
        <div style={{
          position: "absolute", bottom: 8, right: 8, zIndex: 5,
          background: "rgba(0,0,0,.85)", color: "white",
          fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
        }}>{video.duration || ""}</div>

        {/* Save / owner menu button */}
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
                width: 30, height: 30, cursor: "pointer", fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: hov || saved || isOwner ? 1 : 0,
                transition: "opacity .2s",
                color: isOwner ? "white" : (saved ? C.accent : "white"),
              }}
            >
              {isOwner ? <span style={{ fontSize: 20, fontWeight: 900 }}>⋮</span>
                : (saved ? "🔖" : "📑")}
            </button>

            {isOwner && showMenu && (
              <div onClick={e => e.stopPropagation()} style={{
                position: "absolute", top: 35, right: 0,
                background: "#1a1a1a", border: `1px solid ${C.border}`,
                borderRadius: 8, padding: 8, minWidth: 120,
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                display: "flex", flexDirection: "column", gap: 4, zIndex: 20,
              }}>
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)}
                    style={{ background: "none", border: "none", color: "#ff4d4d", padding: "2px", cursor: "pointer", textAlign: "left", fontWeight: 600, fontSize: 13 }}>
                    🗑️ Delete
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 4 }}>
                    <span style={{ fontSize: 11, color: "#aaa", textAlign: "center" }}>Confirm Delete?</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={handleDelete} disabled={isDeleting}
                        style={{ flex: 1, background: isDeleting ? "#444" : "#ff4d4d", border: "none", color: "white", padding: "4px 8px", borderRadius: 4, cursor: isDeleting ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                        {isDeleting ? (
                          <><div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Deleting...</>
                        ) : "Sure."}
                      </button>
                      <button onClick={() => !isDeleting && setConfirmDelete(false)} disabled={isDeleting}
                        style={{ flex: 1, background: "#333", border: "none", color: "#ccc", padding: "6px 10px", borderRadius: 6, cursor: isDeleting ? "not-allowed" : "pointer", fontSize: 11 }}>
                        Cancel
                      </button>
                    </div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Playback progress bar */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
          background: "rgba(255,255,255,.1)", zIndex: 6, opacity: active ? 1 : 0,
        }}>
          <div style={{
            height: "100%",
            background: `linear-gradient(90deg,${C.accent},${C.accent2})`,
            width: `${prog}%`, transition: "width .12s linear",
          }} />
        </div>

        {/* View count badge (mobile) */}
        {showViews && isMobile && (
          <div style={{
            position: "absolute", top: compact ? 4 : 8, right: compact ? 4 : 42,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
            padding: "3px 8px", borderRadius: 8,
            display: "flex", alignItems: "center", gap: 4, zIndex: 10,
            border: "1px solid rgba(255,255,255,0.1)", pointerEvents: "none",
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{fmtNum(currentViews)}</span>
          </div>
        )}
      </div>

      {/* ── Card info below thumbnail ── */}
      {!compact && showChannel && (
        <div style={{ padding: "10px 12px 12px" }}>
          <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>

            {/* Profile avatar — clicking navigates to profile */}
            <div onClick={handleProfileClick} style={{ flexShrink: 0, cursor: "pointer" }}>
              <Avatar profile={pf} size={32} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* ── Title (truncated, clicking opens player) ── */}
              <div
                onClick={e => { e.stopPropagation(); playVideo(video); }}
                style={{
                  fontSize: 13, fontWeight: 600, color: C.text,
                  lineHeight: 1.4, marginBottom: 4,
                  // Clamp to 2 lines max via webkit
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
              >
                {truncateTitle(video.title, 72)}
              </div>

              {/* ── Row 1: username + verified badge ── */}
              <div
                onClick={handleProfileClick}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  cursor: "pointer", marginBottom: 2,
                }}
              >
                <span style={{
                  fontSize: 12, fontWeight: 600, color: C.accent,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  maxWidth: "calc(100% - 20px)",
                  transition: "color .2s",
                }}>
                  {pf.display_name || pf.username}
                </span>
                {pf.is_verified && <VerifiedBadge size={11} />}
              </div>

              {/* ── Row 2: views · time ── */}
              <div style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
                <span>{fmtNum(currentViews)} views</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span>{timeAgo(video.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
