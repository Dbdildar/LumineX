import { useState } from "react";
import { C, Logo, Avatar, AppIcon, ThemeToggle, Spinner } from "../ui/index";
import { useApp } from "../../context/AppContext";
import { useIsMobile } from "../../hooks/index";

export default function Header() {
  const { session,profile,setSearch,setAuthModal,setUploadModal,signOut,setTab,notifCount,setNotifOpen,theme,toggleTheme } = useApp();
  const isMobile = useIsMobile();
  const [menuOpen,setMenuOpen] = useState(false);

  return (
    <header style={{ position:"sticky",top:0,zIndex:1000,background:"var(--headerBg)",backdropFilter:"blur(24px)",borderBottom:`1px solid ${C.border}`,padding:isMobile?"0 12px":"0 20px" }}>
      <div style={{ maxWidth:1400,margin:"0 auto",display:"flex",alignItems:"center",height:isMobile?52:60,gap:isMobile?10:14 }}>

        {/* Logo */}
        <div onClick={()=>setTab("home")} style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer",flexShrink:0 }}>
          <AppIcon size={isMobile?28:32}/>
          {!isMobile&&<Logo size={20}/>}
        </div>

        {/* Search */}
        <div style={{ flex:1,maxWidth:500,position:"relative" }} onClick={()=>setSearch(true)}>
          <div style={{ background:C.bg3,border:`1px solid ${C.border}`,borderRadius:999,padding:"8px 16px 8px 38px",fontSize:13,color:C.muted,cursor:"pointer",transition:"border-color .2s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent+"66"} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
            <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:15 }}>🔍</span>
            Search videos, users…
          </div>
        </div>

        {/* Right actions */}
        <div style={{ display:"flex",alignItems:"center",gap:isMobile?8:10,marginLeft:"auto" }}>
          <ThemeToggle theme={theme} onToggle={toggleTheme}/>

          {session&&!isMobile&&(
            <button onClick={()=>setUploadModal(true)} style={{ background:`linear-gradient(135deg,${C.accent},${C.accent2})`,border:"none",borderRadius:999,color:"white",fontFamily:"inherit",fontSize:12,fontWeight:700,padding:"8px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,transition:"all .2s" }}
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"} onMouseLeave={e=>e.currentTarget.style.transform="none"}>
              📤 Upload
            </button>
          )}

          {session&&(
            <button onClick={()=>setNotifOpen(true)} style={{ position:"relative",background:C.bg3,border:`1px solid ${C.border}`,borderRadius:"50%",width:36,height:36,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>
              🔔
              {notifCount>0&&<span style={{ position:"absolute",top:-2,right:-2,background:C.accent,color:"white",fontSize:9,fontWeight:700,minWidth:16,height:16,borderRadius:99,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${C.bg}` }}>{notifCount>99?"99+":notifCount}</span>}
            </button>
          )}

          {session&&profile ? (
            <div style={{ position:"relative" }}>
              <div onClick={()=>setMenuOpen(v=>!v)} style={{ cursor:"pointer" }}>
                <Avatar profile={profile} size={isMobile?32:36}/>
              </div>
              {menuOpen&&(
                <>
                  <div onClick={()=>setMenuOpen(false)} style={{ position:"fixed",inset:0,zIndex:99 }}/>
                  <div style={{ position:"absolute",top:"calc(100% + 8px)",right:0,background:C.bg2,border:`1px solid ${C.border}`,borderRadius:14,minWidth:190,zIndex:100,boxShadow:"0 20px 60px rgba(0,0,0,.7)",animation:"fadeDown .2s ease",overflow:"hidden" }}>
                    <div style={{ padding:"14px 16px",borderBottom:`1px solid ${C.border}` }}>
                      <div style={{ fontSize:14,fontWeight:700,color:C.text }}>{profile.display_name||profile.username}</div>
                      <div style={{ fontSize:11,color:C.muted }}>@{profile.username}</div>
                      {profile.is_vip&&<div style={{ fontSize:10,color:C.gold,marginTop:2,fontWeight:700 }}>👑 VIP Member</div>}
                    </div>
                    {[
                      {icon:"👤",label:"My Profile",action:()=>{setTab(`profile:${profile.id}`);setMenuOpen(false);}},
                      {icon:"📤",label:"Upload Video",action:()=>{setUploadModal(true);setMenuOpen(false);}},
                      {icon:"❤️",label:"Saved Videos",action:()=>{setTab("saved");setMenuOpen(false);}},
                      {icon:"💎",label:"VIP Plans",action:()=>{setTab("vip");setMenuOpen(false);}},
                    ].map(item=>(
                      <div key={item.label} onClick={item.action} style={{ padding:"11px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:13,fontWeight:500,color:C.text,transition:"background .15s" }}
                        onMouseEnter={e=>e.currentTarget.style.background=C.bg3} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <span>{item.icon}</span>{item.label}
                      </div>
                    ))}
                    <div style={{ borderTop:`1px solid ${C.border}` }}>
                      <div onClick={()=>{signOut();setMenuOpen(false);}} style={{ padding:"11px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:13,color:C.red,transition:"background .15s" }}
                        onMouseEnter={e=>e.currentTarget.style.background=C.red+"11"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <span>🚪</span>Sign out
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display:"flex",gap:7 }}>
              <button onClick={()=>setAuthModal("login")} style={{ background:"none",border:`1px solid ${C.accent}`,borderRadius:999,color:C.accent,fontFamily:"inherit",fontSize:13,fontWeight:600,padding:"7px 14px",cursor:"pointer",transition:"all .2s" }}
                onMouseEnter={e=>{e.currentTarget.style.background=C.accent;e.currentTarget.style.color="white";}} onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=C.accent;}}>Login</button>
              {!isMobile&&<button onClick={()=>setAuthModal("signup")} style={{ background:`linear-gradient(135deg,${C.accent},${C.accent2})`,border:"none",borderRadius:999,color:"white",fontFamily:"inherit",fontSize:13,fontWeight:600,padding:"7px 14px",cursor:"pointer" }}>Sign Up</button>}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
