import { useRef, useState, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export type FFmpegStatus = "idle" | "loading" | "ready" | "converting" | "done" | "error";

export interface UseFFmpegReturn {
  status: FFmpegStatus;
  progress: number;
  log: string;
  outputURL: string | null;
  outputName: string | null;
  error: string | null;
  load: () => Promise<void>;
  convert: (file: File, args: string[], outputFileName: string) => Promise<void>;
  reset: () => void;
}

const BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";

export function useFFmpeg(): UseFFmpegReturn {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [status, setStatus] = useState<FFmpegStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState("");
  const [outputURL, setOutputURL] = useState<string | null>(null);
  const [outputName, setOutputName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (ffmpegRef.current) return;
    setStatus("loading");
    setError(null);
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on("log", ({ message }) => {
        setLog((prev) => (prev + "\n" + message).split("\n").slice(-100).join("\n"));
      });

      ffmpeg.on("progress", ({ progress: p }) => {
        setProgress(Math.round(p * 100));
      });

      await ffmpeg.load({
        coreURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      setStatus("ready");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Failed to load FFmpeg");
    }
  }, []);

  const convert = useCallback(async (file: File, args: string[], outputFileName: string) => {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg) return;

    setStatus("converting");
    setProgress(0);
    setLog("");
    setError(null);
    setOutputURL(null);
    setOutputName(null);

    try {
      const inputName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Replace placeholder in args with actual input name
      const resolvedArgs = args.map((a) => (a === "__INPUT__" ? inputName : a));

      await ffmpeg.exec(resolvedArgs);

      const outputData = await ffmpeg.readFile(outputFileName);
      // FileData is Uint8Array | string; copy into a guaranteed plain ArrayBuffer for Blob
      let blob: Blob;
      if (outputData instanceof Uint8Array) {
        const copy = new Uint8Array(outputData.length);
        copy.set(outputData);
        blob = new Blob([copy.buffer as ArrayBuffer], { type: getMimeForName(outputFileName) });
      } else {
        blob = new Blob([outputData as string], { type: getMimeForName(outputFileName) });
      }
      const url = URL.createObjectURL(blob);

      setOutputURL(url);
      setOutputName(outputFileName);
      setStatus("done");
      setProgress(100);

      // Cleanup input file
      await ffmpeg.deleteFile(inputName).catch(() => {});
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Conversion failed");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus(ffmpegRef.current ? "ready" : "idle");
    setProgress(0);
    setLog("");
    setOutputURL(null);
    setOutputName(null);
    setError(null);
  }, []);

  return { status, progress, log, outputURL, outputName, error, load, convert, reset };
}

function getMimeForName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    gif: "image/gif",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    mp3: "audio/mpeg",
    aac: "audio/aac",
    wav: "audio/wav",
    ogg: "audio/ogg",
    flac: "audio/flac",
    m4a: "audio/x-m4a",
    opus: "audio/opus",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    bmp: "image/bmp",
  };
  return map[ext ?? ""] ?? "application/octet-stream";
}
