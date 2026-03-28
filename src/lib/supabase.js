import { createClient } from "@supabase/supabase-js";
import { AVATARS } from '../data/theme';

const URL = process.env.REACT_APP_SUPABASE_URL || "https://your-project.supabase.co";
const ANON = process.env.REACT_APP_SUPABASE_ANON || "your-anon-key";

export const supabase = createClient(URL, ANON, {
  auth: { persistSession: true, autoRefreshToken: true },
  realtime: { params: { eventsPerSecond: 10 } },
});

// ── In-memory cache ────────────────────────────────────────────────────────
const CACHE = new Map();
const TTL = { short: 30_000, medium: 60_000, long: 300_000 };

export const cache = {
  get: (k) => { const e = CACHE.get(k); if (!e) return null; if (Date.now() - e.ts > e.ttl) { CACHE.delete(k); return null; } return e.data; },
  set: (k, data, ttl = TTL.medium) => { CACHE.set(k, { data, ts: Date.now(), ttl }); return data; },
  del: (k) => CACHE.delete(k),
  bust: (pat) => { for (const k of CACHE.keys()) if (k.includes(pat)) CACHE.delete(k); },
  clear: () => CACHE.clear(),
};

// ── Auth API ───────────────────────────────────────────────────────────────
export const authAPI = {
  async signUp({ email, password, username, displayName, avatarId }) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email address");
    const taken = await profileAPI.checkUsername(username);
    if (taken) throw new Error("Username is already taken");
    const selectedAvatar = AVATARS.find(av => av.id === avatarId);
    const avatarEmoji = selectedAvatar?.emoji || "🦋";
    const avatarBg = selectedAvatar?.bg || "linear-gradient(135deg,#c084fc,#818cf8)";
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username: username.toLowerCase().trim(), display_name: displayName, avatar_emoji: avatarEmoji, avatar_bg: avatarBg, avatar_id: avatarId } }
    });
    if (error) throw error;
    return data;
  },

  async signIn({ email, password }) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email address");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google", options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return data;
  },

  async signOut() { cache.clear(); return supabase.auth.signOut(); },

  async resetPassword(email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email address");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
    if (error) throw error;
  },

  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  getSession: async () => (await supabase.auth.getSession()).data.session,
};

// ── Profile API ────────────────────────────────────────────────────────────
export const profileAPI = {
  async getById(id) {
    const cached = cache.get(`profile:${id}`);
    if (cached) return cached;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return cache.set(`profile:${id}`, data);
  },

  async getByUsername(username) {
    const cached = cache.get(`profile:u:${username}`);
    if (cached) return cached;
    const { data, error } = await supabase.from("profiles").select("*").eq("username", username.toLowerCase().trim()).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return cache.set(`profile:u:${username}`, data);
  },

  async checkUsername(username) {
    const { data } = await supabase.from("profiles").select("id").eq("username", username.toLowerCase()).maybeSingle();
    return !!data;
  },

  async update(id, updates) {
    const { data, error } = await supabase.from("profiles").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) throw error;
    cache.bust(`profile:${id}`);
    return data;
  },

  async uploadAvatar(userId, file) {
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await profileAPI.update(userId, { avatar_url: publicUrl });
    return publicUrl;
  },

  async search(q) {
    const { data, error } = await supabase.from("profiles")
      .select("id,username,display_name,avatar_url,avatar_emoji,avatar_bg,is_verified,followers_count")
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(20);
    if (error) throw error;
    return data || [];
  },

  // ── NEW: Paginated list of all profiles for Channels page ───────────────
  async getPaginated({ page = 0, limit = 20 } = {}) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,username,display_name,avatar_url,avatar_emoji,avatar_bg,is_verified,followers_count,following_count,bio")
      .order("followers_count", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    if (error) throw error;
    return data || [];
  },
};

