export type MediaCategory = "video" | "audio" | "image" | "gif";

export interface FormatInfo {
  ext: string;
  label: string;
  mimeTypes: string[];
  category: MediaCategory;
}

export const FORMATS: FormatInfo[] = [
  // Video
  { ext: "mp4", label: "MP4", mimeTypes: ["video/mp4"], category: "video" },
  { ext: "webm", label: "WebM", mimeTypes: ["video/webm"], category: "video" },
  { ext: "mov", label: "MOV", mimeTypes: ["video/quicktime"], category: "video" },
  { ext: "avi", label: "AVI", mimeTypes: ["video/x-msvideo", "video/avi"], category: "video" },
  { ext: "mkv", label: "MKV", mimeTypes: ["video/x-matroska"], category: "video" },
  { ext: "flv", label: "FLV", mimeTypes: ["video/x-flv"], category: "video" },
  { ext: "wmv", label: "WMV", mimeTypes: ["video/x-ms-wmv"], category: "video" },
  { ext: "m4v", label: "M4V", mimeTypes: ["video/x-m4v"], category: "video" },
  { ext: "3gp", label: "3GP", mimeTypes: ["video/3gpp"], category: "video" },
  { ext: "ts", label: "TS", mimeTypes: ["video/mp2t"], category: "video" },
  // Audio
  { ext: "mp3", label: "MP3", mimeTypes: ["audio/mpeg", "audio/mp3"], category: "audio" },
  { ext: "aac", label: "AAC", mimeTypes: ["audio/aac", "audio/x-aac"], category: "audio" },
  { ext: "wav", label: "WAV", mimeTypes: ["audio/wav", "audio/x-wav"], category: "audio" },
  { ext: "ogg", label: "OGG", mimeTypes: ["audio/ogg"], category: "audio" },
  { ext: "flac", label: "FLAC", mimeTypes: ["audio/flac", "audio/x-flac"], category: "audio" },
  { ext: "m4a", label: "M4A", mimeTypes: ["audio/x-m4a", "audio/m4a"], category: "audio" },
  { ext: "opus", label: "Opus", mimeTypes: ["audio/opus"], category: "audio" },
  { ext: "wma", label: "WMA", mimeTypes: ["audio/x-ms-wma"], category: "audio" },
  // Image
  { ext: "jpg", label: "JPEG", mimeTypes: ["image/jpeg"], category: "image" },
  { ext: "png", label: "PNG", mimeTypes: ["image/png"], category: "image" },
  { ext: "webp", label: "WebP", mimeTypes: ["image/webp"], category: "image" },
  { ext: "bmp", label: "BMP", mimeTypes: ["image/bmp", "image/x-bmp"], category: "image" },
  { ext: "tiff", label: "TIFF", mimeTypes: ["image/tiff"], category: "image" },
  // GIF
  { ext: "gif", label: "GIF", mimeTypes: ["image/gif"], category: "gif" },
];

export function detectFormat(file: File): FormatInfo | null {
  // Try MIME type first
  const byMime = FORMATS.find((f) => f.mimeTypes.includes(file.type));
  if (byMime) return byMime;

  // Fallback to extension
  const ext = file.name.split(".").pop()?.toLowerCase();
  return FORMATS.find((f) => f.ext === ext) ?? null;
}

export function getSuggestedOutputFormats(input: FormatInfo): FormatInfo[] {
  switch (input.category) {
    case "video":
      return FORMATS.filter((f) =>
        ["mp4", "webm", "mov", "avi", "mkv", "gif", "mp3", "aac", "wav"].includes(f.ext)
      );
    case "audio":
      return FORMATS.filter((f) =>
        ["mp3", "aac", "wav", "ogg", "flac", "m4a", "opus"].includes(f.ext)
      );
    case "image":
      return FORMATS.filter((f) =>
        ["jpg", "png", "webp", "bmp", "tiff", "gif"].includes(f.ext)
      );
    case "gif":
      return FORMATS.filter((f) =>
        ["mp4", "webm", "gif", "png", "jpg"].includes(f.ext)
      );
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
