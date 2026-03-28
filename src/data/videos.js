const RAW_VIDEOS = [
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",        thumb:"https://picsum.photos/640/360?random=1",  title:"Big Buck Bunny — Official Short Film 4K",      channel:"Blender Foundation", category:"Cinematic", tags:["animation","cinematic","4k","short film"], badge:"4K"  },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",       thumb:"https://picsum.photos/640/360?random=2",  title:"Elephants Dream — Sci-Fi Animation",            channel:"Blender Institute",  category:"Cinematic", tags:["scifi","animation","art","short"],          badge:"HD"  },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",      thumb:"https://picsum.photos/640/360?random=3",  title:"For Bigger Blazes — Action Reel",               channel:"NovaCinema",         category:"Sports",   tags:["action","fire","reel","hot"],               badge:"HOT" },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",     thumb:"https://picsum.photos/640/360?random=4",  title:"For Bigger Escapes — Epic Stunts",              channel:"UrbanFilms",         category:"Sports",   tags:["stunts","escape","adventure","hd"],         badge:"NEW" },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",         thumb:"https://picsum.photos/640/360?random=5",  title:"For Bigger Fun — Lifestyle & Comedy",           channel:"FunVault",           category:"Lifestyle",tags:["fun","comedy","lifestyle"],                badge:null  },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",    thumb:"https://picsum.photos/640/360?random=6",  title:"For Bigger Joyrides — Supercar Edition",        channel:"AutoVault",          category:"Autos",    tags:["cars","joyride","supercar","speed"],        badge:"HD"  },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",   thumb:"https://picsum.photos/640/360?random=7",  title:"For Bigger Meltdowns — Drama Cuts",             channel:"DramaHub",           category:"Cinematic",tags:["drama","intense","film","emotional"],       badge:null  },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",               thumb:"https://picsum.photos/640/360?random=8",  title:"Sintel — Award Winning Dragon Short",           channel:"Blender Foundation", category:"Cinematic",tags:["fantasy","dragon","award","cinematic"],     badge:"VIP" },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4", thumb:"https://picsum.photos/640/360?random=9", title:"Subaru Outback — Street & Dirt Challenge", channel:"AutoVault", category:"Autos", tags:["suv","offroad","adventure","cars"], badge:"HD" },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",         thumb:"https://picsum.photos/640/360?random=10", title:"Tears of Steel — Sci-Fi VFX Showcase",         channel:"Blender VFX",        category:"Science",  tags:["scifi","vfx","robots","future"],            badge:"4K"  },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",  thumb:"https://picsum.photos/640/360?random=11", title:"We Are Going On Bullrun — Road Trip",           channel:"RoadTrip TV",        category:"Travel",   tags:["roadtrip","travel","bullrun","cars"],       badge:"NEW" },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4", thumb:"https://picsum.photos/640/360?random=12", title:"What Car Can You Get for a Grand?",        channel:"AutoVault",          category:"Autos",    tags:["cars","budget","review","guide"],           badge:null  },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",         thumb:"https://picsum.photos/640/360?random=13", title:"Mountain Sunrise Timelapse — Golden Hour",      channel:"NatureLens",         category:"Nature",   tags:["timelapse","nature","mountains","4k"],      badge:"4K"  },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",       thumb:"https://picsum.photos/640/360?random=14", title:"Tokyo Night Walk — 4K City Experience",         channel:"UrbanFilms",         category:"Travel",   tags:["tokyo","city","nightlife","walk"],          badge:"HD"  },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",      thumb:"https://picsum.photos/640/360?random=15", title:"Full Body HIIT Workout — 45 Minutes Burn",      channel:"FitLife",            category:"Fitness",  tags:["hiit","fitness","workout","burn"],          badge:"NEW" },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",     thumb:"https://picsum.photos/640/360?random=16", title:"Deep Ocean Dive — Great Barrier Reef 4K",       channel:"OceanVault",         category:"Nature",   tags:["ocean","reef","diving","4k"],              badge:"4K"  },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",               thumb:"https://picsum.photos/640/360?random=17", title:"Northern Lights — Iceland 8 Hour Loop",         channel:"SkyLens",            category:"Nature",   tags:["aurora","iceland","night","timelapse"],     badge:"HOT" },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",         thumb:"https://picsum.photos/640/360?random=18", title:"Street Food Tour — Bangkok Night Markets",      channel:"FoodVault",          category:"Food",     tags:["food","bangkok","streetfood","travel"],    badge:null  },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",  thumb:"https://picsum.photos/640/360?random=19", title:"Electronic Music Studio — Behind the Scenes",   channel:"BeatLab",            category:"Music",    tags:["music","edm","studio","behindscenes"],     badge:"VIP" },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4", thumb:"https://picsum.photos/640/360?random=20", title:"Gaming Setup Tour — $10K Ultimate Build",  channel:"TechDen",            category:"Gaming",   tags:["gaming","setup","pc","tech"],              badge:"NEW" },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",         thumb:"https://picsum.photos/640/360?random=21", title:"Big Wave Surfing — Pipeline Masters",           channel:"WildCapture",        category:"Sports",   tags:["surfing","bigwave","pipeline","extreme"],  badge:"HOT" },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",    thumb:"https://picsum.photos/640/360?random=22", title:"Aerial Drone — Swiss Alps Cinematic",           channel:"SkyLens",            category:"Travel",   tags:["drone","aerial","alps","cinematic"],       badge:"4K"  },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",   thumb:"https://picsum.photos/640/360?random=23", title:"Space Telescope — James Webb Deep Field",       channel:"CosmosTV",           category:"Science",  tags:["space","telescope","nasa","cosmos"],       badge:"HD"  },
  { src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4", thumb:"https://picsum.photos/640/360?random=24", title:"Hip-Hop Dance Masterclass — Vol. 7", channel:"DanceDen", category:"Fitness", tags:["dance","hiphop","masterclass","choreography"], badge:"NEW" },
];

const seed = 42;
const rng = (i, offset=0) => {
  const x = Math.sin(i * 9301 + offset * 49297 + seed) * 49297;
  return x - Math.floor(x);
};

export const ALL_VIDEOS = RAW_VIDEOS.map((v, i) => ({
  id: i + 1,
  ...v,
  duration: `${Math.floor(rng(i,1) * 22 + 3)}:${String(Math.floor(rng(i,2) * 60)).padStart(2,"0")}`,
  views:    `${(rng(i,3) * 9.5 + 0.3).toFixed(1)}M`,
  likes:    Math.floor(rng(i,4) * 80000 + 2000),
  rating:   (rng(i,5) * 2 + 7.5).toFixed(1),
  age:      `${Math.floor(rng(i,6) * 29 + 1)}d`,
}));

export const CATEGORIES = [
  { icon:"🎬", name:"Cinematic", count:"48.2K", color:"#ef4444" },
  { icon:"🌊", name:"Nature",    count:"32.1K", color:"#3b82f6" },
  { icon:"🏋️", name:"Fitness",  count:"21.8K", color:"#10b981" },
  { icon:"🍜", name:"Food",      count:"18.9K", color:"#f59e0b" },
  { icon:"🏙️", name:"Urban",    count:"15.3K", color:"#8b5cf6" },
  { icon:"🎵", name:"Music",     count:"29.4K", color:"#ec4899" },
  { icon:"✈️", name:"Travel",   count:"41.7K", color:"#06b6d4" },
  { icon:"🔬", name:"Science",   count:"12.6K", color:"#84cc16" },
  { icon:"🎮", name:"Gaming",    count:"55.2K", color:"#f97316" },
  { icon:"🏎️", name:"Autos",    count:"23.1K", color:"#64748b" },
  { icon:"🌌", name:"Space",     count:"9.8K",  color:"#7c3aed" },
  { icon:"🏄", name:"Sports",    count:"37.5K", color:"#0ea5e9" },
];

export const CHANNELS = [
  "NatureLens","UrbanFilms","WildCapture","SkyLens","BeatLab",
  "OceanVault","FitLife","AutoVault","TechDen","FoodVault",
  "Blender Foundation","CosmosTV",
];
