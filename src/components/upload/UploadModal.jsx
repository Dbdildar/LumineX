import { useState, useRef, useEffect } from "react";
import { C, Modal, Btn, Input, Spinner } from "../ui/index";
import { useApp } from "../../context/AppContext";
import { supabase, videoAPI } from "../../lib/supabase";

/**
 * A look-up helper for icons. 
 * Since icons aren't in the DB, we map them by name.
 */
const GET_ICON = (name) => {
const categories = [
  // Popular & Mainstream
  "Amateur", "Anal", "BDSM", "Big Butt", "Big Tits", "Blowjob", "Creampie", 
  "Cumshot", "Hardcore", "MILF", "POV", "Public", "Solo", "Teen (18+)", "Threesome",
  
  // Ethnic & International
  "Asian", "Arab", "Brazilian", "Ebony", "Indian", "Interracial", "Japanese", 
  "Latina", "Russian",

  // Orientation & Niche
  "Bisexual", "Gay", "Lesbian", "Queer", "Transgender",
  
  // Style & Theme
  "Babysitter", "Behind The Scenes", "Cosplay", "Double Penetration", "Fetish", 
  "Handjob", "Massage", "Masturbation", "Office", "Orgy", "Outdoor", "Party", 
  "Reality", "Romance", "Squirt", "Uniform", "Vintage", "Virtual Reality", "Webcam"
];

  // Find if the input 'name' contains any of our categories
const match = categories.find(cat => name?.toLowerCase().includes(cat.toLowerCase()));
  // Return the matched category name, or an empty string if no match
  return match || "";
};

