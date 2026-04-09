import { useState, useEffect, useRef, useCallback } from "react";
import { C, Avatar, Spinner, timeAgo, fmtNum } from "../ui/index";
import { useApp } from "../../context/AppContext";
import { commentAPI, profileAPI } from "../../lib/supabase";


/* ─────────────────────────────────────────────────────────────
   LIKE BUTTON
───────────────────────────────────────────────────────────── */

// Add this to your UI components or top of CommentSection.jsx
const CommentSkeleton = () => (
  <div style={{ padding: "12px 0", display: "flex", gap: 12, animation: "pulse 1.5s infinite ease-in-out" }}>
    <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.bg3 }} />
    <div style={{ flex: 1 }}>
      <div style={{ width: "30%", height: 10, background: C.bg3, borderRadius: 4, marginBottom: 8 }} />
      <div style={{ width: "90%", height: 12, background: C.bg3, borderRadius: 4, marginBottom: 4 }} />
      <div style={{ width: "60%", height: 12, background: C.bg3, borderRadius: 4 }} />
    </div>
  </div>
);

// Add this animation to your global CSS or a <style> tag in PlayerModal
const skeletonStyle = `
  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
`;

// Add this right after your imports
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }
  `;
  document.head.appendChild(style);
}


function LikeBtn({ liked, count, onToggle, small }) {
  const [bounce, setBounce] = useState(false);
  const h = () => {
    onToggle();
    setBounce(true);
    setTimeout(() => setBounce(false), 300);
  };
  return (
    <button
      onClick={h}
      style={{
        display: "flex", alignItems: "center", gap: 4,
        background: liked ? `${C.accent3}18` : "none",
        border: `1px solid ${liked ? "var(--accent3)55" : "transparent"}`,
        borderRadius: 20,
        padding: small ? "2px 7px" : "4px 10px",
        cursor: "pointer", transition: "all .2s",
        transform: bounce ? "scale(1.25)" : "scale(1)",
      }}
    >
      <span style={{
        fontSize: small ? 12 : 14,
        transform: bounce ? "scale(1.3)" : "scale(1)",
        transition: "transform .2s", display: "block",
      }}>
        {liked ? "❤️" : "🤍"}
      </span>
      {count > 0 && (
        <span style={{ fontSize: small ? 10 : 11, color: liked ? C.accent3 : C.muted, fontWeight: 600 }}>
          {fmtNum(count)}
        </span>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   NEST COMMENTS (flat → tree)
───────────────────────────────────────────────────────────── */
function nestComments(allComments) {
  const map = {};
  const roots = [];

  allComments.forEach(c => { map[c.id] = { ...c, replies: [] }; });

  allComments.forEach(c => {
    const parentId = c.parent_id || c.parentId;
    if (parentId) {
      let root = map[parentId];
      while (root && (root.parent_id || root.parentId)) {
        root = map[root.parent_id || root.parentId];
      }
      if (root) root.replies.push(map[c.id]);
      else roots.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });

  roots.forEach(root => {
    root.replies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  });

  return roots;
}

/* ─────────────────────────────────────────────────────────────
   NAVIGATE TO PROFILE — shared helper used everywhere
───────────────────────────────────────────────────────────── */
function useProfileNav() {
  const { setTab, setActiveProfile } = useApp();
  return useCallback((profileData) => {
    if (!profileData) return;
    const identifier = profileData.username || profileData.id;
    if (!identifier) return;
    // If we only have a username string, pass minimal object
    setActiveProfile(profileData);
    setTab(`profile:${identifier}`);
  }, [setTab, setActiveProfile]);
}

/* ─────────────────────────────────────────────────────────────
   CLICKABLE USERNAME CHIP
───────────────────────────────────────────────────────────── */
function UsernameChip({ username, display, accent = false, style: extraStyle }) {
  const navigateTo = useProfileNav();
  if (!username) return null;
  return (
    <span
      onClick={e => { e.stopPropagation(); navigateTo({ username }); }}
      style={{
        color: accent ? C.accent : C.text,
        fontWeight: 700,
        cursor: "pointer",
        borderRadius: 4,
        padding: "1px 2px",
        transition: "background .15s, color .15s",
        display: "inline",
        ...extraStyle,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `${C.accent}18`;
        e.currentTarget.style.color = C.accent;
        e.currentTarget.style.textDecoration = "underline";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = accent ? C.accent : C.text;
        e.currentTarget.style.textDecoration = "none";
      }}
    >
      {display || username}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   COMMENT INPUT
───────────────────────────────────────────────────────────── */
function CommentInput({
  videoId, parentId, placeholder, compact,
  autoFocus, onSuccess, onCancel, videoOwnerId,
  replyToUsername,
}) {
  const { session, setAuthModal, profile } = useApp();
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);

  const submit = async () => {
    if (!session) { setAuthModal("login"); return; }
    if (!text.trim()) return;
    setLoading(true);
    try {
      // 1. Extract the name from the placeholder (this is usually the Display Name)
      const nameFromPlaceholder = placeholder?.includes("@")
        ? placeholder.split("@")[1].replace("...", "").trim()
        : null;

      // 2. CRITICAL FIX: Prioritize the unique replyToUsername prop (e.g., "dildar") 
      // over the placeholder string (e.g., "Dildar Ahmed")
      const replyToUserIdentifier = replyToUsername || nameFromPlaceholder;

      const data = await commentAPI.add({
        videoId,
        userId: session.user.id,
        body: text.trim(),
        parentId,
        videoOwnerId,
        reply_to_user: replyToUserIdentifier, // This will now correctly be the username
      });

      setText("");
      setFocused(false);

      onSuccess?.({
        ...data,
        reply_to_user: replyToUserIdentifier,
        reply_to_display_name: nameFromPlaceholder // Keep the pretty name for UI display
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!session && !compact) return (
    <div
      onClick={() => setAuthModal("login")}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 14px",
        background: C.bg3,
        border: `1px dashed ${C.border}`,
        borderRadius: 12, cursor: "pointer", transition: "border-color .2s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
    >
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: C.bg4 || C.bg3,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
      }}>👤</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Sign in to comment</div>
        <div style={{ fontSize: 11, color: C.muted }}>Join the conversation →</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: compact ? 8 : 10, alignItems: "flex-start" }}>
      {!compact && session && (
        <Avatar profile={profile || { username: session.user.email?.split("@")[0] || "?" }} size={36} />
      )}
      <div style={{ flex: 1 }}>
        <textarea
          ref={ref}
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { if (!text.trim()) setFocused(false); }}
          onKeyDown={e => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit();
            if (e.key === "Escape") { setText(""); onCancel?.(); }
          }}
          placeholder={placeholder || "Add a comment…"}
          rows={focused ? 3 : 1}
          style={{
            width: "100%",
            background: C.bg3,
            border: `1.5px solid ${focused ? C.accent : C.border}`,
            borderRadius: 10, color: C.text,
            fontFamily: "inherit",
            fontSize: compact ? 12 : 13,
            padding: "10px 12px",
            outline: "none", resize: "none",
            transition: "all .2s",
            boxShadow: focused ? `0 0 0 3px ${C.accent}1a` : "none",
            lineHeight: 1.5,
          }}
        />
        {(focused || text) && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: C.muted, marginRight: "auto" }}>Ctrl+Enter to post</span>
            <button
              onClick={() => { setText(""); setFocused(false); onCancel?.(); }}
              style={{
                padding: "6px 12px", borderRadius: 8,
                border: `1px solid ${C.border}`, background: "none",
                color: C.muted, fontSize: 12, cursor: "pointer",
                fontFamily: "inherit", fontWeight: 600,
              }}
            >Cancel</button>
            <button
              onClick={submit}
              disabled={!text.trim() || loading}
              style={{
                padding: "6px 14px", borderRadius: 8, border: "none",
                background: text.trim()
                  ? `linear-gradient(135deg,${C.accent},${C.accent2})`
                  : C.bg3,
                color: text.trim() ? "white" : C.muted,
                fontSize: 12, cursor: text.trim() ? "pointer" : "not-allowed",
                fontFamily: "inherit", fontWeight: 700, transition: "all .2s",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%",
                    border: "2px solid white", borderTopColor: "transparent",
                    animation: "spin .7s linear infinite",
                  }} />
                  Posting...
                </>
              ) : "Post"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   COMMENT ITEM
   ── Avatar clickable → profile
   ── Username clickable → profile
   ── @mention clickable → profile
   ── All original reply / like / delete logic intact
───────────────────────────────────────────────────────────── */
function CommentItem({
  comment, videoId, videoOwnerId,
  likedIds, onLikeToggle, onDelete, onNewComment,
  depth = 0, allComments = [],
}) {
  const { session, setActiveProfile, setTab, setPlayer, player } = useApp();

  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const pf = comment.profiles || {};
  const isRoot = depth === 0;

  const normalizeProfileKey = (value) => String(value || "").replace(/^@/, "").trim().toLowerCase();

  const walkComments = (items, visitor) => {
    for (const item of items || []) {
      const result = visitor(item);
      if (result) return result;
      const nested = walkComments(item?.replies || [], visitor);
      if (nested) return nested;
    }
    return null;
  };

  // Inside CommentItem or CommentSection
const findProfileInComments = (username) => {
  const clean = String(username || "").replace(/^@/, "").trim().toLowerCase();
  if (!clean || !allComments?.length) return null;

  return walkComments(allComments, (item) => {
    const p = item?.profiles;
    if (!p) return null;
    // MATCH ONLY BY USERNAME
    if (String(p.username || "").toLowerCase() === clean) return p;
    return null;
  });
};


  const goToProfile = async (e, profileData) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!profileData) return;

    // Ensure we have the most accurate identifier available
    const identifier = profileData.username || profileData.id;
    if (!identifier) return;

    window.dispatchEvent(new CustomEvent('lx_pause_video'));

    // Set the active profile so the ProfilePage has data immediately
    setActiveProfile(profileData);

    // Set the tab using the identifier
    setTab(`profile:${identifier}`);
    window.scrollTo(0, 0);

    // Close the player if it's open
    if (setPlayer) setPlayer(null);
  };

  /* ── Updated: Robust Mention Resolution ── */
  const goToMentionProfile = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // 1. Try to find the mentioned user in the existing comment list
    // Use reply_to_user because it's the unique username string
    const targetUsername = comment.reply_to_user;
    if (!targetUsername) return;

    const foundProfile = findProfileInComments(targetUsername);
    console.log("Target Username:", comment.reply_to_user);
   
    if (foundProfile) {
      // If found in local state, navigate immediately
      goToProfile(null, foundProfile);
    } else {
      // 2. Fallback: If not in local comments, fetch from API by username
      try {
        // Create a minimal object to show a loading state if needed, 
        // but ideally fetch the full data
        const fetched = await profileAPI.getByUsername(targetUsername);
        if (fetched) {
          goToProfile(null, fetched);
        } else {
          // Ultimate fallback: navigate with what we have
          goToProfile(null, { username: targetUsername });
        }
      } catch (err) {
        console.error("Failed to fetch mentioned profile:", err);
      }
    }
  };

  return (
    <div style={{ marginBottom: isRoot ? 16 : 8, paddingLeft: isRoot ? 0 : 44 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>

        {/* ── CLICKABLE AVATAR ── */}
        <div
          onClick={e => goToProfile(e, pf)}
          style={{ cursor: "pointer", flexShrink: 0, borderRadius: "50%", transition: "opacity .2s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <Avatar profile={pf} size={isRoot ? 34 : 26} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, lineHeight: 1.5, flexWrap: "wrap" }}>

            {/* ── CLICKABLE COMMENTER NAME ── */}
            <span
              onClick={e => goToProfile(e, pf)}
              style={{
                fontWeight: 700,
                marginRight: 6,
                color: C.text,
                cursor: "pointer",
                borderRadius: 4,
                padding: "1px 2px",
                display: "inline",
                transition: "background .15s, color .15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = C.accent;
                e.currentTarget.style.background = `${C.accent}18`;
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = C.text;
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              {pf.display_name || pf.username}
            </span>

            {comment.reply_to_user && (
              <span
                onClick={goToMentionProfile}
                style={{
                  color: C.accent, fontWeight: 700,
                  marginRight: 6, cursor: "pointer",
                  display: "inline",
                  transition: "text-decoration .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
              >
                @{comment.reply_to_display_name || comment.reply_to_user}
              </span>
            )}
            {/* Comment body — inline @mentions inside text are also clickable */}
            <span style={{ color: C.text }}>
              {renderBodyWithMentions(comment.body, (data) => goToProfile(null, data))}
            </span>
          </div>

          {/* Meta row */}
          <div style={{ display: "flex", gap: 14, marginTop: 5, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: C.muted }}>{timeAgo(comment.created_at)}</span>

            {comment.likes_count > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>
                {fmtNum(comment.likes_count)} {comment.likes_count === 1 ? "like" : "likes"}
              </span>
            )}

            <button
              onClick={() => setReplying(!replying)}
              style={{
                background: "none", border: "none",
                color: replying ? C.accent : C.muted,
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                padding: 0, fontFamily: "inherit",
                transition: "color .15s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = C.accent}
              onMouseLeave={e => e.currentTarget.style.color = replying ? C.accent : C.muted}
            >
              Reply
            </button>

            {session?.user?.id === comment.user_id && (
              <button
                onClick={() => onDelete(comment.id)}
                style={{
                  background: "none", border: "none",
                  color: C.muted, fontSize: 11,
                  cursor: "pointer", padding: 0, fontFamily: "inherit",
                  transition: "color .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                onMouseLeave={e => e.currentTarget.style.color = C.muted}
              >
                Delete
              </button>
            )}
          </div>

          {/* Reply input */}
          {/* Inside CommentItem -> Reply input section */}
          {replying && (
            <div style={{ marginTop: 10 }}>
              <CommentInput
                videoId={videoId}
                parentId={comment.id}
                placeholder={`Reply to @${pf.display_name || pf.username}...`}
                replyToUsername={pf.username}
                compact
                autoFocus
                onSuccess={data => {
                  setReplying(false);
                  setShowReplies(true);
                  // The data object now contains the display name from step 1
                  onNewComment(data, comment.id);
                }}
                onCancel={() => setReplying(false)}
              />
            </div>
          )}

          {/* Replies toggle */}
          {isRoot && comment.replies?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {!showReplies ? (
                <button
                  onClick={() => setShowReplies(true)}
                  style={{
                    background: "none", border: "none",
                    color: C.accent, fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 8,
                    cursor: "pointer", padding: 0, fontFamily: "inherit",
                  }}
                >
                  <div style={{ width: 20, height: 1, background: C.border }} />
                  View {fmtNum(comment.replies.length)} {comment.replies.length === 1 ? "reply" : "replies"}
                </button>
              ) : (
                <>
                  {comment.replies.map(reply => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      depth={1}
                      videoId={videoId}
                      videoOwnerId={videoOwnerId}
                      likedIds={likedIds}
                      onLikeToggle={onLikeToggle}
                      onDelete={onDelete}
                      onNewComment={onNewComment}
                      allComments={allComments}
                    />
                  ))}
                  <button
                    onClick={() => setShowReplies(false)}
                    style={{
                      background: "none", border: "none",
                      color: C.muted, fontSize: 12, fontWeight: 600,
                      marginTop: 4, cursor: "pointer",
                      paddingLeft: 44, fontFamily: "inherit",
                    }}
                  >
                    Hide replies
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Like button */}
        <div style={{ paddingTop: 2, flexShrink: 0 }}>
          <LikeBtn
            liked={likedIds.includes(comment.id)}
            count={comment.likes_count || 0}
            onToggle={() => onLikeToggle(comment.id, likedIds.includes(comment.id))}
            small
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   RENDER BODY — turns @username tokens inside comment text
   into clickable spans, leaving plain text as-is
───────────────────────────────────────────────────────────── */
function renderBodyWithMentions(text, navigateTo) {
  if (!text) return null;
  const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
  return parts.map((part, i) => {
    if (/^@[a-zA-Z0-9_]+$/.test(part)) {
      const username = part.slice(1);
      return (
        <span
          key={i}
          onClick={e => { e.stopPropagation(); navigateTo({ username }); }}
          style={{
            color: C.accent, fontWeight: 700, cursor: "pointer",
            borderRadius: 4, padding: "0 2px",
            display: "inline",
            transition: "background .15s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = `${C.accent}18`;
            e.currentTarget.style.textDecoration = "underline";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.textDecoration = "none";
          }}
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/* ─────────────────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────────────────── */
export default function CommentSection({ videoId, videoOwnerId }) {
  const { session } = useApp();
  const [comments, setComments] = useState([]);
  const [likedIds, setLikedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [showCount, setShowCount] = useState(8);
  const subRef = useRef(null);



  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await commentAPI.getForVideo(videoId);
      const nestedData = nestComments(data);

      // Only set the data retrieved from the API
      setComments(nestedData);

      if (session && data.length > 0) {
        const allIds = data.map(c => c.id);
        const liked = await commentAPI.getLikedIds(session.user.id, allIds);
        setLikedIds(liked);
      }
    } catch (e) {
    
      // Set to empty array on error instead of loading dummies
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [videoId, session]); // Removed loadDummy from dependencies

  useEffect(() => { load(); }, [load]);

  /* Real-time subscription */
  useEffect(() => {
    subRef.current = commentAPI.subscribeToVideo(videoId, () => load());
    return () => { subRef.current?.unsubscribe(); };
  }, [videoId, load]);

  const handleLike = async (commentId, currentlyLiked) => {
    if (!session) return;
    setLikedIds(prev =>
      currentlyLiked ? prev.filter(id => id !== commentId) : [...prev, commentId]
    );
    setComments(prev => updateCount(prev, commentId, currentlyLiked ? -1 : 1));
    await commentAPI.toggleLike(session.user.id, commentId, currentlyLiked);
  };

  const handleDelete = async (commentId) => {
    if (!session) return;
    setComments(prev => removeComment(prev, commentId));
    await commentAPI.deletecmnd(commentId, session.user.id);
  };

  const handleNewComment = useCallback((newComment, parentId = null) => {
    if (parentId) {
      setComments(prev => addReply(prev, parentId, newComment));
    } else {
      setComments(prev => [{ ...newComment, replies: [] }, ...prev]);
    }
  }, []);

  const sorted = [...comments].sort((a, b) =>
    sort === "top"
      ? (b.likes_count - a.likes_count)
      : (new Date(b.created_at) - new Date(a.created_at))
  );
  const displayed = sorted.slice(0, showCount);
  const totalReplies = comments.reduce((s, c) => s + (c.replies?.length || 0), 0);

  return (
    <div style={{ marginTop: 28 }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 10,
        marginBottom: 20, paddingBottom: 14,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div>
          <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: C.text }}>
            💬 Comments
          </span>
          <span style={{
            marginLeft: 10, fontSize: 12, fontWeight: 600,
            background: C.bg3, border: `1px solid ${C.border}`,
            borderRadius: 99, padding: "2px 10px", color: C.muted,
          }}>
            {fmtNum(comments.length + totalReplies)}
          </span>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {["newest", "top"].map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              style={{
                padding: "5px 12px", borderRadius: 99, border: "none",
                background: sort === s ? C.accent : C.bg3,
                color: sort === s ? "white" : C.muted,
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", transition: "all .2s",
                textTransform: "capitalize",
              }}
            >
              {s === "newest" ? "🕐 Newest" : "🔝 Top"}
            </button>
          ))}
        </div>
      </div>

      {/* New comment input */}
      <div style={{ marginBottom: 24 }}>
        <CommentInput
          videoId={videoId}
          videoOwnerId={videoOwnerId}
          onSuccess={data => handleNewComment(data)}
        />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...Array(5)].map((_, i) => (
            <CommentSkeleton key={i} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>No comments yet</div>
          <div style={{ fontSize: 12 }}>Be the first to share your thoughts!</div>
        </div>
      ) : (
        <>
          <div>
            {displayed.map(c => (
              <CommentItem
                key={c.id}
                comment={c}
                videoId={videoId}
                videoOwnerId={videoOwnerId}
                likedIds={likedIds}
                onLikeToggle={handleLike}
                onDelete={handleDelete}
                onNewComment={handleNewComment}
                allComments={comments}
              />
            ))}
          </div>

          {/* Load more / show less */}
          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {showCount < comments.length && (
              <button
                onClick={() => setShowCount(n => n + 6)}
                style={{
                  padding: "9px 22px", borderRadius: 99,
                  border: `1px solid ${C.border}`, background: C.bg3,
                  color: C.text, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text; }}
              >
                Load more ↓
              </button>
            )}
            {showCount > 8 && (
              <button
                onClick={() => setShowCount(8)}
                style={{
                  padding: "9px 22px", borderRadius: 99,
                  border: `1px solid ${C.border}`, background: "none",
                  color: C.muted, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Show less ↑
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TREE HELPERS (unchanged from original)
───────────────────────────────────────────────────────────── */
function updateCount(comments, id, delta) {
  return comments.map(c => {
    if (c.id === id) return { ...c, likes_count: Math.max(0, (c.likes_count || 0) + delta) };
    if (c.replies?.length) return { ...c, replies: updateCount(c.replies, id, delta) };
    return c;
  });
}

function removeComment(comments, id) {
  return comments
    .filter(c => c.id !== id)
    .map(c => c.replies?.length ? { ...c, replies: removeComment(c.replies, id) } : c);
}

function addReply(comments, parentId, reply) {
  return comments.map(c => {
    if (c.id === parentId || (c.replies && c.replies.some(r => r.id === parentId))) {
      return { ...c, replies: [...(c.replies || []), { ...reply, replies: [] }] };
    }
    return c;
  });
}
