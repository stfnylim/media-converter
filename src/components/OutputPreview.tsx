import { FormatInfo } from "../utils/formats";

interface OutputPreviewProps {
  url: string;
  name: string;
  format: FormatInfo;
}

export function OutputPreview({ url, name, format }: OutputPreviewProps) {
  const isVideo = format.category === "video";
  const isAudio = format.category === "audio";
  const isImage = format.category === "image" || format.category === "gif";

  return (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden bg-black/40 border border-gray-700 flex items-center justify-center min-h-[200px]">
        {isVideo && (
          <video
            src={url}
            controls
            className="max-w-full max-h-[400px] rounded-lg"
          />
        )}
        {isAudio && (
          <div className="p-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-900/40 flex items-center justify-center text-3xl">🎵</div>
            <audio src={url} controls className="w-full max-w-sm" />
          </div>
        )}
        {isImage && (
          <img
            src={url}
            alt={name}
            className="max-w-full max-h-[400px] rounded-lg object-contain"
          />
        )}
      </div>
      <a
        href={url}
        download={name}
        className="flex items-center justify-center gap-3 w-full py-3 px-6 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-900/30 active:scale-95"
      >
        <span className="text-lg">⬇</span>
        Download {name}
      </a>
    </div>
  );
}
