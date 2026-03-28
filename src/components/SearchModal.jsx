import { useState, useEffect, useRef } from "react";
import { C, Avatar, VerifiedBadge, VipBadge, Spinner, fmtNum } from "./ui/index";
import { useApp } from "../context/AppContext";
import { videoAPI, profileAPI } from "../lib/supabase";
import { useDebounce, useIsMobile } from "../hooks/index";
import { DEMO_VIDEOS } from "../data/theme";

export default function SearchModal() {
  const { search,setSearch,playVideo,setTab } = useApp();
  const isMobile = useIsMobile();
  const [q,setQ] = useState("");
  const [videos,setVideos] = useState([]);
  const [users,setUsers] = useState([]);
  const [loading,setLoading] = useState(false);
  const [activeTab,setActiveTab] = useState("all");
  const inputRef = useRef(null);
  const dq = useDebounce(q, 320);

  useEffect(()=>{ if(search) setTimeout(()=>inputRef.current?.focus(),100); },[search]);

  useEffect(()=>{
    if(!dq.trim()||dq.length<2) { setVideos([]); setUsers([]); return; }
    setLoading(true);
    const lq = dq.toLowerCase();
    Promise.all([
      videoAPI.search(dq).catch(()=>DEMO_VIDEOS.filter(v=>v.title.toLowerCase().includes(lq)||(v.channel||"").toLowerCase().includes(lq))),
      profileAPI.search(dq).catch(()=>[]),
    ]).then(([v,u])=>{ setVideos(v||[]); setUsers(u||[]); setLoading(false); });
  },[dq]);

  useEffect(()=>{ if(!search) return; const h=e=>{ if(e.key==="Escape") close(); }; window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h); },[search]);

  const close = ()=>{ setSearch(false); setQ(""); };
  if(!search) return null;

  const hasResults = videos.length>0||users.length>0;

  return (
    <div onClick={e=>e.target===e.currentTarget&&close()} style={{ position:"fixed",inset:0,zIndex:9800,background:"rgba(0,0,0,.88)",backdropFilter:"blur(18px)",padding:isMobile?"12px 12px 80px":"80px 16px 16px",overflowY:"auto",animation:"fadeIn .2s" }}>
      <div style={{ maxWidth:700,margin:"0 auto" }}>
        {/* Input */}
        <div style={{ display:"flex",alignItems:"center",gap:12,background:C.bg2,border:`2px solid ${C.accent}`,borderRadius:16,padding:"14px 18px",marginBottom:16,boxShadow:`0 0 40px var(--accent)22` }}>
          <span style={{ fontSize:20,flexShrink:0 }}>🔍</span>
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search videos, channels, users…"
            style={{ flex:1,background:"none",border:"none",color:C.text,fontFamily:"inherit",fontSize:isMobile?16:18,outline:"none" }}/>
          {loading&&<Spinner size={18}/>}
          {q&&<button onClick={()=>setQ("")} style={{ background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer",padding:4 }}>✕</button>}
        </div>

        {/* Tabs */}
        {hasResults&&(
          <div style={{ display:"flex",gap:8,marginBottom:16 }}>
            {["all","videos","users"].map(t=>(
              <button key={t} onClick={()=>setActiveTab(t)} style={{ padding:"6px 16px",borderRadius:99,border:"none",background:activeTab===t?C.accent:C.bg3,color:activeTab===t?"white":C.muted,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .2s",textTransform:"capitalize" }}>{t}</button>
            ))}
          </div>
        )}

        {q.length>=2&&!loading&&!hasResults&&(
          <div style={{ textAlign:"center",padding:"48px 20px",color:C.muted }}>
            <div style={{ fontSize:40,marginBottom:10 }}>🔍</div>
            <div style={{ fontSize:15,fontWeight:600,color:C.text,marginBottom:6 }}>No results for "{q}"</div>
            <div style={{ fontSize:13 }}>Try different keywords</div>
          </div>
        )}

        {/* Users */}
        {(activeTab==="all"||activeTab==="users")&&users.length>0&&(
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10 }}>People</div>
            <div style={{ background:C.bg2,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
              {users.slice(0,activeTab==="all"?3:10).map((u,i)=>(
                <div key={u.id} onClick={()=>{setTab(`profile:${u.id}`);close();}}
                  style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 16px",cursor:"pointer",transition:"background .15s",borderBottom:i<users.length-1?`1px solid ${C.border}`:"none" }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.bg3} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Avatar profile={u} size={42}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:2 }}>
                      <span style={{ fontSize:14,fontWeight:700,color:C.text }}>{u.display_name||u.username}</span>
                      {u.is_verified&&<VerifiedBadge size={13}/>}
                    </div>
                    <div style={{ fontSize:12,color:C.muted }}>@{u.username}</div>
                  </div>
                  <div style={{ fontSize:11,color:C.muted }}>{fmtNum(u.followers_count||0)} followers</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Videos */}
        {(activeTab==="all"||activeTab==="videos")&&videos.length>0&&(
          <div>
            <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10 }}>Videos</div>
            <div style={{ background:C.bg2,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
              {videos.slice(0,activeTab==="all"?6:12).map((v,i)=>(
                <div key={v.id} onClick={()=>{playVideo(v);close();}}
                  style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",cursor:"pointer",transition:"background .15s",borderBottom:i<videos.length-1?`1px solid ${C.border}`:"none" }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.bg3} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{ position:"relative",flexShrink:0 }}>
                    <img src={v.thumbnail_url||`https://picsum.photos/640/360?random=${String(v.id).charCodeAt(0)||i+1}`} alt={v.title} style={{ width:72,aspectRatio:"16/9",objectFit:"cover",borderRadius:8 }}/>
                    {v.is_vip&&<div style={{ position:"absolute",top:3,left:3 }}><VipBadge small/></div>}
                    {v.duration&&<div style={{ position:"absolute",bottom:3,right:3,background:"rgba(0,0,0,.85)",color:"white",fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:4 }}>{v.duration}</div>}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:C.text,marginBottom:3,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>{v.title}</div>
                    <div style={{ fontSize:11,color:C.accent,fontWeight:600 }}>{v.profiles?.display_name||v.channel||"Unknown"}</div>
                    <div style={{ fontSize:10,color:C.muted }}>{fmtNum(v.views||0)} views</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