// ── Follow API ─────────────────────────────────────────────────────────────
export const followAPI = {
  async isFollowing(followerId, followingId) {
    if (!followerId) return false;
    const k = `follow:${followerId}:${followingId}`;
    const cached = cache.get(k);
    if (cached !== null) return cached;
    const { data } = await supabase.from("follows").select("id").eq("follower_id", followerId).eq("following_id", followingId).maybeSingle();
    return cache.set(k, !!data, TTL.short);
  },

  // Returns random creators — shuffled server-side via random() to avoid
  // always returning the same first N rows
  async getRandomCreators(limit = 26) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,username,display_name,avatar_url,avatar_emoji,avatar_bg,is_verified,followers_count,following_count')
      .limit(60); // fetch more, shuffle client-side for variety
    if (error) throw error;
    return (data || []).sort(() => 0.5 - Math.random()).slice(0, limit);
  },

  async follow(followerId, followingId) {
    const { error } = await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
    if (error) throw error;
    cache.bust(`follow:${followerId}`);
    cache.bust(`profile:${followerId}`);
    cache.bust(`profile:${followingId}`);
    await notifAPI.create({ userId: followingId, actorId: followerId, type: "follow" }).catch(() => {});
  },

  async unfollow(followerId, followingId) {
    const { error } = await supabase.from("follows").delete().eq("follower_id", followerId).eq("following_id", followingId);
    if (error) throw error;
    cache.bust(`follow:${followerId}`);
    cache.bust(`profile:${followerId}`);
    cache.bust(`profile:${followingId}`);
  },

  async getFollowers(userId) {
    const { data, error } = await supabase.from("follows")
      .select("profiles!follows_follower_id_fkey(id,username,display_name,avatar_url,avatar_emoji,avatar_bg,is_verified,followers_count)")
      .eq("following_id", userId);
    if (error) throw error;
    return (data || []).map(d => d.profiles).filter(Boolean);
  },

  async getFollowing(userId) {
    const { data, error } = await supabase.from("follows")
      .select("profiles!follows_following_id_fkey(id,username,display_name,avatar_url,avatar_emoji,avatar_bg,is_verified,followers_count)")
      .eq("follower_id", userId);
    if (error) throw error;
    return (data || []).map(d => d.profiles).filter(Boolean);
  },

  async getFollowingIds(userId) {
    const k = `followingIds:${userId}`;
    const cached = cache.get(k);
    if (cached) return cached;
    const { data } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
    return cache.set(k, (data || []).map(d => d.following_id), TTL.short);
  },

  // Cancel a pending follow request (sender cancels their own request)
  cancelFollowRequest: async (senderId, recipientId) => {
    try {
      if (!senderId || !recipientId) throw new Error("Missing sender or recipient ID");
      if (senderId === recipientId) throw new Error("Cannot follow yourself");
      const { error, count } = await supabase
        .from("follow_requests")
        .delete({ count: 'exact' })
        .match({ sender_id: senderId, recipient_id: recipientId, status: 'pending' });
      if (error) throw error;
      if (count === 0) return { success: false, message: "Request no longer exists." };
      return { success: true };
    } catch (err) {
      console.error("cancelFollowRequest error:", err.message);
      return { success: false, error: err.message };
    }
  },

  // Send a follow request — inserts pending row, notifies recipient via realtime
  async sendFollowRequest(senderId, recipientId) {
    if (!senderId || !recipientId) throw new Error("Missing sender or recipient");
    if (senderId === recipientId) throw new Error("Cannot follow yourself");

    const { data: existing } = await supabase
      .from("follow_requests")
      .select("id, status")
      .eq("sender_id", senderId)
      .eq("recipient_id", recipientId)
      .maybeSingle();

    if (existing) {
      if (existing.status === "pending") return { alreadyPending: true };
      if (existing.status === "rejected") {
        const { error } = await supabase
          .from("follow_requests")
          .update({ status: "pending", created_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
        return { reSent: true };
      }
    }

    const { data, error } = await supabase
      .from("follow_requests")
      .insert({ sender_id: senderId, recipient_id: recipientId, status: "pending", created_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;

    await notifAPI.create({ userId: recipientId, actorId: senderId, type: "follow_request" }).catch(() => {});
    return data;
  },

  // Accept a follow request — creates follow, increments counters, notifies sender
  async acceptFollowRequest(requestId, senderId, recipientId) {
    if (!requestId || !senderId || !recipientId) throw new Error("Missing required fields for accept");

    const { error: followError } = await supabase
      .from("follows")
      .upsert({ follower_id: senderId, following_id: recipientId }, { onConflict: "follower_id,following_id" });
    if (followError) throw followError;

    // Increment followers_count on recipient
    const { error: rpc1Err } = await supabase.rpc("increment_followers_count", { target_user_id: recipientId });
    if (rpc1Err) {
      const { data: rp } = await supabase.from("profiles").select("followers_count").eq("id", recipientId).single();
      if (rp) await supabase.from("profiles").update({ followers_count: (rp.followers_count || 0) + 1 }).eq("id", recipientId);
    }

    // Increment following_count on sender
    const { error: rpc2Err } = await supabase.rpc("increment_following_count", { target_user_id: senderId });
    if (rpc2Err) {
      const { data: sp } = await supabase.from("profiles").select("following_count").eq("id", senderId).single();
      if (sp) await supabase.from("profiles").update({ following_count: (sp.following_count || 0) + 1 }).eq("id", senderId);
    }

    await notifAPI.create({ userId: senderId, actorId: recipientId, type: "follow_accepted" }).catch(() => {});
    await supabase.from("follow_requests").update({ status: "accepted" }).eq("id", requestId);

    cache.bust(`follow:${senderId}`);
    cache.bust(`followingIds:${senderId}`);
    cache.bust(`profile:${recipientId}`);
    cache.bust(`profile:${senderId}`);
  },

  // Reject a follow request — marks rejected so sender can re-request later
  async rejectFollowRequest(requestId) {
    if (!requestId) throw new Error("Missing requestId");
    const { error } = await supabase.from("follow_requests").update({ status: "rejected" }).eq("id", requestId);
    if (error) throw error;
  },

  // Load all pending requests for a user on page load
  async getPendingRequests(recipientId) {
    if (!recipientId) return [];
    const { data, error } = await supabase
      .from("follow_requests")
      .select(`id, sender_id, created_at, sender:profiles!follow_requests_sender_id_fkey(id,username,display_name,avatar_url,avatar_emoji,avatar_bg)`)
      .eq("recipient_id", recipientId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) { console.error("getPendingRequests error:", error.message); return []; }
    return (data || []).map(r => ({
      id: r.id, sender_id: r.sender_id,
      sender_username: r.sender?.username || "",
      sender_display_name: r.sender?.display_name || r.sender?.username || "Someone",
      sender_avatar: r.sender?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.sender?.username}`,
    }));
  },

  // Check request status for a sender→recipient pair
  async getRequestStatus(senderId, recipientId) {
    if (!senderId || !recipientId) return null;
    const { data } = await supabase.from("follow_requests").select("id, status").eq("sender_id", senderId).eq("recipient_id", recipientId).maybeSingle();
    return data?.status || null;
  },

  // Realtime subscription — fires when a new follow_request INSERT hits the DB
  subscribeToFollowRequests(recipientId, onNewRequest) {
    const channel = supabase
      .channel(`follow_requests:recipient:${recipientId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "follow_requests", filter: `recipient_id=eq.${recipientId}` },
        async (payload) => {
          try {
            const { data: sender } = await supabase.from("profiles")
              .select("id,username,display_name,avatar_url,avatar_emoji").eq("id", payload.new.sender_id).single();
            onNewRequest({
              id: payload.new.id, sender_id: payload.new.sender_id,
              sender_username: sender?.username || "",
              sender_display_name: sender?.display_name || sender?.username || "Someone",
              sender_avatar: sender?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender?.username}`,
            });
          } catch (err) { console.error("subscribeToFollowRequests error:", err); }
        }
      ).subscribe();
    return channel;
  },
};

// ── Video API ──────────────────────────────────────────────────────────────
export const videoAPI = {


  delete: async (videoId) => {
    const { data, error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);

    if (error) throw error;
    return data;
  },

  //async getCategories() {
    //const { data } = await supabase.rpc('get_unique_categories');
    //return data?.map(r => r.category) || [];
  //},

  async getUniversalFeed(userId, page, limit, category, filter) {
    const { data, error } = await supabase.rpc('get_universal_feed', {
      p_user_id: userId,
      p_page: page,
      p_limit: limit,
      p_category: category,
      p_filter: filter
    });

    if (error) throw error;
    if (!data?.length) return [];

    // Fetch creators for these videos
    const uids = [...new Set(data.map(v => v.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, is_verified")
      .in("id", uids);

    const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
    return data.map(v => ({ ...v, profiles: profileMap[v.user_id] }));
  },

  // Smart feed using the DB function — handles following priority + category filter
  // For guests (userId=null): returns top videos by engagement
  // For logged-in users: returns followed-user videos first, then global
  async getSmartFeed(userId = null, page = 0, limit = 12, category = null) {
    const { data, error } = await supabase.rpc('get_smart_feed', {
      p_user_id: userId,
      p_page: page,
      p_limit: limit,
      p_category: category,
    });
    if (error) throw error;
    // Attach profiles to each video in a second pass if not joined in RPC
    // (The RPC returns videos rows; profiles join may need a separate query)
    if (!data?.length) return [];
    const videoIds = data.map(v => v.user_id).filter(Boolean);
    if (!videoIds.length) return data;
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,username,display_name,avatar_url,avatar_emoji,avatar_bg,is_verified,followers_count")
      .in("id", [...new Set(videoIds)]);
    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    return data.map(v => ({ ...v, profiles: profileMap[v.user_id] || null }));
  },

  // Standard paginated feed (fallback when smart feed RPC unavailable)
  async getFeed({ page = 0, limit = 12, category = null, userId = null, followingIds = null } = {}) {
    let q = supabase.from("videos")
      .select("*, profiles(id,username,display_name,avatar_url,avatar_emoji,avatar_bg,is_verified,followers_count)")
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    // Support both old `category` text column and new `categories` array column
    if (category) q = q.contains("categories", [category]);
    if (userId) q = q.eq("user_id", userId);

    if (followingIds?.length) {
      q = supabase.from("videos")
        .select("*, profiles(id,username,display_name,avatar_url,avatar_emoji,avatar_bg,is_verified,followers_count)")
        .in("user_id", followingIds)
        .order("created_at", { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);
      if (category) q = q.contains("categories", [category]);
    }

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },

  async getTrending(limit = 12) {
    const { data, error } = await supabase.from("videos")
      .select("*, profiles(id,username,display_name,avatar_url,avatar_emoji,avatar_bg,is_verified)")
      .order("views", { ascending: false })
      .order("likes_count", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  // ── NEW: Fetch all unique categories from the videos table ───────────────
  // Unnests the `categories` array column → returns deduplicated list
  // Falls back to the old `category` text column if array is empty
  async getCategories() {
    const cacheKey = "video:categories";
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // Try the new categories array column first
    const { data, error } = await supabase.rpc("get_unique_categories");
    if (!error && data?.length) {
      return cache.set(cacheKey, data.map(r => r.category).filter(Boolean).sort(), TTL.long);
    }

    // Fallback: query the old text column
    const { data: fallback } = await supabase
      .from("videos")
      .select("category")
      .not("category", "is", null)
      .limit(500);

    const unique = [...new Set((fallback || []).map(r => r.category).filter(Boolean))].sort();
    return cache.set(cacheKey, unique, TTL.long);
  },

  async search(q) {
    const { data, error } = await supabase.from("videos")
      .select("*, profiles(id,username,display_name,avatar_url,avatar_emoji,avatar_bg)")
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(20);
    if (error) throw error;
    return data || [];
  },

  async getViewCount(videoId) {
    const { data, error } = await supabase.from("videos").select("views").eq("id", videoId).single();
    if (error) throw error;
    return data?.views ?? null;
  },

  async incrementViews(id) {
    const { data, error } = await supabase.rpc("increment_views", { video_id: id });
    if (error) throw error;
    cache.del(`video:${id}`);
    return data;
  },

  async upload({ userId, file, thumbnail, title, description, category, tags, isVip, duration }) {
    const ext = file.name.split(".").pop();
    const videoPath = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("videos").upload(videoPath, file);
    if (upErr) throw upErr;
    const { data: { publicUrl: videoUrl } } = supabase.storage.from("videos").getPublicUrl(videoPath);
    let thumbUrl = null;
    if (thumbnail) {
      const tp = `${userId}/${Date.now()}_thumb.jpg`;
      await supabase.storage.from("thumbnails").upload(tp, thumbnail, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from("thumbnails").getPublicUrl(tp);
      thumbUrl = publicUrl;
    }
    // Store category in both old column and new array for compatibility
    const { data, error } = await supabase.from("videos").insert({
      user_id: userId, video_url: videoUrl, thumbnail_url: thumbUrl,
      title, description,
      category,                                    // legacy text column
      categories: category ? [category] : [],      // new array column
      tags, is_vip: isVip, duration,
    }).select("*, profiles(id,username,display_name,avatar_url)").single();
    if (error) throw error;
    cache.bust("feed:");
    cache.del("video:categories"); // bust category cache when new video uploaded
    await notifAPI.notifyFollowers(userId, "video", data.id).catch(() => {});
    return data;
  },

  async delete(videoId, userId) {
    const { error } = await supabase.from("videos").delete().eq("id", videoId).eq("user_id", userId);
    if (error) throw error;
    cache.bust("feed:");
    cache.del(`video:${videoId}`);
  },
};

// ── Like API ───────────────────────────────────────────────────────────────
export const likeAPI = {
  async isLiked(userId, videoId) {
    if (!userId) return false;
    const k = `like:${userId}:${videoId}`;
    const c = cache.get(k);
    if (c !== null) return c;
    const { data } = await supabase.from("video_likes").select("id").eq("user_id", userId).eq("video_id", videoId).maybeSingle();
    return cache.set(k, !!data, TTL.short);
  },

  async toggle(userId, videoId, isLiked, videoOwnerId) {
    if (isLiked) {
      await supabase.from("video_likes").delete().eq("user_id", userId).eq("video_id", videoId);
    } else {
      await supabase.from("video_likes").insert({ user_id: userId, video_id: videoId });
      if (videoOwnerId && videoOwnerId !== userId) {
        await notifAPI.create({ userId: videoOwnerId, actorId: userId, type: "like", videoId }).catch(() => {});
      }
    }
    cache.del(`like:${userId}:${videoId}`);
    cache.del(`video:${videoId}`);
  },

  async isSaved(userId, videoId) {
    if (!userId) return false;
    const k = `save:${userId}:${videoId}`;
    const c = cache.get(k);
    if (c !== null) return c;
    const { data } = await supabase.from("saved_videos").select("id").eq("user_id", userId).eq("video_id", videoId).maybeSingle();
    return cache.set(k, !!data, TTL.short);
  },

  async toggleSave(userId, videoId, isSaved) {
    if (isSaved) {
      await supabase.from("saved_videos").delete().eq("user_id", userId).eq("video_id", videoId);
    } else {
      await supabase.from("saved_videos").insert({ user_id: userId, video_id: videoId });
    }
    cache.del(`save:${userId}:${videoId}`);
  },

  async getSaved(userId) {
    const { data, error } = await supabase.from("saved_videos")
      .select("videos(*, profiles(id,username,display_name,avatar_url,avatar_emoji,avatar_bg))")
      .eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(d => d.videos).filter(Boolean);
  },

  async getLikedVideoIds(userId, videoIds) {
    if (!userId || !videoIds.length) return [];
    const { data } = await supabase.from("video_likes").select("video_id").eq("user_id", userId).in("video_id", videoIds);
    return (data || []).map(d => d.video_id);
  },
};

// ── Comment API ────────────────────────────────────────────────────────────
export const commentAPI = {
  async getForVideo(videoId) {
    const { data, error } = await supabase
      .from("comments")
      .select(`*, profiles:user_id(id,username,display_name,avatar_url,avatar_emoji,avatar_bg)`)
      .eq("video_id", videoId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async add({ videoId, userId, body, parentId = null, videoOwnerId = null, reply_to_user = null }) {
    const { data, error } = await supabase.from("comments")
      .insert({ video_id: videoId, user_id: userId, body, parent_id: parentId, reply_to_user })
      .select("*, profiles(id,username,display_name,avatar_url,avatar_emoji,avatar_bg)")
      .single();
    if (error) { console.error('Comment insert error:', error); throw error; }
    if (videoOwnerId && videoOwnerId !== userId && !parentId) {
      await notifAPI.create({ userId: videoOwnerId, actorId: userId, type: "comment", videoId, commentId: data.id }).catch(() => {});
    }
    return data;
  },

  async delete(commentId, userId) {
    const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("user_id", userId);
    if (error) throw error;
  },

  async toggleLike(userId, commentId, isLiked) {
    if (isLiked) await supabase.from("comment_likes").delete().eq("user_id", userId).eq("comment_id", commentId);
    else await supabase.from("comment_likes").insert({ user_id: userId, comment_id: commentId });
  },

  async getLikedIds(userId, commentIds) {
    if (!userId || !commentIds.length) return [];
    const { data } = await supabase.from("comment_likes").select("comment_id").eq("user_id", userId).in("comment_id", commentIds);
    return (data || []).map(d => d.comment_id);
  },

  subscribeToVideo(videoId, cb) {
    return supabase.channel(`comments:${videoId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `video_id=eq.${videoId}` }, cb)
      .subscribe();
  },
};

// ── Notification API ───────────────────────────────────────────────────────
export const notifAPI = {
  async getForUser(userId) {
    const { data, error } = await supabase.from("notifications")
      .select("*, actor:profiles!notifications_actor_id_fkey(id,username,display_name,avatar_url,avatar_emoji,avatar_bg), videos(id,title,thumbnail_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) throw error;
    return data || [];
  },

  async create({ userId, actorId, type, videoId = null, commentId = null }) {
    if (userId === actorId) return;
    await supabase.from("notifications").insert({
      user_id: userId, actor_id: actorId, type,
      video_id: videoId || null, comment_id: commentId || null,
    });
  },

  async markRead(userId) {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
  },

  async markOneRead(notifId) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", notifId);
  },

  async getUnreadCount(userId) {
    const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_read", false);
    return count || 0;
  },

  async notifyFollowers(userId, type, videoId = null) {
    const { data } = await supabase.from("follows").select("follower_id").eq("following_id", userId);
    if (!data?.length) return;
    const inserts = data.map(d => ({ user_id: d.follower_id, actor_id: userId, type, video_id: videoId }));
    await supabase.from("notifications").insert(inserts);
  },

  subscribe(userId, cb) {
    return supabase.channel(`notifs:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, cb)
      .subscribe();
  },
};

// ── VIP API ────────────────────────────────────────────────────────────────
export const vipAPI = {
  async upgrade(userId) {
    const { data, error } = await supabase.from("profiles").update({ is_vip: true }).eq("id", userId).select().single();
    if (error) throw error;
    cache.bust(`profile:${userId}`);
    return data;
  },
};

// ── History API ────────────────────────────────────────────────────────────
export const historyAPI = {
  async addToHistory(userId, videoId) {
    if (!userId || !videoId) return;
    const { error } = await supabase.from("watch_history")
      .upsert({ user_id: userId, video_id: videoId, watched_at: new Date().toISOString() }, { onConflict: 'user_id, video_id' });
    if (error) console.error("Error updating history:", error.message);
  },

  async getHistory(userId) {
    if (!userId) return [];
    const { data, error } = await supabase.from("watch_history")
      .select(`id, watched_at, video:video_id(id,title,thumbnail_url,video_url,views,views,category,categories,duration)`)
      .eq("user_id", userId)
      .order("watched_at", { ascending: false });
    if (error) return [];
    return data.map(item => ({ ...item.video, watched_at: item.watched_at, historyId: item.id }));
  },

  async deleteHistoryItem(historyId) {
    return await supabase.from("watch_history").delete().eq("id", historyId);
  },

  async clearAllHistory(userId) {
    return await supabase.from("watch_history").delete().eq("user_id", userId);
  },
};


export const payoutAPI = {
  executeWithdrawal: async (userId, data) => {
    const { data: updatedProfile, error } = await supabase.rpc('process_withdrawal', {
      p_user_id: userId,
      p_amount_usd: data.amountUSD,
      p_currency: data.currency,
      p_converted_amount: data.convertedAmount,
      p_method: data.method,
      p_account_name: data.accountName,
      p_account_details: data.accountDetails
    });

    if (error) throw error;
    return updatedProfile; // This is the profile with the NEW balance
  }
};
