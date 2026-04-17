import { useState, useRef, useEffect } from "react";
import { C, Avatar, VipBadge, VerifiedBadge, fmtNum, timeAgo } from "./ui/index";
import { useApp } from "../context/AppContext";
import { useIsMobile, useVideoLike } from "../hooks/index";
import { likeAPI,videoAPI } from "../lib/supabase";

export default function VideoCard({ video, cardWidth, compact, showViews, showChannel = true, isOwner }) {
const { setTab, playVideo, setActiveProfile, session, showToast } = useApp();
  const isMobile = useIsMobile();
  const vRef = useRef(null);
  const timerRef = useRef(null);
  const lpRef = useRef(null);
  const tickRef = useRef(null);

  const [active, setActive] = useState(false);
  const [hov, setHov] = useState(false);
  const [prog, setProg] = useState(0);
  const [lpProg, setLpProg] = useState(0);
  const [lpOn, setLpOn] = useState(false);

const [currentViews, setCurrentViews] = useState(video.views_count || video.views || 0);

  const { liked, count: likeCount, toggle: toggleLike } = useVideoLike(video.id, false, video.likes_count);

  // 1. Add these new states at the top of your component
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!session?.user?.id) {
      return showToast("Please login to perform this action", "error");
    }

    // Ensure the person deleting is the actual owner (Security check)
    if (video.user_id !== session.user.id) {
      return showToast("Unauthorized: You do not own this video", "error");
    }
    // Prevent multiple clicks
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      // Actual API Call
      await videoAPI.delete(video.id);
      // Success feedback
      showToast("Video deleted permanently", "success");
      // UI Update: Broadcast to ProfilePage to remove the card from the grid
      window.dispatchEvent(new CustomEvent('video_deleted', {
        detail: { videoId: video.id }
      }));

      // Close menus
      setShowMenu(false);
      setConfirmDelete(false);
    } catch (err) {
      console.error("Delete error:", err);
      showToast(err.message || "Failed to delete video", "error");
    } finally {
      setIsDeleting(false);
    }
  };



  const [saved, setSaved] = useState(false);

  // Add an effect to check if the video is already saved when the card loads
  useEffect(() => {
    if (session?.user?.id) {
      likeAPI.isSaved(session.user.id, video.id).then(setSaved);
    }
  }, [video.id, session?.user?.id]);

  const handleSaveToggle = async (e) => {
    e.stopPropagation();
    if (!session) return showToast("Please login to save videos", "info");

    try {
      const nextSavedState = !saved; // What the state will become
      await likeAPI.toggleSave(session.user.id, video.id, saved);

      // 1. Update local state
      setSaved(nextSavedState);

      // 2. ─── BROADCAST THE UPDATE ───
      window.dispatchEvent(new CustomEvent('video_save_updated', {
        detail: { videoId: video.id, isSaved: nextSavedState }
      }));

      showToast(nextSavedState ? "Video saved!" : "Removed from saved", "success");
    } catch (err) {
      showToast("Failed to update saved videos", "error");
    }
  };


  // Add this inside your VideoCard component
  useEffect(() => {
    const handleGlobalSaveUpdate = (e) => {
      if (e.detail.videoId === video.id) {
        setSaved(e.detail.isSaved);
      }
    };

    window.addEventListener('video_save_updated', handleGlobalSaveUpdate);
    return () => window.removeEventListener('video_save_updated', handleGlobalSaveUpdate);
  }, [video.id]);


  function play() {
    const v = vRef.current; if (!v) return;
    v.muted = true; v.volume = 0; v.currentTime = 0;
    v.play().then(() => setActive(true)).catch(() => { });
  }
  function stop() {
    const v = vRef.current; if (!v) return;
    v.pause(); v.currentTime = 0; setActive(false); setProg(0);
  }

  function onEnter() { if (isMobile) return; setHov(true); timerRef.current = setTimeout(play, 350); }
  function onLeave() { if (isMobile) return; clearTimeout(timerRef.current); setHov(false); stop(); }

  // Mobile: long-press = play preview in card, single tap = open PlayerModal
  const touchStartTime = useRef(0);
  const longPressTriggered = useRef(false);

  function onTouchStart(e) {
    if (!isMobile) return;
    e.preventDefault();
    touchStartTime.current = Date.now();
    longPressTriggered.current = false;
    setLpOn(true); setLpProg(0);
    const t0 = Date.now();
    tickRef.current = setInterval(() => setLpProg(Math.min((Date.now() - t0) / 6, 100)), 16);
    lpRef.current = setTimeout(() => {
      longPressTriggered.current = true;
      clearInterval(tickRef.current); setLpOn(false); setHov(true); play();
    }, 600);
  }
  function onTouchEnd() {
    if (!isMobile) return;
    clearTimeout(lpRef.current); clearInterval(tickRef.current);
    setLpOn(false); setLpProg(0);
    // If long press was triggered, just stop preview — don't open player
    if (longPressTriggered.current) {
      // Keep preview playing, user can tap again to open
      return;
    }
    if (!active) setHov(false);
  }

  useEffect(() => {
    const v = vRef.current; if (!v) return;
    const fn = () => v.duration && setProg((v.currentTime / v.duration) * 100);
    v.addEventListener("timeupdate", fn);
    return () => v.removeEventListener("timeupdate", fn);
  }, []);

  useEffect(() => () => { clearTimeout(timerRef.current); clearTimeout(lpRef.current); clearInterval(tickRef.current); }, []);

  const pf = video.profiles || { username: video.channel || "Unknown" };


  const handleProfileClick = (e) => {
    e.stopPropagation();
    window.scrollTo(0, 0);
    setActiveProfile(pf); // 'pf' is the user data from the card
    setTab(`profile:${pf.username}`);
  };



 useEffect(() => {
  const handleUpdate = (e) => {
    if (e.detail.videoId === video.id) {
      setCurrentViews(e.detail.views);
    }
  };
  window.addEventListener('video_view_updated', handleUpdate);
  return () => window.removeEventListener('video_view_updated', handleUpdate);
}, [video.id]);

  return (
    <div onClick={() => { if (isMobile && longPressTriggered.current) { longPressTriggered.current = false; stop(); setHov(false); return; } if (!lpOn) playVideo(video); }} onMouseEnter={onEnter} onMouseLeave={onLeave}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchMove={onTouchEnd}
      style={{
        background: hov ? C.cardH : C.card, borderRadius: 14, overflow: "hidden", cursor: "pointer",
        border: `1px solid ${hov ? "var(--accent)44" : C.border}`,
        transform: hov ? "translateY(-5px) scale(1.015)" : "none",
        transition: "all .3s ease",
        boxShadow: hov ? `0 20px 50px rgba(0,0,0,.5),0 0 40px var(--accent)12` : `0 2px 12px rgba(0,0,0,.2)`,
        width: cardWidth || "100%", flexShrink: cardWidth ? 0 : undefined,
        scrollSnapAlign: cardWidth ? "start" : undefined, position: "relative",
        /* ADD THIS LINE TO FIX BLINKING */
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation"
      }}>

      {/* Media */}
      <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden", background: "#111" }}>
        {!active && (
          <img src={video.thumbnail_url || `https://picsum.photos/640/360?random=${String(video.id).charCodeAt(0) || 1}`} alt={video.title} loading="lazy"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: hov ? "scale(1.06)" : "scale(1)", transition: "transform .5s ease", zIndex: 1 }} />
        )}


        {hov && (
          <video ref={vRef} src={video.video_url} muted playsInline loop
            onCanPlay={e => { e.target.muted = true; e.target.volume = 0; e.target.play().then(() => setActive(true)).catch(() => { }); }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 2, opacity: active ? 1 : 0, transition: "opacity .4s" }} />
        )}

        <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", background: "linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 50%)", opacity: hov ? 1 : 0, transition: "opacity .3s" }} />

        {hov && !active && (
          <div style={{ position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--accent)cc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "white", boxShadow: "0 0 0 8px var(--accent)33", animation: "pulseRing 1.5s infinite" }}>▶</div>
          </div>
        )}

        {isMobile && lpOn && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={76} height={76} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={38} cy={38} r={32} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth={4} />
              <circle cx={38} cy={38} r={32} fill="none" stroke="var(--accent)" strokeWidth={4} strokeLinecap="round" strokeDasharray={`${lpProg * 2.01} 201`} />
            </svg>
            <span style={{ position: "absolute", fontSize: 24 }}>▶</span>
          </div>
        )}

        {isMobile && active && (
          <button onClick={e => { e.stopPropagation(); stop(); setHov(false); }} style={{ position: "absolute", top: 8, right: 8, zIndex: 12, background: "rgba(0,0,0,.8)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "white", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>⏹</button>
        )}

        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4, zIndex: 5 }}>
          {video.is_vip && <VipBadge small />}
        </div>

        <div style={{ position: "absolute", bottom: 8, right: 8, zIndex: 5, background: "rgba(0,0,0,.85)", color: "white", fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{video.duration || ""}</div>

        {/* Inside VideoCard.jsx - Top Right Button Section */}
        {!compact && (
          <div style={{ position: "absolute", top: 8, right: 8, zIndex: 15 }}>
            <button
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                if (isOwner) {
                  setShowMenu(!showMenu);
                  setConfirmDelete(false);
                } else {
                  handleSaveToggle(e);
                }
              }}
              style={{
                background: "rgba(0,0,0,0.7)",
                border: "none",
                borderRadius: "50%",
                width: 30,
                height: 30,
                cursor: "pointer",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: hov || saved || isOwner ? 1 : 0,
                transition: "opacity .2s, transform .2s",
                color: (isOwner ? "white" : (saved ? C.accent : "white"))
              }}
            >
              {isOwner ? (
                <span style={{ fontSize: 20, fontWeight: '900' }}>⋮</span>
              ) : (
                saved ? "🔖" : "📑"
              )}
            </button>

            {isOwner && showMenu && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: 35,
                  right: 0,
                  background: "#1a1a1a",
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: 8,
                  minWidth: 120,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  zIndex: 20
                }}
              >
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    style={{ background: "none", border: "none", color: "#ff4d4d", padding: "2px", cursor: "pointer", textAlign: "left", fontWeight: 600, fontSize: 13 }}
                  >
                    🗑️ Delete
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 4 }}>
                    <span style={{ fontSize: 11, color: "#aaa", textAlign: "center" }}>Confirm Delete?</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        style={{
                          flex: 1, background: isDeleting ? "#444" : "#ff4d4d", border: "none", color: "white", padding: "4px 8px", borderRadius: 4, cursor: isDeleting ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 700, display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5
                        }}
                      >
                        {isDeleting ? (
                          <>
                            {/* Simple inline CSS loader */}
                            <div style={{
                              width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)",
                              borderTopColor: "#fff", borderRadius: "50%",
                              animation: "spin 0.8s linear infinite"
                            }} />
                            Deleting...
                          </>
                        ) : (
                          "Sure."
                        )}
                      </button>
                      <button
                        onClick={() => !isDeleting && setConfirmDelete(false)}
                        disabled={isDeleting}
                        style={{
                          flex: 1,
                          background: "#333",
                          border: "none",
                          color: "#ccc",
                          padding: "6px 10px",
                          borderRadius: 6,
                          cursor: isDeleting ? "not-allowed" : "pointer",
                          fontSize: 11
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                    <style>{`
  @keyframes spin { to { transform: rotate(360deg); } }
`}</style>
                  </div>
                )}
              </div>
            )}
          </div>
        )} {/* This closing parenthesis and brace were missing */}

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,.1)", zIndex: 6, opacity: active ? 1 : 0 }}>
          <div style={{ height: "100%", background: `linear-gradient(90deg,${C.accent},${C.accent2})`, width: `${prog}%`, transition: "width .12s linear" }} />
        </div>

        {/* ─── Updated Condition to check for showViews AND isMobile ─── */}
        {showViews && isMobile && (
          <div style={{
            position: 'absolute',
            top: compact ? 4 : 8,
            right: compact ? 4 : 42,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            padding: '3px 8px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            zIndex: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            pointerEvents: 'none'
          }}>

            <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>
              {fmtNum(currentViews)}
            </span>
          </div>
        )}

      </div>

      {!compact && showChannel && (
        <div style={{ padding: "10px 12px 12px" }}>
          <div onClick={handleProfileClick} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>

            <Avatar profile={pf} size={32} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.4, marginBottom: 3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{video.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.muted }}>
                <div
                  onClick={handleProfileClick}
                  className="user-link"
                  style={{
                    color: C.accent,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "color 0.2s ease",
                    padding: isMobile ? "4px 0" : "0",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = C.accent2}
                  onMouseLeave={(e) => e.currentTarget.style.color = C.accent}
                >
                  {pf.display_name || pf.username}
                  {pf.is_verified && <VerifiedBadge size={11} />}
                </div>
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{fmtNum(currentViews)} views · {timeAgo(video.created_at)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
