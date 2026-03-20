import { useState, useCallback, useEffect } from "react";
import { DropZone, FilePreview } from "./components/DropZone";
import { FormatSelector } from "./components/FormatSelector";
import { OptionsPanel } from "./components/OptionsPanel";
import { ProgressBar } from "./components/ProgressBar";
import { OutputPreview } from "./components/OutputPreview";
import { VideoTrimmer } from "./components/VideoTrimmer";
import { useFFmpeg } from "./hooks/useFFmpeg";
import {
  detectFormat,
  getSuggestedOutputFormats,
  FormatInfo,
} from "./utils/formats";
import {
  DEFAULT_GIF_OPTIONS,
  DEFAULT_VIDEO_OPTIONS,
  DEFAULT_AUDIO_OPTIONS,
  DEFAULT_IMAGE_OPTIONS,
  GifOptions,
  VideoOptions,
  AudioOptions,
  ImageOptions,
  TrimOptions,
  buildGifCommand,
  buildVideoCommand,
  buildAudioCommand,
  buildImageCommand,
} from "./utils/ffmpegCommands";

const sabSupported = typeof SharedArrayBuffer !== "undefined";

export default function App() {
  const ffmpeg = useFFmpeg();

  const [file, setFile] = useState<File | null>(null);
  const [inputFormat, setInputFormat] = useState<FormatInfo | null>(null);
  const [outputFormat, setOutputFormat] = useState<FormatInfo | null>(null);
  const [suggestedFormats, setSuggestedFormats] = useState<FormatInfo[]>([]);
  const [showLog, setShowLog] = useState(false);

  // Trim state — used for video/gif inputs
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0); // 0 = full duration
  const [videoDuration, setVideoDuration] = useState(0);

  // Output filename (editable, auto-populated from input file)
  const [outputBaseName, setOutputBaseName] = useState("");

  const [gifOptions, setGifOptions] = useState<GifOptions>(DEFAULT_GIF_OPTIONS);
  const [videoOptions, setVideoOptions] = useState<VideoOptions>(DEFAULT_VIDEO_OPTIONS);
  const [audioOptions, setAudioOptions] = useState<AudioOptions>(DEFAULT_AUDIO_OPTIONS);
  const [imageOptions, setImageOptions] = useState<ImageOptions>(DEFAULT_IMAGE_OPTIONS);

  useEffect(() => {
    ffmpeg.load();
  }, []);

  const handleFile = useCallback(
    (f: File) => {
      ffmpeg.reset();
      setFile(f);
      setTrimStart(0);
      setTrimEnd(0);
      setVideoDuration(0);
      setOutputBaseName(f.name.replace(/\.[^.]+$/, ""));

      const fmt = detectFormat(f);
      setInputFormat(fmt);
      if (fmt) {
        const suggestions = getSuggestedOutputFormats(fmt);
        setSuggestedFormats(suggestions);
        if (fmt.category === "video") {
          const gif = suggestions.find((s) => s.ext === "gif");
          setOutputFormat(gif ?? suggestions[0] ?? null);
        } else {
          setOutputFormat(suggestions[0] ?? null);
        }
      } else {
        setSuggestedFormats([]);
        setOutputFormat(null);
      }
    },
    [ffmpeg]
  );

  const handleTrimChange = useCallback((start: number, end: number) => {
    setTrimStart(start);
    setTrimEnd(end);
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file || !outputFormat || !inputFormat) return;

    const outputExt = outputFormat.ext;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const safeBase = (outputBaseName.trim() || safeName.replace(/\.[^.]+$/, ""))
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    const outputName = safeBase + "." + outputExt;

    const trim: TrimOptions = {
      start: trimStart,
      end: trimEnd,
      totalDuration: videoDuration,
    };

    let args: string[];
    const inputPlaceholder = safeName;

    if (outputExt === "gif") {
      args = buildGifCommand(inputPlaceholder, outputName, gifOptions, trim);
    } else if (
      outputFormat.category === "video" ||
      (inputFormat.category === "video" && outputFormat.category === "audio")
    ) {
      args = buildVideoCommand(inputPlaceholder, outputName, outputExt, videoOptions, trim);
    } else if (outputFormat.category === "audio") {
      args = buildAudioCommand(inputPlaceholder, outputName, outputExt, audioOptions, trim);
    } else {
      args = buildImageCommand(inputPlaceholder, outputName, outputExt, imageOptions, trim);
    }

    await ffmpeg.convert(file, args, outputName);
  }, [
    file,
    inputFormat,
    outputFormat,
    outputBaseName,
    trimStart,
    trimEnd,
    videoDuration,
    gifOptions,
    videoOptions,
    audioOptions,
    imageOptions,
    ffmpeg,
  ]);

  const handleReset = useCallback(() => {
    setFile(null);
    setInputFormat(null);
    setOutputFormat(null);
    setSuggestedFormats([]);
    setTrimStart(0);
    setTrimEnd(0);
    setVideoDuration(0);
    setOutputBaseName("");
    ffmpeg.reset();
  }, [ffmpeg]);

  const isConverting = ffmpeg.status === "converting";
  const isLoading = ffmpeg.status === "loading";
  const isDone = ffmpeg.status === "done";
  const canConvert =
    !!file && !!outputFormat && ffmpeg.status === "ready" && sabSupported;

  const showTrimmer =
    !!file &&
    !!inputFormat &&
    (inputFormat.category === "video" || inputFormat.category === "gif") &&
    !isDone;

  const statusMessage = {
    idle: "Initializing...",
    loading: "Loading FFmpeg…",
    ready: "Ready",
    converting: "Converting…",
    done: "Done!",
    error: "Error",
  }[ffmpeg.status];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              MC
            </div>
            <div>
              <h1 className="font-bold text-gray-100 leading-tight">Media Converter</h1>
              <p className="text-xs text-gray-500 leading-tight hidden sm:block">
                In-browser · No uploads · Powered by FFmpeg
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={[
                "w-2 h-2 rounded-full shrink-0",
                {
                  idle: "bg-gray-600",
                  loading: "bg-yellow-400 animate-pulse",
                  ready: "bg-green-500",
                  converting: "bg-blue-400 animate-pulse",
                  done: "bg-green-500",
                  error: "bg-red-500",
                }[ffmpeg.status],
              ].join(" ")}
            />
            <span className="text-xs text-gray-400">{statusMessage}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Compatibility warning */}
        {!sabSupported && (
          <div className="p-4 bg-red-900/20 border border-red-700/40 rounded-xl text-red-300 text-sm space-y-1">
            <p className="font-semibold">Browser not supported</p>
            <p>
              Your browser lacks{" "}
              <code className="font-mono text-xs bg-red-950 px-1 rounded">SharedArrayBuffer</code>
              , required by FFmpeg. Use Chrome, Firefox, or Safari 15.2+ on iOS.
            </p>
          </div>
        )}

        {/* Loading banner */}
        {isLoading && (
          <div className="flex items-center gap-3 p-4 bg-yellow-900/20 border border-yellow-700/40 rounded-xl text-yellow-300 text-sm">
            <span className="animate-spin shrink-0">⟳</span>
            Loading FFmpeg WebAssembly (one-time ~20 MB download)…
          </div>
        )}

        {/* Error banner */}
        {ffmpeg.error && (
          <div className="p-4 bg-red-900/20 border border-red-700/40 rounded-xl text-red-300 text-sm space-y-1">
            <p className="font-semibold">Error</p>
            <p className="font-mono text-xs break-all">{ffmpeg.error}</p>
            <button
              onClick={() => ffmpeg.load()}
              className="text-red-400 hover:text-red-200 underline text-xs mt-1"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Step 1: File ── */}
        {!isDone && (
          <section className="space-y-3">
            <StepLabel n={1} label="Select File" />
            {!file ? (
              <DropZone onFile={handleFile} disabled={isConverting || isLoading} />
            ) : (
              <div className="flex items-center justify-between gap-3 p-3 bg-gray-900/60 rounded-xl border border-gray-800">
                {inputFormat && (
                  <FilePreview file={file} format={inputFormat.label} />
                )}
                <button
                  onClick={handleReset}
                  className="text-sm text-gray-500 hover:text-red-400 transition-colors shrink-0 px-2"
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            )}
            {file && !inputFormat && (
              <p className="text-sm text-yellow-400 p-3 bg-yellow-900/20 rounded-xl border border-yellow-700/40">
                Could not detect file format. Try renaming with a known extension.
              </p>
            )}
          </section>
        )}

        {/* ── Step 2: Trim (video/gif inputs only) ── */}
        {showTrimmer && file && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <StepLabel n={2} label="Trim Clip" optional />
              {(trimStart > 0 || trimEnd > 0) && (
                <span className="text-xs font-mono text-violet-400 bg-violet-900/20 px-2 py-1 rounded-lg">
                  {trimStart.toFixed(1)}s – {(trimEnd > 0 ? trimEnd : videoDuration).toFixed(1)}s
                </span>
              )}
            </div>
            <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800">
              <VideoTrimmer
                file={file}
                startTime={trimStart}
                endTime={trimEnd}
                onDurationLoaded={setVideoDuration}
                onChange={handleTrimChange}
              />
            </div>
          </section>
        )}

        {/* ── Step 3: Format + Options (side-by-side on desktop) ── */}
        {file && inputFormat && suggestedFormats.length > 0 && !isDone && (
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Format */}
              <div className="space-y-3">
                <StepLabel n={showTrimmer ? 3 : 2} label="Output Format" />
                <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800">
                  <FormatSelector
                    formats={suggestedFormats}
                    selected={outputFormat}
                    onSelect={setOutputFormat}
                  />
                </div>
              </div>

              {/* Options */}
              {outputFormat && (
                <div className="space-y-3">
                  <StepLabel n={showTrimmer ? 4 : 3} label="Options" />
                  <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800">
                    <OptionsPanel
                      outputFormat={outputFormat}
                      inputCategory={inputFormat.category}
                      gifOptions={gifOptions}
                      videoOptions={videoOptions}
                      audioOptions={audioOptions}
                      imageOptions={imageOptions}
                      onGifChange={setGifOptions}
                      onVideoChange={setVideoOptions}
                      onAudioChange={setAudioOptions}
                      onImageChange={setImageOptions}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Convert button ── */}
        {file && outputFormat && !isDone && (
          <div className="flex justify-center pt-2">
            <button
              onClick={handleConvert}
              disabled={!canConvert || isConverting}
              className={[
                "w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-lg transition-all",
                canConvert && !isConverting
                  ? "bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white shadow-xl shadow-violet-900/40 hover:scale-105 active:scale-95"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed",
              ].join(" ")}
            >
              {isConverting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⟳</span>
                  Converting…
                </span>
              ) : isLoading ? (
                "Loading FFmpeg…"
              ) : (
                `Convert to ${outputFormat.label}`
              )}
            </button>
          </div>
        )}

        {/* ── Progress ── */}
        {(isConverting || isDone) && (
          <div className="p-5 bg-gray-900/60 rounded-2xl border border-gray-800">
            <ProgressBar
              progress={ffmpeg.progress}
              status={isConverting ? "Converting…" : "Conversion complete!"}
              log={ffmpeg.log}
              showLog={showLog}
              onToggleLog={() => setShowLog((v) => !v)}
            />
          </div>
        )}

        {/* ── Output ── */}
        {isDone && ffmpeg.outputURL && outputFormat && (
          <section className="p-5 bg-gray-900/60 rounded-2xl border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Result
              </h2>
              <button
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-violet-400 transition-colors"
              >
                ← Convert another file
              </button>
            </div>
            <OutputPreview
              url={ffmpeg.outputURL}
              ext={outputFormat.ext}
              baseName={outputBaseName}
              onBaseNameChange={setOutputBaseName}
              format={outputFormat}
            />
          </section>
        )}
      </main>

      <footer className="border-t border-gray-800 mt-12 py-6 text-center text-xs text-gray-600">
        <p>All conversions happen in your browser. No files are uploaded to any server.</p>
        <p className="mt-1">
          Powered by{" "}
          <a
            href="https://ffmpegwasm.netlify.app/"
            className="text-violet-500 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            FFmpeg.wasm
          </a>
        </p>
      </footer>
    </div>
  );
}

function StepLabel({
  n,
  label,
  optional,
}: {
  n: number;
  label: string;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-violet-600/30 text-violet-300 text-xs font-bold flex items-center justify-center shrink-0">
        {n}
      </span>
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      {optional && (
        <span className="text-xs text-gray-600 normal-case font-normal">optional</span>
      )}
    </div>
  );
}
