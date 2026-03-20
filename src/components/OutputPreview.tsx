import { useRef, useEffect } from "react";
import { FormatInfo } from "../utils/formats";

interface OutputPreviewProps {
  url: string;
  ext: string;
  baseName: string;
  onBaseNameChange: (name: string) => void;
  format: FormatInfo;
}

export function OutputPreview({
  url,
  ext,
  baseName,
  onBaseNameChange,
  format,
}: OutputPreviewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isVideo = format.category === "video";
  const isAudio = format.category === "audio";
  const isImage = format.category === "image" || format.category === "gif";

  // Auto-select the filename text on mount so it's easy to rename
  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const downloadName = `${baseName.trim() || "output"}.${ext}`;

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="rounded-xl overflow-hidden bg-black/40 border border-gray-700 flex items-center justify-center min-h-[160px]">
        {isVideo && (
          <video src={url} controls playsInline className="max-w-full max-h-96 rounded-lg" />
        )}
        {isAudio && (
          <div className="p-8 flex flex-col items-center gap-4 w-full">
            <div className="w-14 h-14 rounded-full bg-green-900/40 flex items-center justify-center text-2xl">
              🎵
            </div>
            <audio src={url} controls className="w-full max-w-sm" />
          </div>
        )}
        {isImage && (
          <img
            src={url}
            alt={downloadName}
            className="max-w-full max-h-96 object-contain rounded-lg"
          />
        )}
      </div>

      {/* Rename + Download */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Filename
        </label>
        <div className="flex items-center gap-2 p-1 bg-gray-800 border border-gray-700 rounded-xl focus-within:border-violet-500 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={baseName}
            onChange={(e) => onBaseNameChange(e.target.value)}
            placeholder="output"
            spellCheck={false}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-200 focus:outline-none font-mono min-w-0"
          />
          <span className="px-3 py-2 text-sm font-mono text-gray-400 bg-gray-900/60 rounded-lg shrink-0">
            .{ext}
          </span>
        </div>
      </div>

      <a
        href={url}
        download={downloadName}
        className="flex items-center justify-center gap-3 w-full py-3.5 px-6 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-900/30 active:scale-95"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        Download {downloadName}
      </a>
    </div>
  );
}
