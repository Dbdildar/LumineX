import React, { useState } from "react";
import { C } from "../ui/index";
import { useApp } from "../../context/AppContext";
import { useIsMobile } from "../../hooks/index";

// Desktop Tabs
const TABS = [
  { id: "home", label: "🏠 Home" },
  { id: "trending", label: "🔥 Trending" },
  { id: "new", label: "✨ New" },
  { id: "categories", label: "🏷 Categories" },
  { id: "channels", label: "📺 Channels" },
  { id: "saved", label: "❤️ Saved" },
  { id: "history", label: "🕐 History" },
  { id: "vip", label: "💎 VIP" }
];

// Mobile Bottom Bar Logic (5 Main Icons)
const MOB = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "search", icon: "🔍", label: "Search" },
  { id: "upload", icon: "➕", label: "Upload", isAction: true },
  { id: "trending", icon: "🔥", label: "Hot" },
  { id: "more", icon: "⋮", label: "More" }
];

export default function NavTabs() {
  const { tab, setTab, setSearch, setUploadModal, setVipModal } = useApp();
  const isMobile = useIsMobile();
  const [showMore, setShowMore] = useState(false);

  const handlePress = (id) => {
    if (id === "upload") return setUploadModal(true);
    if (id === "more") return setShowMore(!showMore);
    if (id === "search") return setSearch(true);
    setTab(id);
    setShowMore(false);
  };

  if (isMobile) return (
    <>
      {/* 1. The "More" Menu Overlay */}
      {showMore && (
        <div style={{
          position: "fixed", bottom: 70, right: 10, background: "rgba(15,15,25,0.95)",
          backdropFilter: "blur(20px)", borderRadius: 16, border: `1px solid ${C.border}`,
          padding: 8, zIndex: 1000, display: "flex", flexDirection: "column", gap: 4,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)", width: 140
        }}>
          {/* Added Saved Button Here */}
          <button onClick={() => {setTab("saved"); setShowMore(false);}} style={moreBtnStyle}>❤️ Saved</button>
          
          <button onClick={() => {setTab("channels"); setShowMore(false);}} style={moreBtnStyle}>📺 Channels</button>
          <button onClick={() => {setTab("categories"); setShowMore(false);}} style={moreBtnStyle}>🏷 Categories</button>
          <button onClick={() => {setVipModal(true); setShowMore(false);}} style={{...moreBtnStyle, color: "#fbbf24"}}>💎 VIP Plan</button>
         <button onClick={() => {setTab("history"); setShowMore(false);}} style={moreBtnStyle}>🕐 History</button>
        </div>
      )}

      {/* 2. Main Navigation Bar */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 900,
        background: "var(--headerBg)", backdropFilter: "blur(24px)",
        borderTop: `1px solid ${C.border}`, display: "flex", height: 60,
        paddingBottom: "env(safe-area-inset-bottom)"
      }}>
        {MOB.map((t) => {
          // Check if "More" should look active (e.g., if current tab is one of the hidden ones)
          const isHiddenTabActive = t.id === "more" && ["saved", "channels", "categories"].includes(tab);
          const isActive = tab === t.id || isHiddenTabActive;

          return (
            <button
              key={t.id}
              onClick={() => handlePress(t.id)}
              style={{
                flex: 1, background: "none", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 2, position: "relative",
                color: isActive ? C.accent : C.muted,
                transition: "transform 0.1s"
              }}
              onTouchStart={(e) => e.currentTarget.style.transform = "scale(0.9)"}
              onTouchEnd={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <div style={t.isAction ? uploadCircleStyle : {}}>
                <span style={{ fontSize: t.isAction ? 24 : 20, lineHeight: 1 }}>{t.icon}</span>
              </div>
              
              <span style={{ fontSize: 8, letterSpacing: .2, fontWeight: 600 }}>{t.label}</span>
              
              {isActive && !t.isAction && (
                <div style={{ position: "absolute", bottom: 2, width: 20, height: 2, background: C.accent, borderRadius: 2 }} />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );

  // Desktop Return
  return (
    <nav style={{ background: C.bg2, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 60, zIndex: 900, overflowX: "auto", scrollbarWidth: "none" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", padding: "0 20px", gap: 2, minWidth: "max-content" }}>
        {TABS.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{ padding: "12px 18px", fontSize: 12, fontWeight: 700, color: tab === t.id ? C.accent : C.muted, borderBottom: `2px solid ${tab === t.id ? C.accent : "transparent"}`, cursor: "pointer", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: .6 }}>{t.label}</div>
        ))}
      </div>
    </nav>
  );
}

const moreBtnStyle = {
  background: "none", border: "none", color: "#eee", padding: "10px 12px",
  textAlign: "left", fontSize: 13, fontWeight: 600, cursor: "pointer",
  borderRadius: 8, transition: "background 0.2s"
};

const uploadCircleStyle = {
  width: 38, height: 38, borderRadius: "50%",
  background: `linear-gradient(135deg, var(--accent), var(--accent2))`,
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "white", marginBottom: -2,
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
};