export default function UploadModal() {
  const { uploadModal, setUploadModal, session } = useApp();
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const [step, setStep] = useState(1);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPrev, setVideoPrev] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const [videoMeta, setVideoMeta] = useState({ duration: 0, size: "" });
  const [thumbnails, setThumbnails] = useState([]);
  const [selectedThumb, setSelectedThumb] = useState(null);
  const [isGeneratingThumbs, setIsGeneratingThumbs] = useState(false);

  const [form, setForm] = useState({ title: "", categories: [], description: "" });
  const [errors, setErrors] = useState({});
  const vInput = useRef(null);

  // Dynamic Categories State
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // 1. Fetch Categories on Mount
  useEffect(() => {
    async function loadCategories() {
      if (!uploadModal) return;
      try {
        setLoadingCats(true);
        const cats = await videoAPI.getCategories();
        setDynamicCategories(cats || []);
      } catch (err) {
        console.error("Failed to load categories", err);
      } finally {
        setLoadingCats(false);
      }
    }
    loadCategories();
  }, [uploadModal]);

  // 2. Auto-close success message
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        close();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  if (!uploadModal) return null;

  const close = () => {
    if (isUploading) return;
    setUploadModal(false);
    setStep(1);
    setVideoFile(null);
    setVideoPrev(null);
    setThumbnails([]);
    setSelectedThumb(null);
    setUploadProgress(0);
    setForm({ title: "", categories: [], description: "" });
    setErrors({});
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const generateThumbnails = async (file) => {
    setIsGeneratingThumbs(true);
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;

    return new Promise((resolve) => {
      video.onloadedmetadata = async () => {
        setVideoMeta({ duration: video.duration, size: formatSize(file.size) });
        // Calculate sharp scale for mobile/desktop
        const scale = Math.min(1, 400 / video.videoWidth);
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;

        const times = [0.1, 0.3, 0.6, 0.9].map(p => p * video.duration);
        const thumbs = [];

        for (const time of times) {
          video.currentTime = time;
          await new Promise(r => (video.onseeked = r));
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          thumbs.push(canvas.toDataURL("image/jpeg", 0.7));
        }
        setThumbnails(thumbs);
        setSelectedThumb(thumbs[0]);
        setIsGeneratingThumbs(false);
        URL.revokeObjectURL(videoUrl);
        video.remove();
        resolve();
      };
    });
  };

  const onVideoSelect = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setErrors({ file: "Only video files are allowed" });
      return;
    }
    if (f.size > 500 * 1024 * 1024) {
      setErrors({ file: "Video is too large (Max 500MB)" });
      return;
    }
    setErrors({});
    setVideoFile(f);
    setVideoPrev(URL.createObjectURL(f));
    setForm(p => ({ ...p, title: f.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ") }));
    setStep(2);
    await generateThumbnails(f);
  };

  const toggleCategory = (cat) => {
    if (isUploading) return;
    setForm(prev => {
      const exists = prev.categories.includes(cat);
      if (exists) {
        return { ...prev, categories: prev.categories.filter(c => c !== cat) };
      } else {
        return { ...prev, categories: [...prev.categories, cat] };
      }
    });
  };

const handleSubmit = async () => {
  if (!canSubmit) return;

  setIsUploading(true);
  setUploadProgress(0);

  try {
    const userId = session?.user?.id;
    if (!userId) throw new Error("Please log in to upload");

    // 1. PREPARE FILE PATHS
    const fileExt = videoFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // 2. GET PRESIGNED URL FROM YOUR WORKER
    // This allows the browser to upload directly to Backblaze
    const { uploadUrl } = await fetch('https://luminex.dbdildar007.workers.dev/api/b2-presigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, contentType: videoFile.type })
    }).then(res => res.json());

    if (!uploadUrl) throw new Error("Failed to generate upload link");

    // 3. UPLOAD VIDEO DIRECTLY TO BACKBLAZE
    const b2Response = await fetch(uploadUrl, {
      method: 'PUT',
      body: videoFile,
      headers: { 'Content-Type': videoFile.type }
    });

    if (!b2Response.ok) throw new Error("Backblaze Upload Failed");

    // 4. UPLOAD THUMBNAIL TO CLOUDINARY (Existing Logic)
    const thumbBlob = await (await fetch(selectedThumb)).blob();
    const thumbData = new FormData();
    thumbData.append("file", thumbBlob);
    thumbData.append("upload_preset", "luminex");

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/dxv2ijftd/image/upload`,
      { method: "POST", body: thumbData }
    );
    const cloudJson = await cloudRes.json();
    const optimizedThumbUrl = cloudJson.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');

    // 5. PUSH URL AND METADATA TO SUPABASE
    // We store the CLOUDFLARE URL so traffic is free via Bandwidth Alliance
    const cloudflareVideoUrl = `https://luminex.dbdildar007.workers.dev/view/${filePath}`;

    const { error: dbError } = await supabase.from('videos').insert([{
      user_id: userId,
      title: form.title,
      categories: form.categories,
      video_url: cloudflareVideoUrl, // <--- This link plays the B2 file via Cloudflare
      thumbnail_url: optimizedThumbUrl, 
      duration: videoMeta.duration,
      size: videoFile.size
    }]);

    if (dbError) throw dbError;

    setIsUploading(false);
    setShowSuccess(true);

  } catch (err) {
    setIsUploading(false);
    console.error(err);
    alert(err.message || "Upload failed");
  }
};
  

  const canSubmit = form.title.trim() && form.categories.length > 0 && selectedThumb && !isGeneratingThumbs && !isUploading;

  return (
    <Modal onClose={close} maxWidth={480}>
      <div style={{ position: "relative", minHeight: 300, paddingBottom: 10 }}>

        {step === 1 && (
          <div style={{ textAlign: "center", padding: isMobile ? "10px 0" : "20px 0" }}>
            <h2 style={headerStyle}>Upload Video</h2>
            <div onClick={() => vInput.current?.click()} style={dropzoneStyle}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📤</div>
              <p style={{ fontWeight: 700, color: C.text }}>Select video to upload</p>
              <p style={{ fontSize: 12, color: C.muted }}>MP4 or MOV up to 500MB</p>
              <input ref={vInput} type="file" multiple={false} accept="video/*" onChange={onVideoSelect} style={{ display: "none" }} />
              {errors.file && <p style={errorStyle}>{errors.file}</p>}
            </div>
          </div>
        )}

        {step === 2 && !showSuccess && (
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 14 : 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ ...headerStyle, marginBottom: 0 }}>Video Details</h2>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>
                {videoMeta.size} • {formatDuration(videoMeta.duration)}
              </div>
            </div>

            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#000', aspectRatio: '16/9' }}>
              <video src={videoPrev} controls playsInline style={{ width: '100%', height: '100%' }} />
            </div>

            {/* Thumbnail Selection */}
            <div>
              <label style={labelStyle}>Select Cover Image *</label>
              {isGeneratingThumbs ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 0' }}>
                  <Spinner size={16} /> <span style={{ fontSize: 12, color: C.muted }}>Generating previews...</span>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {thumbnails.map((t, i) => (
                    <div key={i} onClick={() => setSelectedThumb(t)} style={{
                      aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                      border: `3px solid ${selectedThumb === t ? C.accent : 'transparent'}`,
                      transition: '0.2s', transform: selectedThumb === t ? 'scale(1.02)' : 'scale(1)'
                    }}><img src={t} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                  ))}
                </div>
              )}
            </div>

            <Input
              label="Video Title *"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Give your clip a title"
              disabled={isUploading}
            />

            {/* --- DYNAMIC MULTI-SELECT CATEGORIES --- */}
            <div>
              <label style={labelStyle}>Categories (Select 1 or more) *</label>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {form.categories.length === 0 && <span style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }}>Please select a sport...</span>}
                {form.categories.map(cat => (
                  <div key={cat} style={tagStyle}>
                    {GET_ICON(cat)} {cat}
                    <span onClick={() => toggleCategory(cat)} style={{ marginLeft: 6, cursor: 'pointer', fontSize: 14 }}>✕</span>
                  </div>
                ))}
              </div>

              <div style={categoryPickerStyle}>
                {loadingCats ? <Spinner size={16} /> : dynamicCategories.map(cat => {
                  const active = form.categories.includes(cat);
                  return (
                    <div
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      style={{
                        ...pillStyle,
                        background: active ? C.accent : C.bg3,
                        color: active ? '#fff' : C.text,
                        borderColor: active ? C.accent : C.border,
                      }}
                    >
                      {GET_ICON(cat)} {cat}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <Btn variant="secondary" style={{ flex: 1 }} onClick={() => setStep(1)} disabled={isUploading}>Back</Btn>
              <Btn onClick={handleSubmit} loading={isUploading} disabled={!canSubmit} style={{ flex: 2, position: 'relative', overflow: 'hidden' }}>
                {isUploading && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${uploadProgress}%`, background: 'rgba(255,255,255,0.2)', transition: 'width 0.3s' }} />}
                <span style={{ position: 'relative', zIndex: 1 }}>{isUploading ? `Uploading ${uploadProgress}%` : "Post Video"}</span>
              </Btn>
            </div>
          </div>
        )}

        {showSuccess && (
          <div style={successOverlayStyle}>
            <div style={{ fontSize: 50 }}>✅</div>
            <h2 style={{ color: "white", marginTop: 10, fontWeight: 900 }}>Post Success!</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>Your video is now live.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// --- Styles ---
const headerStyle = { fontSize: 20, fontWeight: 900, marginBottom: 20, color: C.text, textAlign: 'left' };

const dropzoneStyle = {
  border: `2px dashed ${C.border}`,
  borderRadius: 24,
  padding: "60px 20px",
  background: C.bg3,
  cursor: "pointer",
  transition: "0.2s"
};

const labelStyle = { display: "block", fontSize: 11, fontWeight: 800, color: C.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 };

const categoryPickerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  maxHeight: 140,
  overflowY: 'auto',
  padding: '12px',
  background: C.bg2,
  borderRadius: 16,
  border: `1px solid ${C.border}`,
  scrollbarWidth: 'none'
};

const pillStyle = {
  padding: '8px 14px',
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: '0.2s',
  border: '1px solid transparent',
  display: 'flex',
  alignItems: 'center',
  gap: 6
};

const tagStyle = {
  padding: '6px 12px',
  borderRadius: 10,
  background: C.accent,
  color: '#fff',
  fontSize: 12,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const errorStyle = { color: "#ff4d4d", fontSize: 11, marginTop: 10, fontWeight: 600 };

const successOverlayStyle = {
  position: "absolute", top: -20, left: -20, right: -20, bottom: -20,
  background: C.accent, borderRadius: 24, display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center", zIndex: 100, textAlign: 'center'
};

const selectStyle = {
  width: "100%", background: C.bg3, border: `1.5px solid ${C.border}`,
  borderRadius: 12, color: C.text, padding: "14px", fontSize: 14, outline: "none"
};
