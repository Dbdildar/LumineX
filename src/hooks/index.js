import { useState, useEffect, useCallback, useRef } from "react";
import { likeAPI, followAPI } from "../lib/supabase";
import { useApp } from "../context/AppContext";

export function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
}

export function useIsTablet() {
  const [t, setT] = useState(() => window.innerWidth < 1024);
  useEffect(() => {
    const h = () => setT(window.innerWidth < 1024);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return t;
}

export function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => { try { return JSON.parse(localStorage.getItem(key)) ?? init; } catch { return init; } });
  const set = useCallback(v => { setVal(v); localStorage.setItem(key, JSON.stringify(v)); }, [key]);
  return [val, set];
}

export function useDebounce(value, delay) {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

export function useInfiniteScroll(cb, hasMore) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !hasMore) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) cb(); }, { threshold: 0.1 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [cb, hasMore]);
  return ref;
}

// Optimistic video like with immediate UI update
export function useVideoLike(videoId, initialLiked, initialCount) {
  const { session, setAuthModal } = useApp();
  const [liked, setLiked] = useState(!!initialLiked);
  const [count, setCount] = useState(Number(initialCount) || 0);
  const pending = useRef(false);

  useEffect(() => { setLiked(!!initialLiked); }, [initialLiked]);
  useEffect(() => { setCount(Number(initialCount) || 0); }, [initialCount]);

  const toggle = useCallback(async () => {
    if (!session) { setAuthModal("login"); return; }
    if (pending.current) return;
    pending.current = true;
    const next = !liked;
    // Optimistic update — immediate
    setLiked(next);
    setCount(c => next ? c + 1 : Math.max(0, c - 1));
    try {
      await likeAPI.toggle(session.user.id, videoId, liked);
    } catch {
      // Revert on error
      setLiked(liked);
      setCount(c => next ? Math.max(0, c - 1) : c + 1);
    } finally { pending.current = false; }
  }, [session, liked, videoId, setAuthModal]);

  return { liked, count, toggle };
}

// Optimistic follow with immediate counter update
export function useFollow(targetUserId, initialFollowing, targetProfile, setTargetProfile) {
  const { session, setAuthModal, showToast } = useApp();
  const [following, setFollowing] = useState(!!initialFollowing);
  const [loading,   setLoading]   = useState(false);
  const pending = useRef(false);

  useEffect(() => { setFollowing(!!initialFollowing); }, [initialFollowing]);

  const toggle = useCallback(async () => {
    if (!session) { setAuthModal("login"); return; }
    if (session.user.id === targetUserId) return;
    if (pending.current) return;
    pending.current = true;
    const next = !following;
    // Optimistic update — immediate
    setFollowing(next);
    if (setTargetProfile && targetProfile) {
      setTargetProfile(p => ({ ...p, followers_count: Math.max(0, (p.followers_count||0) + (next?1:-1)) }));
    }
    setLoading(true);
    try {
      if (next) await followAPI.follow(session.user.id, targetUserId);
      else      await followAPI.unfollow(session.user.id, targetUserId);
      showToast(next ? "✓ Following!" : "Unfollowed", "success");
    } catch {
      setFollowing(following);
      if (setTargetProfile && targetProfile) {
        setTargetProfile(p => ({ ...p, followers_count: Math.max(0, (p.followers_count||0) + (next?-1:1)) }));
      }
      showToast("Something went wrong", "error");
    } finally { setLoading(false); pending.current = false; }
  }, [session, following, targetUserId, setAuthModal, showToast, targetProfile, setTargetProfile]);

  return { following, toggle, loading, isOwn: session?.user?.id === targetUserId };
}
