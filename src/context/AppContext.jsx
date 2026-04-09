import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase, authAPI, profileAPI, notifAPI } from "../lib/supabase";

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [player, setPlayer] = useState(null);
  const [search, setSearch] = useState(false);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState("home");
  const [authModal, setAuthModal] = useState(null);
  const [vipModal, setVipModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  // This ensures "light" is the fallback if nothing is saved
// In AppContext.js
const [theme, setThemeState] = useState(() => {
  const saved = localStorage.getItem("lx_theme");
  // If NOTHING is saved, strictly return "light"
  if (!saved) return "light";
  return saved;
});



  const toastTimer = useRef(null);
  const [activeProfile, setActiveProfile] = useState(null);
  const [prevTab, setPrevTab] = useState("home");

const changeTab = useCallback((newTab) => {
  setTab((currentTab) => {
    // If we are moving TO a profile, remember where we are coming FROM
    if (typeof newTab === 'string' && newTab.startsWith("profile:")) {
      setPrevTab(currentTab);
    }
    return newTab;
  });
}, []);



  
// 1. Add this function inside your AppProvider component
// In AppContext.js, update incrementView
const incrementView = async (videoId) => {
  try {
    const { data: newCount, error } = await supabase.rpc('increment_views', { 
      vid: videoId 
    });

    if (error) throw error;

    // Dispatch for the Modal to hear it
    window.dispatchEvent(new CustomEvent('video_view_updated', {
      detail: { videoId: videoId, views: newCount }
    }));

    // OPTIONAL: If the video is in the global player state, update it there too
    setPlayer(prev => {
      if (prev?.id === videoId) {
        return { ...prev, views: newCount, views_count: newCount };
      }
      return prev;
    });

  } catch (err) {
    console.error("View increment failed:", err);
  }
};

const playVideo = useCallback(async (video) => {
    if (video.is_vip && !profile?.is_vip) { 
      setVipModal(true); 
      return; 
    }
    setPlayer(video);
  }, [profile, setPlayer, setVipModal]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("lx_theme", theme);
  }, [theme]);


const toggleTheme = useCallback(() => {
  setThemeState(prev => {
    const next = prev === "light" ? "dark" : "light";
    
    // Smooth transition logic
    document.documentElement.classList.add("theme-transition");
    
    // Update the meta tag for mobile browser bars
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'dark' ? '#030308' : '#f8f8ff');

    setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 400);

    return next;
  });
}, []);

  // Auth init
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else { setProfile(null); setAuthReady(true); setNotifCount(0); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Notification subscription
  useEffect(() => {
    if (!session?.user?.id) return;
    notifAPI.getUnreadCount(session.user.id).then(setNotifCount).catch(() => { });
    const sub = notifAPI.subscribe(session.user.id, () => {
      setNotifCount(c => c + 1);
    });
    return () => sub?.unsubscribe();
  }, [session?.user?.id]);

  const loadProfile = async (id) => {
    try {
      const p = await profileAPI.getById(id);
      setProfile(p);
    } catch (e) {
      console.error("Profile load:", e);
    } finally {
      setAuthReady(true);
    }
  };

  const showToast = useCallback((msg, type = "info") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);



  useEffect(() => {
    // This listener is the "bridge" between your phone and laptop
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth Event:", event); // Debug to see the magic happen
      setSession(session);

      // If a session appears (from phone verification) or user signs in
      if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION')) {
        setAuthModal(null); // This will close the modal on your laptop!
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  // Inside AppProvider in AppContext.js
  const signOut = useCallback(async () => {
    try {
      await authAPI.signOut();

      // 1. Clear User Data
      setSession(null);
      setProfile(null);
      setNotifCount(0);

      setTab("home");

      setVipModal(false);
      setUploadModal(false);
      setNotifOpen(false);

      showToast("Signed out", "success");
    } catch (error) {
      showToast("Error signing out", "error");
    }
  }, [showToast, setTab]); // Add setTab to the dependency array


  const refreshProfile = useCallback(() => {
    if (session?.user?.id) loadProfile(session.user.id);
  }, [session]);

  return (
    <Ctx.Provider value={{
      session, profile, authReady,
      player, setPlayer, playVideo, activeProfile, setActiveProfile,
      search, setSearch,incrementView,
      toast, showToast, setTab:changeTab,
      tab,prevTab,
      authModal, setAuthModal,
      vipModal, setVipModal,
      uploadModal, setUploadModal,
      notifOpen, setNotifOpen,
      notifCount, setNotifCount,
      theme, toggleTheme,
      signOut, refreshProfile, loadProfile,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
