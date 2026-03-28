export const APP_NAME  = "LumineX";
export const APP_LOGO  = "Lumine";
export const APP_LOGO2 = "X";

export const CATEGORIES = [
  { icon:"🎬", name:"Cinematic",  count:"48.2K", color:"#ef4444", desc:"Films, shorts & storytelling" },
  { icon:"🌊", name:"Nature",     count:"32.1K", color:"#3b82f6", desc:"Wildlife, landscapes & earth" },
  { icon:"🏋️",name:"Fitness",   count:"21.8K", color:"#10b981", desc:"Workouts, yoga & health" },
  { icon:"🍜", name:"Food",       count:"18.9K", color:"#f59e0b", desc:"Recipes, reviews & culture" },
  { icon:"🎵", name:"Music",      count:"29.4K", color:"#ec4899", desc:"Artists, covers & beats" },
  { icon:"✈️", name:"Travel",    count:"41.7K", color:"#06b6d4", desc:"Destinations & adventures" },
  { icon:"🔬", name:"Science",    count:"12.6K", color:"#84cc16", desc:"Experiments & discoveries" },
  { icon:"🎮", name:"Gaming",     count:"55.2K", color:"#f97316", desc:"Gameplay, reviews & esports" },
  { icon:"🏎️",name:"Autos",     count:"23.1K", color:"#64748b", desc:"Cars, bikes & motors" },
  { icon:"🏄", name:"Sports",     count:"37.5K", color:"#0ea5e9", desc:"Action, extreme & leagues" },
  { icon:"💡", name:"Tech",       count:"44.1K", color:"#a78bfa", desc:"Gadgets, AI & innovation" },
  { icon:"🎨", name:"Art",        count:"16.3K", color:"#fb7185", desc:"Design, drawing & creativity" },
];

export const AVATARS = [
  { id:"a1",  emoji:"🦁", bg:"linear-gradient(135deg,#f97316,#fbbf24)", label:"Lion" },
  { id:"a2",  emoji:"🐺", bg:"linear-gradient(135deg,#6366f1,#8b5cf6)", label:"Wolf" },
  { id:"a3",  emoji:"🦊", bg:"linear-gradient(135deg,#ef4444,#f97316)", label:"Fox" },
  { id:"a4",  emoji:"🐉", bg:"linear-gradient(135deg,#10b981,#06b6d4)", label:"Dragon" },
  { id:"a5",  emoji:"🦅", bg:"linear-gradient(135deg,#3b82f6,#6366f1)", label:"Eagle" },
  { id:"a6",  emoji:"🐯", bg:"linear-gradient(135deg,#f59e0b,#ef4444)", label:"Tiger" },
  { id:"a7",  emoji:"🦄", bg:"linear-gradient(135deg,#ec4899,#a855f7)", label:"Unicorn" },
  { id:"a8",  emoji:"🐼", bg:"linear-gradient(135deg,#1e293b,#475569)", label:"Panda" },
  { id:"a9",  emoji:"🦋", bg:"linear-gradient(135deg,#c084fc,#818cf8)", label:"Butterfly" },
  { id:"a10", emoji:"🦈", bg:"linear-gradient(135deg,#0ea5e9,#2563eb)", label:"Shark" },
  { id:"a11", emoji:"🐸", bg:"linear-gradient(135deg,#84cc16,#16a34a)", label:"Frog" },
  { id:"a12", emoji:"🤖", bg:"linear-gradient(135deg,#64748b,#334155)", label:"Robot" },
];

