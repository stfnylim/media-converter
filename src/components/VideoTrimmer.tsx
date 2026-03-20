import { useRef, useState, useCallback, useEffect } from "react";
import { formatDuration } from "../utils/formats";

interface VideoTrimmerProps {
  file: File;
  startTime: number;
  endTime: number; // 0 = use full video
  onDurationLoaded: (duration: number) => void;
  onChange: (start: number, end: number) => void;
}

const THUMB_COUNT = 20;
const MIN_GAP = 0.1;

export function VideoTrimmer({
  file,
  startTime,
  endTime,
  onDurationLoaded,
  onChange,
}: VideoTrimmerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const blobUrlRef = useRef<string>("");

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [thumbsLoading, setThumbsLoading] = useState(false);
  const [dragging, setDragging] = useState<"start" | "end" | null>(null);

  const effectiveEnd = endTime > 0 ? endTime : duration;

  // ── Set video src directly on the DOM node to avoid React Strict Mode
  //    revoking the blob URL between setSrcUrl() and the next render.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const url = URL.createObjectURL(file);
    blobUrlRef.current = url;
    video.src = url;
    video.load();
    return () => {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = "";
      if (videoRef.current) videoRef.current.src = "";
    };
  }, [file]);

  // ── Sync playback state + enforce trim loop
  useEffect(() => {
    const video = videoRef.current;
    if (!video || duration === 0) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Stop at trim end and reset to trim start
      if (!video.paused && video.currentTime >= effectiveEnd) {
        video.pause();
        video.currentTime = startTime;
      }
    };
    const onPlay = () => {
      setIsPlaying(true);
      // If playhead is outside the trim range, jump to start
      if (video.currentTime < startTime || video.currentTime >= effectiveEnd) {
        video.currentTime = startTime;
      }
    };
    const onPause = () => setIsPlaying(false);
    const onVolumeChange = () => setIsMuted(video.muted);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("volumechange", onVolumeChange);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("volumechange", onVolumeChange);
    };
  }, [startTime, effectiveEnd, duration]);

  // ── Load metadata + generate thumbnail strip
  const handleLoadedMetadata = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !isFinite(video.duration) || video.duration <= 0) return;
    const dur = video.duration;
    setDuration(dur);
    onDurationLoaded(dur);

    setThumbsLoading(true);
    const thumbUrl = URL.createObjectURL(file);
    try {
      const tv = document.createElement("video");
      tv.src = thumbUrl;
      tv.muted = true;
      tv.playsInline = true;
      tv.preload = "auto";
      await new Promise<void>((res, rej) => {
        tv.addEventListener("loadedmetadata", () => res(), { once: true });
        tv.addEventListener("error", () => rej(), { once: true });
        setTimeout(rej, 10000);
      });

      const canvas = document.createElement("canvas");
      const aspect = tv.videoWidth / tv.videoHeight || 16 / 9;
      canvas.height = 56;
      canvas.width = Math.round(56 * aspect);
      const ctx = canvas.getContext("2d");
      const thumbs: string[] = [];
      if (ctx) {
        for (let i = 0; i < THUMB_COUNT; i++) {
          tv.currentTime = (i / THUMB_COUNT) * dur;
          await new Promise<void>((res) =>
            tv.addEventListener("seeked", () => res(), { once: true })
          );
          ctx.drawImage(tv, 0, 0, canvas.width, canvas.height);
          thumbs.push(canvas.toDataURL("image/jpeg", 0.55));
        }
        setThumbnails(thumbs);
      }
    } catch {
      // thumbnail generation is optional
    } finally {
      URL.revokeObjectURL(thumbUrl);
      setThumbsLoading(false);
    }
  }, [file, onDurationLoaded]);

  // ── Player controls
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  // ── Timeline interaction
  const xToTime = useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track || duration === 0) return 0;
      const rect = track.getBoundingClientRect();
      return Math.max(0, Math.min((clientX - rect.left) / rect.width, 1)) * duration;
    },
    [duration]
  );

  // Click on the track (not on a handle) to seek
  const onTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (dragging) return;
      const t = xToTime(e.clientX);
      if (videoRef.current) videoRef.current.currentTime = t;
    },
    [dragging, xToTime]
  );

  const onPointerDown =
    (handle: "start" | "end") => (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      setDragging(handle);
    };

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging || duration === 0) return;
      const t = xToTime(e.clientX);
      if (dragging === "start") {
        const clamped = Math.max(0, Math.min(t, effectiveEnd - MIN_GAP));
        onChange(clamped, endTime);
        if (videoRef.current) videoRef.current.currentTime = clamped;
      } else {
        const clamped = Math.max(startTime + MIN_GAP, Math.min(t, duration));
        onChange(startTime, clamped >= duration ? 0 : clamped);
        if (videoRef.current) videoRef.current.currentTime = clamped;
      }
    },
    [dragging, duration, startTime, endTime, effectiveEnd, onChange, xToTime]
  );

  const onPointerUp = useCallback(() => setDragging(null), []);

  const startPct = duration > 0 ? (startTime / duration) * 100 : 0;
  const endPct = duration > 0 ? (effectiveEnd / duration) * 100 : 100;
  const playPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const clipPos = Math.max(0, currentTime - startTime);
  const clipDur = effectiveEnd - startTime;
  const isTrimmed = startTime > 0 || (endTime > 0 && endTime < duration);

  return (
    <div className="space-y-2">
      {/* ── Video + custom controls ── */}
      <div className="rounded-xl overflow-hidden bg-black">
        {/* Video — click to play/pause */}
        <div className="relative cursor-pointer" onClick={togglePlay}>
          <video
            ref={videoRef}
            onLoadedMetadata={handleLoadedMetadata}
            playsInline
            preload="auto"
            className="w-full max-h-72 object-contain block"
          />
          {/* Big play overlay when paused */}
          {!isPlaying && duration > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Controls bar */}
        {duration > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-900/95">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors shrink-0"
            >
              {isPlaying ? (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Time: position within clip / clip duration */}
            <span className="text-xs font-mono text-gray-300 tabular-nums">
              {formatDuration(clipPos)}{" "}
              <span className="text-gray-500">/ {formatDuration(clipDur)}</span>
            </span>

            <div className="flex-1" />

            {/* Trim indicator badge */}
            {isTrimmed && (
              <span className="text-xs font-mono text-violet-400 bg-violet-900/30 px-2 py-0.5 rounded">
                trimmed
              </span>
            )}

            {/* Mute */}
            <button
              onClick={toggleMute}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors shrink-0"
            >
              {isMuted ? (
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── Trim timeline (doubles as progress bar) ── */}
      {duration > 0 && (
        <div className="space-y-2">
          <div className="relative py-3">
            {/* Track */}
            <div
              ref={trackRef}
              className="relative h-14 rounded-lg overflow-hidden bg-gray-900 cursor-pointer"
              onClick={onTrackClick}
            >
              {/* Thumbnail strip */}
              <div className="absolute inset-0 flex pointer-events-none">
                {thumbnails.length > 0
                  ? thumbnails.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        draggable={false}
                        className="h-full shrink-0 object-cover"
                        style={{ width: `${100 / THUMB_COUNT}%` }}
                      />
                    ))
                  : thumbsLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-full flex-1 bg-gray-800 animate-pulse"
                        style={{ animationDelay: `${i * 80}ms` }}
                      />
                    ))
                  : null}
              </div>

              {/* Dim: left of trim */}
              <div
                className="absolute inset-y-0 left-0 bg-black/65 pointer-events-none"
                style={{ width: `${startPct}%` }}
              />
              {/* Dim: right of trim */}
              <div
                className="absolute inset-y-0 right-0 bg-black/65 pointer-events-none"
                style={{ width: `${100 - endPct}%` }}
              />
              {/* Selection border */}
              <div
                className="absolute inset-y-0 border-2 border-violet-400 rounded pointer-events-none"
                style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
              />

              {/* ── Playhead ── */}
              <div
                className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_6px_2px_rgba(255,255,255,0.5)] pointer-events-none z-10 transition-none"
                style={{ left: `${playPct}%` }}
              />
              {/* Playhead dot */}
              <div
                className="absolute top-1/2 w-3 h-3 rounded-full bg-white shadow-md pointer-events-none z-10 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${playPct}%` }}
              />
            </div>

            {/* Start handle */}
            <div
              className="absolute top-0 bottom-0 flex items-center justify-center z-20 cursor-ew-resize touch-none select-none"
              style={{ left: `${startPct}%`, width: 44, transform: "translateX(-50%)" }}
              onPointerDown={onPointerDown("start")}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              <div className={["w-3 h-14 rounded shadow-lg flex flex-col items-center justify-center gap-1 transition-colors",
                dragging === "start" ? "bg-violet-400" : "bg-violet-500"].join(" ")}>
                <div className="w-px h-3 bg-white/70 rounded-full" />
                <div className="w-px h-3 bg-white/70 rounded-full" />
              </div>
            </div>

            {/* End handle */}
            <div
              className="absolute top-0 bottom-0 flex items-center justify-center z-20 cursor-ew-resize touch-none select-none"
              style={{ left: `${endPct}%`, width: 44, transform: "translateX(-50%)" }}
              onPointerDown={onPointerDown("end")}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              <div className={["w-3 h-14 rounded shadow-lg flex flex-col items-center justify-center gap-1 transition-colors",
                dragging === "end" ? "bg-violet-400" : "bg-violet-500"].join(" ")}>
                <div className="w-px h-3 bg-white/70 rounded-full" />
                <div className="w-px h-3 bg-white/70 rounded-full" />
              </div>
            </div>
          </div>

          {/* Time labels */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-500">{formatDuration(startTime)}</span>
            <span className="text-violet-300 font-semibold">
              {formatDuration(clipDur)}
              {isTrimmed && (
                <span className="text-gray-500 font-normal"> / {formatDuration(duration)}</span>
              )}
            </span>
            <span className="text-gray-500">{formatDuration(effectiveEnd)}</span>
          </div>

          {/* Precise time inputs */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Start</span>
              <input
                type="number"
                value={startTime.toFixed(2)}
                min={0}
                max={(effectiveEnd - MIN_GAP).toFixed(2)}
                step={0.1}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(+e.target.value, effectiveEnd - MIN_GAP));
                  onChange(v, endTime);
                  if (videoRef.current) videoRef.current.currentTime = v;
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 font-mono focus:outline-none focus:border-violet-500"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">End</span>
              <input
                type="number"
                value={effectiveEnd.toFixed(2)}
                min={(startTime + MIN_GAP).toFixed(2)}
                max={duration.toFixed(2)}
                step={0.1}
                onChange={(e) => {
                  const v = Math.max(startTime + MIN_GAP, Math.min(+e.target.value, duration));
                  onChange(startTime, v >= duration ? 0 : v);
                  if (videoRef.current) videoRef.current.currentTime = v;
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 font-mono focus:outline-none focus:border-violet-500"
              />
            </label>
          </div>

          {isTrimmed && (
            <button
              onClick={() => { onChange(0, 0); if (videoRef.current) videoRef.current.currentTime = 0; }}
              className="text-xs text-gray-500 hover:text-violet-400 transition-colors"
            >
              ↺ Reset to full video
            </button>
          )}
        </div>
      )}
    </div>
  );
}
