import { useState } from "react";
import { C, Logo, AppIcon } from "../ui/index";
import { useApp } from "../../context/AppContext";
import { useIsMobile } from "../../hooks/index";

const LINKS = {
  Platform: [
    { label: "Home", tab: "home" },
    { label: "Trending", tab: "trending" },
    { label: "Categories", tab: "categories" },
    { label: "Channels", tab: "channels" },
    { label: "VIP Access", tab: "vip" },
  ],
  Account: [
    { label: "Sign Up", auth: "signup" },
    { label: "Login", auth: "login" },
    { label: "My Profile", profile: true },
    { label: "Upload Video", upload: true },
    { label: "Saved Videos", tab: "saved" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#", group: "Legal" },
    { label: "Terms of Service", href: "#", group: "Legal" },
    { label: "Cookie Policy", href: "#", group: "Legal" },
    { label: "DMCA", href: "#", group: "Legal" },
    { label: "18 U.S.C. § 2257", href: "#", group: "Legal" },
  ],
  Support: [
    { label: "Help Center", href: "#", group: "Support" },
    { label: "Contact Us", href: "#", group: "Support" },
    { label: "Report Content", href: "#", group: "Support" },
    { label: "Advertise", href: "#", group: "Support" },
    { label: "Become a Creator", href: "#", group: "Support" },
  ],
};

const SOCIALS = [
  { icon: "𝕏", label: "Twitter / X", href: "#", color: "#e7e9ea" },
  { icon: "f", label: "Facebook", href: "#", color: "#1877F2" },
  { icon: "in", label: "Instagram", href: "#", color: "#E1306C" },
  { icon: "▶", label: "YouTube", href: "#", color: "#FF0000" },
  { icon: "t", label: "TikTok", href: "#", color: "#69C9D0" },
  { icon: "d", label: "Discord", href: "#", color: "#5865F2" },
];

const BADGES = [
  { icon: "🔒", text: "SSL Secured" },
  { icon: "✅", text: "18+ Verified" },
  { icon: "🛡️", text: "Safe Payments" },
  { icon: "⚡", text: "99.9% Uptime" },
];


const getLegalContent = (type) => {
  const contents = {
    "Privacy Policy": `LumineX Privacy Policy\nLast Updated: ${new Date().getFullYear()}\n\n1. DATA COLLECTION\nWe collect minimal data to provide our services, including account credentials and essential cookies. We do not sell your personal information to third parties.\n\n2. SECURITY\nYour data is encrypted using industry-standard SSL technology.\n\n3. THIRD PARTIES\nWe may use trusted partners to process payments or provide analytics.`,

    "Terms of Service": `LumineX Terms of Service\n\n1. ELIGIBILITY\nYou must be at least 18 years of age to access this platform. By using LumineX, you represent that you meet this requirement.\n\n2. CONTENT OWNERSHIP\nCreators retain rights to their uploads but grant LumineX a license to host and stream the material.\n\n3. PROHIBITED CONDUCT\nUsers may not upload illegal content or infringe on intellectual property rights.`,

    "DMCA": `DMCA & Copyright Policy\n\nLumineX respects intellectual property. If you believe your work is being used without permission, please submit a notice to legal@luminex.com with:\n\n- Identification of the copyrighted work.\n- Link to the infringing material.\n- Your contact information.\n- A statement of good faith belief.`,

    "18 U.S.C. § 2257": `Compliance Statement (18 U.S.C. § 2257)\n\nLumineX is a platform for adult-oriented content. In compliance with Federal record-keeping requirements:\n\n1. All performers appearing in content were at least 18 years of age at the time of production.\n2. Records are maintained by the Custodian of Records at our corporate headquarters.\n3. We strictly prohibit non-consensual or underage materials.`,

    "Cookie Policy": `Cookie Policy\n\nLumineX uses cookies to enhance your experience:\n\n- Essential Cookies: Used for login and security.\n- Preference Cookies: Remember your volume and theme settings.\n- Analytics: Help us understand platform performance.`
  };
  return contents[type] || "Content update in progress...";
};

const getSupportContent = (type) => {
  const contents = {
    "Help Center": `LumineX Help Center\n\nHow can we help you today?\n\n• Getting Started: Setting up your profile.\n• Billing: Managing your VIP subscription.\n• Playback Issues: Troubleshooting video lag.\n• Safety: Reporting community violations.`,

    "Contact Us": `Contact LumineX Support\n\nOur team is available 24/7.\n\n📧 Email: support@luminex.com\n💬 Live Chat: Available for VIP members.\n⏱️ Response Time: Usually under 2 hours.`,

    "Report Content": `Report a Violation\n\nLumineX takes safety seriously. Please provide:\n\n1. Link to the video/profile.\n2. Reason for report (Harassment, Copyright, etc.).\n3. Timestamp of the occurrence.\n\nOur moderation team reviews reports within 30 minutes.`,

    "Advertise": `Partner with LumineX\n\nReach millions of engaged viewers.\n\n• Native Video Ads\n• Banner Placements\n• Creator Sponsorships\n\nEmail: ads@luminex.com for a media kit.`,

    "Become a Creator": `Join the LumineX Creator Program\n\nStart earning from your passion.\n\n✓ 80/20 Revenue Split\n✓ Instant Payouts\n✓ Advanced Analytics\n✓ 4K Streaming Support\n\nClick 'Upload' to start your first verification.`
  };
  return contents[type] || "Support ticket system loading...";
};



export default function Footer() {
  const { setTab, setAuthModal, profile, session, setUploadModal } = useApp();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState("");
  const [subDone, setSubDone] = useState(false);
  const [hovSocial, setHovSocial] = useState(null);
  const [legalDoc, setLegalDoc] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLink = (item, e) => {
    if (e) e.preventDefault();

    // Logic for Support/Legal Modals
    if (item.group === "Legal") {
      const realContent = getLegalContent(item.label);
      setLegalDoc({ title: item.label, content: realContent });
      return; // Stop here
    }

    if (item.group === "Support") {
      const supportContent = getSupportContent(item.label);
      setLegalDoc({
        title: item.label,
        content: supportContent,
        isSupport: true
      });
      return; // Stop here
    }

    // App Logic
    if (item.tab) setTab(item.tab);
    if (item.auth) setAuthModal(item.auth);
    if (item.upload) {
      if (session) {
        setUploadModal(true);
      } else {
        setAuthModal("login");
      }
    }
    if (item.profile && session && profile) setTab(`profile:${profile.id}`);
    else if (item.profile && !session) setAuthModal("login");
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    setIsSubmitting(true); // 1. Start loading

    setTimeout(() => {
      setSubDone(true);
      setIsSubmitting(false); // 2. Stop loading
      setEmail("");
      setTimeout(() => setSubDone(false), 3000);
    }, 1000); // simulate a small network delay
  };



  return (
    <footer style={{
      background: `linear-gradient(180deg, ${C.bg2} 0%, ${C.bg} 100%)`,
      borderTop: `1px solid ${C.border}`,
      marginTop: 60,
      paddingBottom: isMobile ? 70 : 0, // space for mobile nav bar
    }}>

      {/* ── Top accent line ── */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${C.accent}, ${C.accent2}, ${C.accent3}, ${C.accent})`, backgroundSize: "200% 100%", animation: "gradShift 4s ease infinite" }} />

      {/* ── Newsletter banner ── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.accent}15, ${C.accent2}10, ${C.accent3}10)`,
        borderBottom: `1px solid ${C.border}`,
        padding: isMobile ? "28px 16px" : "36px 40px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: C.text, marginBottom: 6 }}>
              Stay in the loop 🔔
            </div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
              Get notified about new content, VIP deals, and creator updates.
            </div>
          </div>
          <form onSubmit={handleSubscribe} style={{ display: "flex", gap: 8, flex: 1, minWidth: 280, maxWidth: 420 }}>
            {subDone ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", background: `${C.green}18`, border: `1.5px solid ${C.green}44`, borderRadius: 12, fontSize: 13, color: C.green, fontWeight: 600 }}>
                ✓ Subscribed! Thanks for joining.
              </div>
            ) : (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{ flex: 1, background: C.bg3, border: `1.5px solid ${C.border}`, borderRadius: 12, color: C.text, fontFamily: "inherit", fontSize: 13, padding: "11px 16px", outline: "none", transition: "border-color .2s" }}
                  onFocus={e => e.target.style.borderColor = C.accent}
                  onBlur={e => e.target.style.borderColor = C.border}
                />

                {/* --- ADD THE DYNAMIC BUTTON HERE --- */}
                <button
                  type="submit"
                  disabled={isSubmitting} // This prevents double-clicking while "loading"
                  style={{
                    background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
                    border: "none",
                    borderRadius: 12,
                    color: "white",
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: 700,
                    padding: "11px 20px",
                    whiteSpace: "nowrap",
                    transition: "all .2s",
                    // Dynamic styles based on state
                    opacity: isSubmitting ? 0.7 : 1,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    transform: isSubmitting ? "none" : undefined // optional: disable hover scale during submit
                  }}
                  onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.transform = "scale(1.03)" }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none" }}
                >
                  {isSubmitting ? "Joining..." : "Subscribe →"}
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      {/* ── Main links grid ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "36px 16px 28px" : "52px 40px 36px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr 1fr", gap: isMobile ? "32px 20px" : 32 }}>

          {/* Brand column */}
          <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <AppIcon size={36} />
              <Logo size={22} />
            </div>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.8, marginBottom: 20, maxWidth: 240 }}>
              The next-generation video streaming platform. Discover, share, and enjoy premium content from creators worldwide.
            </p>

            {/* Social icons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SOCIALS.map((s) => (
                <a key={s.label} href={s.href} title={s.label}
                  onMouseEnter={() => setHovSocial(s.label)}
                  onMouseLeave={() => setHovSocial(null)}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: hovSocial === s.label ? s.color + "22" : C.bg3,
                    border: `1px solid ${hovSocial === s.label ? s.color + "66" : C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 900, color: hovSocial === s.label ? s.color : C.muted,
                    transition: "all .2s",
                    textDecoration: "none",
                    transform: hovSocial === s.label ? "translateY(-2px)" : "none",
                  }}>
                  {s.icon}
                </a>
              ))}
            </div>

            {/* Trust badges */}
            <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
              {BADGES.map(b => (
                <div key={b.text} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: C.bg3, border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: "4px 10px",
                  fontSize: 10, color: C.muted, fontWeight: 600, whiteSpace: "nowrap",
                }}>
                  <span>{b.icon}</span>{b.text}
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.accent, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 14 }}>
                {group}
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                {items.map(item => {
                  // 1. Check if the item is Login or Sign Up AND a session exists
                  const isDisabled = (item.label === "Login" || item.label === "Sign Up") && session;


                  const isFunctional = item.group === "Legal" || item.group === "Support" || item.tab || item.auth || item.upload || item.profile;
                  return (
                    <li key={item.label}>
                      <span
                        onClick={(e) => !isDisabled && handleLink(item, e)}
                        style={{
                          fontSize: 13,
                          color: isDisabled ? C.border : C.muted,
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          transition: "color .15s",
                          display: "inline-block",
                          opacity: isDisabled ? 0.5 : 1
                        }}
                        onMouseEnter={e => {
                          if (!isDisabled) e.currentTarget.style.color = C.text;
                        }}
                        onMouseLeave={e => {
                          if (!isDisabled) e.currentTarget.style.color = C.muted;
                        }}
                      >
                        {item.label}
                      </span>
                    </li>
                  );
                })}
              </ul>

            </div>
          ))}
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px" }}>
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.border}, transparent)` }} />
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "20px 16px" : "22px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
          © {new Date().getFullYear()} LumineX. All rights reserved.<br />
          <span style={{ fontSize: 11 }}>
            All content on this site is for adults 18+.{" "}
            <a href="#" style={{ color: C.accent, textDecoration: "none" }}>18 U.S.C. § 2257 Statement</a>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {/* Age badge */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 34, height: 34, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.accent}, ${C.accent3})`,
            fontSize: 10, fontWeight: 900, color: "white",
            boxShadow: `0 0 12px ${C.accent}44`,
          }}>18+</div>

          {/* App stores (decorative) */}

        </div>
      </div>

      {/* ── ENHANCED LEGAL MODAL OVERLAY ── */}
      {legalDoc && (
        <div
          onClick={() => setLegalDoc(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            background: "rgba(3, 3, 8, 0.85)", backdropFilter: "blur(24px) saturate(180%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: isMobile ? 0 : 40,
            animation: "modalFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Floating Decorative Blobs for Style */}
          {!isMobile && (
            <>
              <div style={{ position: "absolute", top: "10%", left: "15%", width: 250, height: 250, borderRadius: "50%", background: `${C.accent}22`, filter: "blur(80px)", animation: "float 8s infinite alternate" }} />
              <div style={{ position: "absolute", bottom: "10%", right: "15%", width: 200, height: 200, borderRadius: "50%", background: `${C.accent2 || C.accent}18`, filter: "blur(80px)", animation: "float 12s infinite alternate-reverse" }} />
            </>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 850, height: isMobile ? "85vh" : "75vh",
              marginTop: isMobile ? "8vh" : "0",
              background: `linear-gradient(165deg, ${C.bg}, ${C.bg2})`,
              borderRadius: isMobile ? "32px 32px 0 0" : 32,
              display: "flex", flexDirection: "column", overflow: "hidden",
              border: `1px solid ${C.border}`,
              boxShadow: "0 30px 100px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.05)",
              position: "relative"
            }}
          >
            {/* ── Progress Bar ── */}
            <div style={{ position: "absolute", top: 0, left: 0, height: 3, width: "100%", background: `linear-gradient(90deg, ${C.accent}, ${C.accent2 || C.accent})`, opacity: 0.8 }} />

            {/* ── Premium Header ── */}
            {/* Sticky Header with improved contrast */}
            <div style={{
              padding: isMobile ? "20px 16px" : "24px 32px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: `${C.bg2}dd`, // Semi-transparent
              backdropFilter: "blur(12px)", // Glass effect
              position: "sticky", top: 0, zIndex: 10
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${C.accent}33, ${C.accent}11)`, border: `1px solid ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                  {legalDoc.isSupport ? "🎧" : "🛡️"}
                </div>
                <div>
                  <h3 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, margin: 0, color: C.text, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.5px" }}>
                    {legalDoc.title}
                  </h3>
                  <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginTop: 4 }}>
                    {/* DYNAMIC SUBTITLE */}
                    {legalDoc.isSupport ? "Customer Support" : "Safe & Secure Platform"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setLegalDoc(null)}
                style={{
                  background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                  borderRadius: "50%", width: 44, height: 44,
                  cursor: "pointer", color: C.text,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.transform = "rotate(90deg) scale(1.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.transform = "rotate(0deg) scale(1)"; }}
              >
                ✕
              </button>
            </div>

            {/* ── High-Readability Content Area ── */}
            <div className="custom-scrollbar" style={{
              flex: 1,
              overflowY: "auto",
              padding: isMobile ? "24px 20px 100px" : "40px 60px",
              lineHeight: 1.8,
              fontSize: 15,
              background: "rgba(0,0,0,0.2)" // Slight background contrast
            }}>
              <div style={{
                whiteSpace: "pre-wrap",
                // CHANGE: Use solid text color and bold weight
                color: C.text,
                fontWeight: 600,
                fontSize: isMobile ? "15px" : "16px",
                textShadow: "0 1px 2px rgba(0,0,0,0.5)", // Extra pop
                letterSpacing: "0.2px"
              }}>
                {legalDoc.content}
              </div>


            </div>

            {/* ── Floating Action Bar for Mobile ── */}
            {isMobile && (
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "20px", background: `linear-gradient(transparent, ${C.bg})`,
                display: "flex", justifyContent: "center"
              }}>
                <button
                  onClick={() => setLegalDoc(null)}
                  style={{
                    background: C.accent, color: "white", border: "none",
                    borderRadius: "16px", padding: "16px 48px",
                    fontWeight: 800, fontSize: 14, width: "100%",
                    boxShadow: `0 12px 24px ${C.accent}44`,
                    letterSpacing: "1px"
                  }}
                >
                  I UNDERSTAND
                </button>
              </div>
            )}
          </div>

          <style>{`
      @keyframes modalFadeIn {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes float {
        from { transform: translate(0, 0); }
        to { transform: translate(20px, 40px); }
      }
      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: ${C.border}; borderRadius: 10px; }
    `}</style>
        </div>
      )}

    </footer>
  );
}


const iconContainerStyles = {
  width: 48,
  height: 48,
  borderRadius: 14,
  background: `linear-gradient(135deg, ${C.accent}33, ${C.accent}11)`,
  border: `1px solid ${C.accent}44`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24
};
