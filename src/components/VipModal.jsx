import { useState } from "react";
import { C, Modal, Btn } from "./ui/index";
import { useApp } from "../context/AppContext";
import { vipAPI } from "../lib/supabase";

const PLANS=[
  {id:"monthly", label:"Monthly", price:"$0.50", period:"/month",badge:null,        savings:null},
  {id:"yearly",  label:"Yearly",  price:"$4.99", period:"/year", badge:"Most Popular",savings:"Save 17%"},
  {id:"lifetime",label:"Lifetime",price:"$19.99",period:"once",  badge:"Best Value", savings:"Forever"},
];
const FEATURES=["✅ Watch all VIP-exclusive videos","✅ No advertisements, ever","✅ Download videos offline","✅ HD & 4K streaming priority","✅ Early access to new content","✅ VIP badge on your profile","✅ Priority customer support","✅ Exclusive VIP channels"];

export default function VipModal() {
  const { vipModal,setVipModal,session,setAuthModal,refreshProfile,showToast } = useApp();
  const [selected,setSelected] = useState("monthly");
  const [loading,setLoading] = useState(false);
  const [step,setStep] = useState(1);
  const [card,setCard] = useState({number:"",expiry:"",cvv:"",name:""});

  if(!vipModal) return null;
  const plan = PLANS.find(p=>p.id===selected);

  const handleSubscribe = async()=>{
    if(!session){setVipModal(false);setAuthModal("login");return;}
    if(step===1){setStep(2);return;}
    if(!card.number||!card.expiry||!card.cvv||!card.name){showToast("Please fill in all card details","error");return;}
    setLoading(true);
    try {
      await new Promise(r=>setTimeout(r,1800));
      await vipAPI.upgrade(session.user.id);
      refreshProfile(); setStep(3);
    } catch(e){showToast(e.message||"Payment failed","error");}
    finally{setLoading(false);}
  };

  const fmt = val=>val.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp = val=>{ const d=val.replace(/\D/g,"").slice(0,4); return d.length>=3?d.slice(0,2)+"/"+d.slice(2):d; };

  return (
    <Modal onClose={()=>{setVipModal(false);setStep(1);}} maxWidth={520}>
      <style>{`@keyframes vipGlow{0%,100%{box-shadow:0 0 30px #fbbf2433}50%{box-shadow:0 0 60px #fbbf2466}}`}</style>

      {step===1&&(
        <>
          <div style={{ textAlign:"center",marginBottom:24,paddingTop:4 }}>
            <div style={{ fontSize:52,marginBottom:8,animation:"float 3s ease-in-out infinite" }}>👑</div>
            <h2 style={{ fontSize:22,fontWeight:900,marginBottom:6,fontFamily:"'Syne',sans-serif",background:"linear-gradient(135deg,#fbbf24,#f97316)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>Unlock VIP</h2>
            <p style={{ fontSize:13,color:C.muted }}>Access all premium content and exclusive features</p>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:20 }}>
            {PLANS.map(p=>(
              <div key={p.id} onClick={()=>setSelected(p.id)} style={{ padding:"14px 16px",borderRadius:14,cursor:"pointer",border:`2px solid ${selected===p.id?"#fbbf24":C.border}`,background:selected===p.id?"#fbbf2410":C.bg3,transition:"all .2s",position:"relative",zIndex:1,animation:selected===p.id?"vipGlow 2s infinite":"none" }}>
                {p.badge&&<div style={{ position:"absolute",top:-10,right:14,background:"linear-gradient(135deg,#fbbf24,#f97316)",color:"#000",fontSize:10,fontWeight:800,padding:"2px 10px",borderRadius:99,whiteSpace:"nowrap" }}>{p.badge}</div>}
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <div><div style={{ fontSize:15,fontWeight:700,color:C.text,marginBottom:2 }}>{p.label}</div>{p.savings&&<div style={{ fontSize:11,color:"#fbbf24",fontWeight:600 }}>{p.savings}</div>}</div>
                  <div style={{ textAlign:"right" }}><div style={{ fontSize:22,fontWeight:900,color:selected===p.id?"#fbbf24":C.text }}>{p.price}</div><div style={{ fontSize:11,color:C.muted }}>{p.period}</div></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background:C.bg3,borderRadius:12,padding:"14px 16px",marginBottom:20 }}>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
              {FEATURES.map(f=><div key={f} style={{ fontSize:11,color:C.muted }}>{f}</div>)}
            </div>
          </div>
          <Btn onClick={handleSubscribe} fullWidth size="lg" style={{ background:"linear-gradient(135deg,#fbbf24,#f97316)",border:"none",boxShadow:"0 0 30px #fbbf2444" }}>
            👑 Get {plan?.label} VIP — {plan?.price}
          </Btn>
          <div style={{ textAlign:"center",marginTop:10,fontSize:11,color:C.muted }}>Secure payment · Cancel anytime · Instant access</div>
        </>
      )}

      {step===2&&(
        <>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20 }}>
            <button onClick={()=>setStep(1)} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:20 }}>←</button>
            <h2 style={{ fontSize:18,fontWeight:800,fontFamily:"'Syne',sans-serif",color:C.text }}>Payment Details</h2>
          </div>
          <div style={{ background:"linear-gradient(135deg,#fbbf2420,#f9731620)",border:"1px solid #fbbf2433",borderRadius:12,padding:"12px 16px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div><div style={{ fontSize:14,fontWeight:700,color:C.text }}>👑 VIP {plan?.label}</div><div style={{ fontSize:11,color:C.muted }}>{plan?.savings||"Full VIP access"}</div></div>
            <div style={{ fontSize:20,fontWeight:900,color:"#fbbf24" }}>{plan?.price}</div>
          </div>
          {[{label:"Card Number",ph:"1234 5678 9012 3456",k:"number",icon:"💳",fn:v=>setCard(p=>({...p,number:fmt(v)}))},].map(f=><CardField key={f.k} {...f} value={card[f.k]} onChange={f.fn}/>)}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            <CardField label="Expiry" ph="MM/YY" k="expiry" icon="📅" value={card.expiry} onChange={v=>setCard(p=>({...p,expiry:fmtExp(v)}))}/>
            <CardField label="CVV" ph="123" k="cvv" icon="🔒" value={card.cvv} onChange={v=>setCard(p=>({...p,cvv:v.replace(/\D/g,"").slice(0,4)}))}/>
          </div>
          <CardField label="Cardholder Name" ph="Full name on card" k="name" icon="👤" value={card.name} onChange={v=>setCard(p=>({...p,name:v}))}/>
          <Btn onClick={handleSubscribe} loading={loading} fullWidth size="lg" style={{ marginTop:8,background:"linear-gradient(135deg,#fbbf24,#f97316)",border:"none" }}>
            {loading?"Processing…":`Pay ${plan?.price} →`}
          </Btn>
          <div style={{ textAlign:"center",marginTop:10,fontSize:11,color:C.muted }}>🔒 256-bit SSL encryption</div>
        </>
      )}

      {step===3&&(
        <div style={{ textAlign:"center",padding:"20px 0" }}>
          <div style={{ fontSize:72,marginBottom:16,animation:"float 2s ease-in-out infinite" }}>🎉</div>
          <h2 style={{ fontSize:24,fontWeight:900,marginBottom:8,fontFamily:"'Syne',sans-serif",background:"linear-gradient(135deg,#fbbf24,#f97316)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>Welcome to VIP!</h2>
          <p style={{ fontSize:14,color:C.muted,marginBottom:28,lineHeight:1.7 }}>You now have access to all premium content. Enjoy the full LumineX experience 👑</p>
          <Btn onClick={()=>setVipModal(false)} fullWidth size="lg" style={{ background:"linear-gradient(135deg,#fbbf24,#f97316)",border:"none" }}>Start Watching →</Btn>
        </div>
      )}
    </Modal>
  );
}

function CardField({ label, ph, k, icon, value, onChange }) {
  const [focused,setFocused] = useState(false);
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block",fontSize:11,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:.5 }}>{label}</label>
      <div style={{ position:"relative" }}>
        <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:15 }}>{icon}</span>
        <input value={value} onChange={e=>onChange(e.target.value)} placeholder={ph}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{ width:"100%",background:C.bg3,border:`1.5px solid ${focused?"#fbbf24":C.border}`,borderRadius:10,color:C.text,fontFamily:"inherit",fontSize:14,padding:"10px 14px 10px 38px",outline:"none",transition:"border-color .2s",boxShadow:focused?"0 0 0 3px #fbbf2418":"none" }}/>
      </div>
    </div>
  );
}
