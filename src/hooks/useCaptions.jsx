// src/hooks/useCaptions.js
import { useEffect, useRef, useState, useCallback } from "react";

const CAPTION_SERVER = import.meta.env.VITE_CAPTION_SERVER || "http://localhost:3001";
const CHUNK_MS = 3000;
const OVERLAP_MS = 500;

function injectVTTTrack(videoEl, vttUrl) {
  const old = videoEl.querySelector("track[data-ai-caption]");
  if (old) old.remove();

  const track = document.createElement("track");
  track.kind = "subtitles";
  track.label = "AI Caption";
  track.setAttribute("data-ai-caption", "true");
  track.src = vttUrl;
  track.default = true;
  videoEl.appendChild(track);

  const wait = setInterval(() => {
    const tt = Array.from(videoEl.textTracks).find(t => t.label === "AI Caption");
    if (tt) { tt.mode = "showing"; clearInterval(wait); }
  }, 100);
  setTimeout(() => clearInterval(wait), 3000);

  return track;
}

function removeAITracks(videoEl) {
  if (!videoEl) return;
  videoEl.querySelectorAll("track[data-ai-caption]").forEach(t => t.remove());
  Array.from(videoEl.textTracks).forEach(t => {
    if (t.label === "AI Caption") t.mode = "hidden";
  });
}

function buildVTTBlob(cues) {
  const lines = ["WEBVTT", ""];
  cues.forEach((c, i) => {
    lines.push(`${i + 1}`);
    lines.push(`${secToVTT(c.start)} --> ${secToVTT(c.end)}`);
    lines.push(c.text);
    lines.push("");
  });
  return URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/vtt" }));
}

function secToVTT(s) {
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const sec = (s % 60).toFixed(3).padStart(6, "0");
  return `${h}:${m}:${sec}`;
}

export function useCaptions({ vRef, captionLang, videoUrl, videoId }) {
  const [captionStatus, setCaptionStatus] = useState("idle");

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const blobUrlsRef      = useRef([]);
  const allCuesRef       = useRef([]);
  const chunkTimerRef    = useRef(null);
  const trackElRef       = useRef(null);
  const streamRef        = useRef(null);

  const teardown = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      try { mediaRecorderRef.current?.stop(); } catch (_) {}
    }
    mediaRecorderRef.current = null;

    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;

    clearInterval(chunkTimerRef.current);
    chunkTimerRef.current = null;

    blobUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
    blobUrlsRef.current = [];
    allCuesRef.current = [];

    if (vRef.current) removeAITracks(vRef.current);

    setCaptionStatus("idle");
  }, [vRef]);

  const sendChunk = useCallback(async (blob, offsetSec, lang) => {
    if (!blob || blob.size < 1000) return;

    const form = new FormData();
    form.append("audio", blob, "chunk.webm");
    form.append("lang", lang);
    form.append("offset", String(offsetSec));

    try {
      const res  = await fetch(`${CAPTION_SERVER}/caption/chunk`, { method: "POST", body: form });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();

      if (!data.cues?.length) return;

      const existingStarts = new Set(allCuesRef.current.map(c => c.start));
      const newCues = data.cues.filter(c => !existingStarts.has(c.start));
      allCuesRef.current = [...allCuesRef.current, ...newCues].sort((a, b) => a.start - b.start);

      const vttUrl = buildVTTBlob(allCuesRef.current);
      blobUrlsRef.current.push(vttUrl);

      if (vRef.current) {
        injectVTTTrack(vRef.current, vttUrl);
        trackElRef.current = vRef.current.querySelector("track[data-ai-caption]");
      }

      setCaptionStatus("active");
    } catch (err) {
      console.warn("[useCaptions] chunk error:", err.message);
    }
  }, [vRef]);

  const startChunkMode = useCallback(async (lang) => {
    const videoEl = vRef.current;
    if (!videoEl) return;

    setCaptionStatus("loading");

    try {
      let stream;
      if (videoEl.captureStream) {
        stream = videoEl.captureStream();
      } else if (videoEl.mozCaptureStream) {
        stream = videoEl.mozCaptureStream();
      } else {
        throw new Error("captureStream not supported");
      }

      const audioStream = new MediaStream(stream.getAudioTracks());
      streamRef.current = audioStream;

      const recorder = new MediaRecorder(audioStream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(CHUNK_MS);

      chunkTimerRef.current = setInterval(async () => {
        if (!chunksRef.current.length) return;

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];

        const offsetSec = Math.max(0, (videoEl.currentTime || 0) - (CHUNK_MS / 1000));
        await sendChunk(blob, offsetSec, lang);
      }, CHUNK_MS + OVERLAP_MS);

      setCaptionStatus("active");

    } catch (err) {
      console.error("[useCaptions] Chunk mode failed:", err.message);
      setCaptionStatus("error");
    }
  }, [vRef, sendChunk]);

  const startVODMode = useCallback(async (lang) => {
    if (!videoUrl) return;
    setCaptionStatus("loading");

    try {
      const url = `${CAPTION_SERVER}/caption/vtt?url=${encodeURIComponent(videoUrl)}&lang=${lang}&vid=${videoId}`;
      const res = await fetch(url);
      if (res.ok) {
        const vtt = await res.text();
        const blob = new Blob([vtt], { type: "text/vtt" });
        const blobUrl = URL.createObjectURL(blob);
        blobUrlsRef.current.push(blobUrl);

        if (vRef.current) injectVTTTrack(vRef.current, blobUrl);
        setCaptionStatus("active");
      } else {
        console.log("[useCaptions] VOD not ready yet, falling back to chunk mode");
        startChunkMode(lang);
      }
    } catch (err) {
      console.warn("[useCaptions] VOD fetch failed, trying chunk mode:", err.message);
      startChunkMode(lang);
    }
  }, [videoUrl, videoId, vRef, startChunkMode]);

  useEffect(() => {
    teardown();
    if (captionLang === "off" || !captionLang) return;

    const t = setTimeout(() => {
      startVODMode(captionLang);
    }, 400);

    return () => clearTimeout(t);
  }, [captionLang, videoId]); // eslint-disable-line

  useEffect(() => () => teardown(), []); // eslint-disable-line

  return { captionStatus };
}
