import { useCallback, useState } from "react";
import { FORMATS, formatBytes } from "../utils/formats";

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED_MIME = FORMATS.flatMap((f) => f.mimeTypes).join(",");

export function DropZone({ onFile, disabled }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
      e.target.value = "";
    },
    [onFile]
  );

  return (
    <label
      className={[
        "relative flex flex-col items-center justify-center gap-4 w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none",
        "min-h-[220px] px-8 py-10",
        disabled
          ? "border-gray-700 bg-gray-900/40 cursor-not-allowed opacity-60"
          : dragging
          ? "border-violet-400 bg-violet-900/20 scale-[1.01]"
          : "border-gray-600 bg-gray-900/60 hover:border-violet-500 hover:bg-violet-900/10",
      ].join(" ")}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={disabled ? undefined : handleDrop}
    >
      <input
        type="file"
        className="sr-only"
        accept={ACCEPTED_MIME}
        onChange={handleChange}
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-3 text-center pointer-events-none">
        <div className={["w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-colors",
          dragging ? "bg-violet-500/30 text-violet-300" : "bg-gray-800 text-gray-400"].join(" ")}>
          ⬆
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-200">
            {dragging ? "Drop it!" : "Drop a file or click to browse"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Video, audio, image, or GIF • Max ~500 MB recommended
          </p>
        </div>
        <div className="flex flex-wrap gap-1 justify-center max-w-md">
          {["MP4","WebM","MOV","AVI","MKV","GIF","MP3","AAC","WAV","PNG","JPG","WebP"].map((f) => (
            <span key={f} className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-xs font-mono">
              {f}
            </span>
          ))}
          <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-xs">+more</span>
        </div>
      </div>
    </label>
  );
}

export function FilePreview({ file, format }: { file: File; format: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/80 rounded-xl border border-gray-700">
      <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400 font-mono text-sm font-bold shrink-0">
        {format.toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">{file.name}</p>
        <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
      </div>
    </div>
  );
}
