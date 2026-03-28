import { useState, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Toast } from "./components/ui/index";
import { useIsMobile } from "./hooks/index";
import Header from "./components/layout/Header";
import NavTabs from "./components/layout/NavTabs";
import PlayerModal from "./components/player/PlayerModal";
import AuthModal from "./components/auth/AuthModal";
import SearchModal from "./components/SearchModal";
import VipModal from "./components/VipModal";
import UploadModal from "./components/upload/UploadModal";
import NotifPanel from "./components/notifications/NotifPanel";
import ProfilePage from "./components/profile/ProfilePage";
import SplashScreen from "./pages/SplashScreen";
import AgeGate from "./pages/AgeGate";
import HomePage from "./pages/HomePage";
import CategoriesPage from "./pages/CategoriesPage";
import ChannelsPage from "./pages/ChannelsPage";
import VIPPage from "./pages/VIPPage";
import Footer from "./components/layout/Footer";
import { useLocation } from "react-router-dom";

function AppInner() {
  const { tab, player, setTab, setPlayer, toast, theme, prevTab } = useApp();
  const isMobile = useIsMobile();
  const [splash, setSplash] = useState(() => !sessionStorage.getItem("lx_splash"));
  const [ageOk, setAgeOk] = useState(() => !!localStorage.getItem("lx_age"));
  const [showTop, setShowTop] = useState(false);
  const [catFilter, setCatFilter] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);


  useEffect(() => {
    const h = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  if (splash) return <SplashScreen onDone={() => { setSplash(false); sessionStorage.setItem("lx_splash", "1"); }} />;
  if (!ageOk) return <AgeGate onEnter={() => { localStorage.setItem("lx_age", "1"); setAgeOk(true); }} />;

  // 1. Unified Profile Identification
  const isProfileObj = typeof tab === 'object' && tab?.type === 'profile';

  // Get ID from string "profile:id" OR from object { type: 'profile', id: '...' }
  const activeUserId = isProfileObj
    ? (tab.id || tab.userId)
    : (typeof tab === 'string' && tab.startsWith("profile:"))
      ? tab.split(":")[1]
      : null;

  const profileData = isProfileObj ? tab.data : null;


  // 2. Category Logic (THIS IS THE MISSING PIECE)
  const catMatch = (typeof tab === 'string' && tab.startsWith("cat:")) ? tab.slice(4) : null;

  const mainTabs = ["home", "trending", "new", "saved", "history", "categories", "channels", "vip"];

  const isViewingProfile = typeof tab === 'string' && tab.startsWith("profile:");

  return (
    <div style={{
      background: "var(--bg)", color: "var(--text)", fontFamily: "'DM Sans',sans-serif",
    }}>
      <Header />
      <NavTabs />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "12px 12px 80px" : "24px 24px 40px", flex: "1 0 auto", width: "100%" }}>
        {activeUserId ? (
          /* 1. PROFILE PAGE (Priority) */
          <ProfilePage
            key={activeUserId} // Forces refresh when switching users
            userId={activeUserId}
            passedData={profileData}
            onClose={() => setTab(prevTab)}
          />
        ) : (
          /* 2. ALL OTHER TABS */
          <>
            {catMatch && <HomePage tab="home" catFilter={catFilter || catMatch}
              setCatFilter={setCatFilter} />}
            {!catMatch && (
              <>
                {["home", "trending", "new", "saved", "history"].includes(tab) && <HomePage tab={tab}
                  catFilter={catFilter}
                  setCatFilter={setCatFilter}
                  filter={filter}
                  setFilter={setFilter} />}
                {tab === 'categories' && (
                  <CategoriesPage
                    setTab={setTab}
                    setCatFilter={setCatFilter}
                    setFilter={setFilter}
                  />
                )}
                {tab === "channels" && <ChannelsPage />}
                {tab === "vip" && <VIPPage />}
              </>
            )}
          </>
        )}
      </main>

      {/* All Modals */}
      {/* All Modals */}
      {/* All Modals */}
      {player && (
        <PlayerModal
          video={player}
          onClose={() => setPlayer(null)}
        />
      )}
      <AuthModal />
      <SearchModal />
      <VipModal />
      <UploadModal />
      <NotifPanel />
      <Toast toast={toast} />

      {/* Back to top */}
      {showTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{
          position: "fixed", bottom: isMobile ? 70 : 28, right: 16,
          width: 42, height: 42, borderRadius: "50%",
          background: `linear-gradient(135deg,${C_accent},${C_accent2})`,
          border: "none", color: "white", fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 24px rgba(192,132,252,.5)", zIndex: 500,
          animation: "float 3s ease-in-out infinite",
        }}>↑</button>
      )}
      <Footer style={{ flexShrink: 0 }} />
    </div>
  );
}

const C_accent = "var(--accent)";
const C_accent2 = "var(--accent2)";

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