export const DEMO_VIDEOS = [
  { id:"dv1",  title:"Big Buck Bunny — Official 4K",           channel:"Blender Foundation", profiles:{id:"p1",username:"blender",display_name:"Blender Foundation",is_verified:true,followers_count:891000,avatar_url:null}, category:"Cinematic", views:12400000, likes_count:94200, is_vip:false, video_url:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",        thumbnail_url:"https://picsum.photos/640/360?random=1",  tags:["animation","4k"],     duration:"9:56",  created_at:new Date(Date.now()-86400000*2).toISOString() },
  { id:"dv2",  title:"Elephants Dream — Sci-Fi Short",          channel:"Blender Institute",  profiles:{id:"p2",username:"blenderinst",display_name:"Blender Institute", is_verified:true,followers_count:156000,avatar_url:null}, category:"Cinematic", views:8100000,  likes_count:61000, is_vip:false, video_url:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",       thumbnail_url:"https://picsum.photos/640/360?random=2",  tags:["scifi","short"],      duration:"10:54", created_at:new Date(Date.now()-86400000*5).toISOString() },
  { id:"dv3",  title:"For Bigger Blazes — Action Reel",         channel:"NovaCinema",         profiles:{id:"p3",username:"novacinema",display_name:"NovaCinema",          is_verified:false,followers_count:42000, avatar_url:null}, category:"Sports",    views:4200000,  likes_count:32100, is_vip:true,  video_url:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",      thumbnail_url:"https://picsum.photos/640/360?random=3",  tags:["action","fire"],      duration:"0:15",  created_at:new Date(Date.now()-86400000*1).toISOString() },
  { id:"dv4",  title:"For Bigger Escapes — Epic Stunts",        channel:"UrbanFilms",         profiles:{id:"p4",username:"urbanfilms",display_name:"UrbanFilms",          is_verified:true,followers_count:284000,avatar_url:null}, category:"Sports",    views:3700000,  likes_count:28400, is_vip:false, video_url:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",     thumbnail_url:"https://picsum.photos/640/360?random=4",  tags:["stunts","hd"],        duration:"0:15",  created_at:new Date(Date.now()-86400000*3).toISOString() },
  { id:"dv5",  title:"For Bigger Fun — Lifestyle Comedy",       channel:"FunVault",           profiles:{id:"p5",username:"funvault",  display_name:"FunVault",           is_verified:false,followers_count:98000, avatar_url:null}, category:"Lifestyle", views:5900000,  likes_count:44700, is_vip:false, video_url:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",         thumbnail_url:"https://picsum.photos/640/360?random=5",  tags:["fun","comedy"],       duration:"0:15",  created_at:new Date(Date.now()-86400000*7).toISOString() },
  { id:"dv6",  title:"For Bigger Joyrides — Supercar Edition",  channel:"AutoVault",          profiles:{id:"p6",username:"autovault",display_name:"AutoVault",           is_verified:true,followers_count:423000,avatar_url:null}, category:"Autos",     views:7300000,  likes_count:58200, is_vip:true,  video_url:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",    thumbnail_url:"https://picsum.photos/640/360?random=6",  tags:["cars","speed"],       duration:"0:15",  created_at:new Date(Date.now()-86400000*4).toISOString() },
  { id:"dv7",  title:"For Bigger Meltdowns — Drama Cuts",       channel:"DramaHub",           profiles:{id:"p7",username:"dramahub",  display_name:"DramaHub",           is_verified:false,followers_count:67000, avatar_url:null}, category:"Cinematic", views:2100000,  likes_count:16300, is_vip:false, video_url:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",   thumbnail_url:"https://picsum.photos/640/360?random=7",  tags:["drama","film"],       duration:"0:15",  created_at:new Date(Date.now()-86400000*6).toISOString() },
  { id:"dv8",  title:"Sintel — Award Winning Dragon Short",     channel:"Blender Foundation", profiles:{id:"p1",username:"blender",  display_name:"Blender Foundation", is_verified:true,followers_count:891000,avatar_url:null}, category:"Cinematic", views:21800000, likes_count:187000,is_vip:true,  video_url:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",               thumbnail_url:"https://picsum.photos/640/360?random=8",  tags:["fantasy","dragon"],   duration:"14:48", created_at:new Date(Date.now()-86400000*10).toISOString()},
  { id:"dv9",  title:"Subaru Outback — Street & Dirt",          channel:"AutoVault",          profiles:{id:"p6",username:"autovault",display_name:"AutoVault",           is_verified:true,followers_count:423000,avatar_url:null}, category:"Autos",     views:1800000,  likes_count:14200, is_vip:false, video_url:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4", thumbnail_url:"https://picsum.photos/640/360?random=9", tags:["suv","offroad"],      duration:"0:15",  created_at:new Date(Date.now()-86400000*8).toISOString() },
  { id:"dv10", title:"Tears of Steel — Sci-Fi VFX Showcase",    channel:"Blender VFX",        profiles:{id:"p8",username:"blendervfx",display_name:"Blender VFX",        is_verified:true,followers_count:312000,avatar_url:null}, category:"Science",   views:9400000,  likes_count:71200, is_vip:true,  video_url:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",         thumbnail_url:"https://picsum.photos/640/360?random=10", tags:["scifi","vfx"],        duration:"12:14", created_at:new Date(Date.now()-86400000*9).toISOString() },
  { id:"dv11", title:"Bullrun — Epic Road Trip",                 channel:"RoadTrip TV",        profiles:{id:"p9",username:"roadtrip",  display_name:"RoadTrip TV",        is_verified:false,followers_count:134000,avatar_url:null}, category:"Travel",    views:3300000,  likes_count:25100, is_vip:false, video_url:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",  thumbnail_url:"https://picsum.photos/640/360?random=11", tags:["travel","road"],      duration:"0:15",  created_at:new Date(Date.now()-86400000*11).toISOString()},
  { id:"dv12", title:"What Car Can You Get for a Grand?",        channel:"AutoVault",          profiles:{id:"p6",username:"autovault",display_name:"AutoVault",           is_verified:true,followers_count:423000,avatar_url:null}, category:"Autos",     views:4800000,  likes_count:36900, is_vip:false, video_url:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4", thumbnail_url:"https://picsum.photos/640/360?random=12",tags:["cars","review"],      duration:"0:15",  created_at:new Date(Date.now()-86400000*12).toISOString()},
];

export const DUMMY_COMMENTS = [
  { id:"dc1",  video_id:"*", user_id:"u1",  body:"Absolutely stunning! The cinematography is on another level 🔥", likes_count:142, created_at:new Date(Date.now()-7200000).toISOString(),  parent_id:null, profiles:{id:"u1", username:"alex_r",    display_name:"Alex Rivera",  avatar_url:null}, replies:[
    { id:"dc1r1", video_id:"*", user_id:"u2", body:"Totally agree, the lighting especially in the second half!", likes_count:31, created_at:new Date(Date.now()-3600000).toISOString(), parent_id:"dc1", profiles:{id:"u2",username:"sam_c",display_name:"Sam Chen",avatar_url:null}, replies:[] },
    { id:"dc1r2", video_id:"*", user_id:"u3", body:"The director really outdid themselves this time! 👏", likes_count:18, created_at:new Date(Date.now()-1800000).toISOString(), parent_id:"dc1", profiles:{id:"u3",username:"priya_n",display_name:"Priya Nair",avatar_url:null}, replies:[] },
  ]},
  { id:"dc2",  video_id:"*", user_id:"u4",  body:"Been watching this on repeat all day. Can't get enough 😍", likes_count:88, created_at:new Date(Date.now()-86400000*3).toISOString(), parent_id:null, profiles:{id:"u4",username:"jordan_k",display_name:"Jordan Kim",avatar_url:null}, replies:[] },
  { id:"dc3",  video_id:"*", user_id:"u5",  body:"This is what quality content looks like. Subscribed immediately.", likes_count:56, created_at:new Date(Date.now()-86400000).toISOString(), parent_id:null, profiles:{id:"u5",username:"morgan_l",display_name:"Morgan Lee",avatar_url:null}, replies:[
    { id:"dc3r1", video_id:"*", user_id:"u6", body:"Same! The editing pace is just perfect.", likes_count:9, created_at:new Date(Date.now()-82000000).toISOString(), parent_id:"dc3", profiles:{id:"u6",username:"taylor_s",display_name:"Taylor Swift2",avatar_url:null}, replies:[] },
  ]},
  { id:"dc4",  video_id:"*", user_id:"u7",  body:"The soundtrack hits different at 2am ngl 🎶", likes_count:234, created_at:new Date(Date.now()-86400000*2).toISOString(), parent_id:null, profiles:{id:"u7",username:"casey_p",display_name:"Casey Park",avatar_url:null}, replies:[] },
  { id:"dc5",  video_id:"*", user_id:"u8",  body:"Anyone else noticed the hidden Easter egg at 2:47? Mind blown!", likes_count:312, created_at:new Date(Date.now()-86400000*4).toISOString(), parent_id:null, profiles:{id:"u8",username:"riley_a",display_name:"Riley Adams",avatar_url:null}, replies:[
    { id:"dc5r1", video_id:"*", user_id:"u9", body:"Oh wow I totally missed that! Going back now!", likes_count:45, created_at:new Date(Date.now()-86400000*3).toISOString(), parent_id:"dc5", profiles:{id:"u9",username:"quinn_d",display_name:"Quinn Davis",avatar_url:null}, replies:[] },
    { id:"dc5r2", video_id:"*", user_id:"u10",body:"You have eagle eyes 😂 I've watched this 5 times!", likes_count:22, created_at:new Date(Date.now()-86400000*3+3600000).toISOString(), parent_id:"dc5", profiles:{id:"u10",username:"avery_s",display_name:"Avery Stone",avatar_url:null}, replies:[] },
  ]},
];
