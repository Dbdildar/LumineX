import { useState, useEffect } from "react";
import { C, Avatar, timeAgo, Spinner, Btn } from "../ui/index";
import { useApp } from "../../context/AppContext";
import { notifAPI, followAPI } from "../../lib/supabase";
import { useIsMobile } from "../../hooks/index";

export default function NotifPanel() {
  const { notifOpen, setNotifOpen, session, setNotifCount, showToast, setTab } = useApp();
  const isMobile = useIsMobile();
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    if(!notifOpen||!session) return;
    setLoading(true);
    notifAPI.getForUser(session.user.id).then(d=>{
      setNotifs(d||[]); setLoading(false);
      notifAPI.markRead(session.user.id).then(()=>setNotifCount(0)).catch(()=>{});
    }).catch(()=>setLoading(false));
  },[notifOpen, session]);

  if(!notifOpen) return null;

  const handleFollowBack = async(notif)=>{
    if(!session) return;
    try {
      await followAPI.follow(session.user.id, notif.actor_id);
      showToast(`✓ Now following ${notif.actor?.display_name||notif.actor?.username}`,"success");
      setNotifs(p=>p.map(n=>n.id===notif.id?{...n,_followedBack:true}:n));
    } catch(e) { showToast(e.message,"error"); }
  };

  const getIcon = type => ({follow:"👤",like:"❤️",comment:"💬",reply:"💬",video:"🎬"}[type]||"🔔");
  const getMsg = notif => {
    const name = notif.actor?.display_name||notif.actor?.username||"Someone";
    const msgs = {
      follow:  `${name} started following you`,
      like:    `${name} liked your video`,
      comment: `${name} commented on your video`,
      reply:   `${name} replied to your comment`,
      video:   `${name} uploaded a new video`,
    };
    return msgs[notif.type]||`${name} sent you a notification`;
  };

  return (
    <>
      <div onClick={()=>setNotifOpen(false)} style={{ position:"fixed",inset:0,zIndex:1099 }}/>
      <div style={{
        position:"fixed",
        ...(isMobile?{inset:"0 0 0 0",borderRadius:0}:{top:64,right:16,width:360,maxHeight:"80vh",borderRadius:20}),
        zIndex:1100,
        background:C.bg2, border:`1px solid ${C.border}`,
        boxShadow:"0 20px 60px rgba(0,0,0,.7)",
        display:"flex", flexDirection:"column",
        animation:"scaleIn .2s ease",
        overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 18px",borderBottom:`1px solid ${C.border}`,flexShrink:0 }}>
          <h3 style={{ fontSize:16,fontWeight:800,fontFamily:"'Syne',sans-serif",color:C.text }}>Notifications</h3>
          <button onClick={()=>setNotifOpen(false)} style={{ background:C.bg3,border:`1px solid ${C.border}`,borderRadius:"50%",width:30,height:30,cursor:"pointer",color:C.muted,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
        </div>

        {/* List */}
        <div style={{ overflowY:"auto",scrollbarWidth:"none",flex:1 }}>
          {loading&&<div style={{ display:"flex",justifyContent:"center",padding:40 }}><Spinner/></div>}
          {!loading&&notifs.length===0&&(
            <div style={{ textAlign:"center",padding:"48px 20px",color:C.muted }}>
              <div style={{ fontSize:40,marginBottom:10 }}>🔔</div>
              <div style={{ fontSize:14,fontWeight:600,color:C.text }}>No notifications yet</div>
              <div style={{ fontSize:12 }}>When someone follows or likes your content, you'll see it here</div>
            </div>
          )}
          {notifs.map(notif=>(
            <div key={notif.id} onClick={()=>{ if(notif.video_id){ setTab(`video:${notif.video_id}`); } else if(notif.actor_id){ setTab(`profile:${notif.actor_id}`); } setNotifOpen(false); }} style={{
              display:"flex",alignItems:"flex-start",gap:12,padding:"14px 18px",
              borderBottom:`1px solid ${C.border}22`,cursor:"pointer",transition:"background .15s",
              background:notif.is_read?"transparent":`${C.accent}08`,
            }}
              onMouseEnter={e=>e.currentTarget.style.background=C.bg3}
              onMouseLeave={e=>e.currentTarget.style.background=notif.is_read?"transparent":`${C.accent}08`}
            >
              {/* Avatar + icon */}
              <div style={{ position:"relative",flexShrink:0 }}>
                <Avatar profile={notif.actor} size={42}/>
                <div style={{ position:"absolute",bottom:-2,right:-2,width:20,height:20,borderRadius:"50%",background:C.bg3,border:`2px solid ${C.bg2}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10 }}>{getIcon(notif.type)}</div>
              </div>

              {/* Content */}
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:13,color:C.text,lineHeight:1.5,marginBottom:4 }}>{getMsg(notif)}</div>
                {notif.videos&&<div style={{ fontSize:11,color:C.muted,marginBottom:6 }}>"{notif.videos.title}"</div>}
                <div style={{ fontSize:10,color:C.muted }}>{timeAgo(notif.created_at)}</div>

                {/* Follow notification — show Follow Back button */}
                {notif.type==="follow"&&!notif._followedBack&&(
                  <div style={{ display:"flex",gap:8,marginTop:8 }} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>handleFollowBack(notif)} style={{ padding:"5px 14px",borderRadius:8,border:"none",background:`linear-gradient(135deg,${C.accent},${C.accent2})`,color:"white",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                      Follow Back
                    </button>
                    <button onClick={()=>{ setTab(`profile:${notif.actor_id}`); setNotifOpen(false); }} style={{ padding:"5px 14px",borderRadius:8,border:`1px solid ${C.border}`,background:"none",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit" }}>
                      View Profile
                    </button>
                  </div>
                )}
                {notif.type==="follow"&&notif._followedBack&&(
                  <div style={{ fontSize:11,color:C.green,marginTop:6,fontWeight:600 }}>✓ Following back</div>
                )}
              </div>

              {/* Thumbnail for video notifications */}
              {notif.videos?.thumbnail_url&&(
                <img src={notif.videos.thumbnail_url} style={{ width:52,aspectRatio:"16/9",objectFit:"cover",borderRadius:6,flexShrink:0 }} alt=""/>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
