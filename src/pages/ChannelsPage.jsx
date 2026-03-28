import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  C, SectionHeader, Skeleton, EmptyState, fmtNum, VerifiedBadge,
} from "../components/ui/index";
import { useApp } from "../context/AppContext";
import { followAPI, profileAPI, supabase } from "../lib/supabase";
import { useIsMobile } from "../hooks/index";

// ─────────────────────────────────────────────────────────────────────────────
// ADVANCED STYLES
// ─────────────────────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @keyframes glass-shine {
      0% { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(200%) skewX(-15deg); }
    }
    .creator-card:active { transform: scale(0.96); }
    .loader-mini {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.1);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// REFINED SKELETON
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonChannelCard() {
  return (
    <div style={{ background: C.bg2, borderRadius: 24, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <div style={{ height: 50, background: C.bg3, opacity: 0.5 }} />
      <div style={{ padding: "0 16px 20px", marginTop: -30, textAlign: "center" }}>
        <Skeleton width={70} height={70} style={{ borderRadius: "50%", margin: "0 auto 12px", border: `4px solid ${C.bg2}` }} />
        <Skeleton width="60%" height={14} style={{ margin: "0 auto 8px" }} />
        <Skeleton width="40%" height={10} style={{ margin: "0 auto 16px" }} />
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <Skeleton width="100%" height={35} style={{ borderRadius: 12 }} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADVANCED CHANNEL CARD
// ─────────────────────────────────────────────────────────────────────────────
function ChannelCard({ user, initialFollowed = false, initialRequested = false }) {
  const { session, setTab, setActiveProfile, setAuthModal, showToast } = useApp();
  const [followed, setFollowed] = useState(initialFollowed);
  const [requested, setRequested] = useState(initialRequested);
  const [loading, setLoading] = useState(false);

  const username = user.username || "anonymous";
  const avatar = user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  const displayName = user.display_name || username;
  const coverColor = `hsl(${(username.length * 55) % 360}, 60%, 25%)`;

  const handleFollowAction = async (e) => {
    e.stopPropagation();
    if (!session) return setAuthModal("login");
    if (loading) return;

    const wasRequested = requested;
    const wasFollowed = followed;

    if (followed) {
      setFollowed(false);
    } else if (requested) {
      setRequested(false);
    } else {
      setRequested(true);
    }

    setLoading(true);
    try {
      if (wasFollowed) {
        await followAPI.unfollow(session.user.id, user.id);
        showToast(`Unfollowed @${username}`, "info");
      } else if (wasRequested) {
        await followAPI.cancelFollowRequest(session.user.id, user.id);
        showToast("Request cancelled", "info");
      } else {
        await followAPI.sendFollowRequest(session.user.id, user.id);
        showToast("Follow request sent!", "success");
      }
    } catch (err) {
      setFollowed(wasFollowed);
      setRequested(wasRequested);
      showToast("Action failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const openProfile = () => {
    setActiveProfile(user);
    setTab(`profile:${username}`);
  };

  return (
    <div
      onClick={openProfile}
      className="creator-card"
      style={{
        position: "relative", background: C.bg2, borderRadius: 24,
        border: `1px solid ${C.border}`, textAlign: "center",
        cursor: "pointer", transition: "all 0.3s ease",
        overflow: "hidden", display: "flex", flexDirection: "column"
      }}
    >
      <div style={{ height: 55, background: `linear-gradient(45deg, ${coverColor}, ${C.bg3})`, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)", animation: "glass-shine 3s infinite" }} />
      </div>

      <div style={{ padding: "0 12px 16px", marginTop: -35, flex: 1 }}>
        <div style={{ position: "relative", display: "inline-block", marginBottom: 10 }}>
          <img
            src={avatar}
            alt={username}
            style={{
              width: 70, height: 70, borderRadius: "50%",
              background: C.bg2, border: `4px solid ${C.bg2}`,
              objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
            }}
          />
          {user.is_verified && (
            <div style={{ position: "absolute", bottom: 4, right: 0 }}>
              <VerifiedBadge size={16} />
            </div>
          )}
        </div>

        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {displayName}
        </div>
        <div style={{ fontSize: 11, color: C.accent, fontWeight: 600, marginBottom: 12 }}>
          @{username.toLowerCase()}
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          background: "rgba(255,255,255,0.03)", borderRadius: 14,
          padding: "8px 4px", marginBottom: 16, border: `1px solid ${C.border}`
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800 }}>{fmtNum(user.followers_count || 0)}</div>
            <div style={{ fontSize: 8, color: C.muted, textTransform: "uppercase" }}>Fans</div>
          </div>
          <div style={{ borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 800 }}>{fmtNum(user.following_count || 0)}</div>
            <div style={{ fontSize: 8, color: C.muted, textTransform: "uppercase" }}>Following</div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800 }}>{fmtNum(user.video_count || 0)}</div>
            <div style={{ fontSize: 8, color: C.muted, textTransform: "uppercase" }}>Videos</div>
          </div>
        </div>

        <button
          onClick={handleFollowAction}
          disabled={loading}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 12,
            background: followed ? C.bg3 : requested ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${C.accent}, ${C.accent2 || C.accent})`,
            border: (followed || requested) ? `1px solid ${C.border}` : "none",
            color: (followed || requested) ? C.text : "white",
            fontSize: 12, fontWeight: 800, cursor: "pointer", transition: "all 0.2s"
          }}
        >
          {loading ? "..." : followed ? "✓ Following" : requested ? "✕ Cancel Request" : "+ Follow"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANNELS PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function ChannelsPage() {
  const { session, authLoading, showToast, setTab } = useApp();
  const isMobile = useIsMobile();

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [followingIds, setFollowingIds] = useState(new Set());
  const [pendingIds, setPendingIds] = useState(new Set());

  const LIMIT = 20;
  const searchTimer = useRef(null);
  const sentinelRef = useRef(null);

  // Initialize Data
  useEffect(() => {
    if (authLoading) return;
    const init = async () => {
      setLoading(true);
      try {
        const uid = session?.user?.id;
        const [pageData, follows, requests] = await Promise.all([
          profileAPI.getPaginated({ page: 0, limit: LIMIT }),
          uid ? followAPI.getFollowingIds(uid) : Promise.resolve([]),
          uid ? supabase.from("follow_requests").select("recipient_id").eq("sender_id", uid).eq("status", "pending") : Promise.resolve({ data: [] })
        ]);

        setUsers(pageData.filter(u => u.id !== uid));
        setFollowingIds(new Set(follows));
        setPendingIds(new Set((requests.data || []).map(r => r.recipient_id)));
        setHasMore(pageData.length === LIMIT);
        setPage(1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [authLoading, session?.user?.id]);

  // Search Logic with Race Condition Fix
  useEffect(() => {
    clearTimeout(searchTimer.current);

    // Instant Reset if empty
    if (!search.trim()) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      // Final check before starting fetch
      if (!search.trim()) return;

      setSearchLoading(true);
      try {
        const results = await profileAPI.search(search.trim());

        // Final check after fetch to prevent race conditions
        if (search.trim()) {
          setSearchResults(results.filter(u => u.id !== session?.user?.id));
        } else {
          setSearchResults(null);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(searchTimer.current);
  }, [search, session?.user?.id]);

  // Infinite Scroll
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || searchResults !== null) return;
    setLoadingMore(true);
    try {
      const next = await profileAPI.getPaginated({ page, limit: LIMIT });
      setUsers(prev => [...prev, ...next.filter(u => u.id !== session?.user?.id)]);
      setHasMore(next.length === LIMIT);
      setPage(p => p + 1);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, searchResults, session?.user?.id]);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && loadMore(), { threshold: 0.1 });
    if (sentinelRef.current) obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loadMore]);

  const activeList = searchResults !== null ? searchResults : users;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "0 8px" : "0 20px" }}>
      <GlobalStyles />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 30, paddingTop: 10 }}>
        <h1 style={{
          fontSize: isMobile ? 26 : 36, fontWeight: 900,
          background: `linear-gradient(to right, #fff, ${C.accent})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: 8
        }}>
          Creator Universe
        </h1>
        <p style={{ color: C.muted, fontSize: 14 }}>Connect with the world's top talent</p>
      </div>

      {/* Floating Slim Search */}
      <div style={{
        position: "sticky", top: 10, zIndex: 100, marginBottom: 30,
        background: "rgba(15, 15, 20, 0.8)", backdropFilter: "blur(16px)",
        borderRadius: 16, padding: "4px 8px", border: `1px solid ${C.border}`,
        display: "flex", alignItems: "center"
      }}>
        <span style={{ padding: "0 10px", opacity: 0.5 }}>🔍</span>
        <input
          value={search}
          onChange={e => {
            const val = e.target.value;
            setSearch(val);
            if (!val.trim()) {
              setSearchResults(null);
              setSearchLoading(false);
              clearTimeout(searchTimer.current);
            }
          }}
          placeholder="Search by name or @username..."
          style={{
            flex: 1, background: "transparent", border: "none", color: "#fff",
            padding: "10px 0", outline: "none", fontSize: 14
          }}
        />
        {search && (
          <button
            onClick={() => {
              setSearch("");
              setSearchResults(null);
              setSearchLoading(false);
            }}
            style={{
              background: "none", border: "none", color: C.muted,
              cursor: "pointer", padding: "0 10px", fontSize: 16
            }}
          >
            ✕
          </button>
        )}
        {searchLoading && <div className="loader-mini" style={{ marginRight: 10 }} />}
      </div>


      {/* Content Grid */}
      {loading && activeList.length === 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fill, minmax(200px, 1fr))", gap: 15 }}>
          {Array(10).fill(0).map((_, i) => <SkeletonChannelCard key={i} />)}
        </div>
      ) : activeList.length === 0 ? (
        /* PROFESSIONAL USER NOT FOUND STATE */
        <EmptyState
          emoji="🔍"
          title="No Results Found"
          subtitle={`We couldn't find any creator matching "${search}". Check the spelling or try a different name.`}
        />
      ) : (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fill, minmax(200px, 1fr))",
            gap: isMobile ? 12 : 20
          }}>
            {activeList.map(user => (
              <ChannelCard
                key={user.id}
                user={user}
                initialFollowed={followingIds.has(user.id)}
                initialRequested={pendingIds.has(user.id)}
              />
            ))}
          </div>

          <div ref={sentinelRef} style={{ height: 50 }} />

          {loadingMore && (
            <div style={{ textAlign: "center", padding: 20 }}>
              <div style={{ width: 24, height: 24, border: `2px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
