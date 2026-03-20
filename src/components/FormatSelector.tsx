import { FormatInfo, MediaCategory } from "../utils/formats";

interface FormatSelectorProps {
  formats: FormatInfo[];
  selected: FormatInfo | null;
  onSelect: (f: FormatInfo) => void;
  label?: string;
}

const CATEGORY_COLORS: Record<MediaCategory, string> = {
  video: "bg-blue-900/40 text-blue-300 border-blue-700",
  audio: "bg-green-900/40 text-green-300 border-green-700",
  image: "bg-orange-900/40 text-orange-300 border-orange-700",
  gif: "bg-pink-900/40 text-pink-300 border-pink-700",
};

const CATEGORY_LABELS: Record<MediaCategory, string> = {
  video: "Video",
  audio: "Audio",
  image: "Image",
  gif: "GIF",
};

export function FormatSelector({ formats, selected, onSelect, label }: FormatSelectorProps) {
  const grouped = formats.reduce<Partial<Record<MediaCategory, FormatInfo[]>>>((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category]!.push(f);
    return acc;
  }, {});

  const categories: MediaCategory[] = ["gif", "video", "audio", "image"];

  return (
    <div className="space-y-3">
      {label && (
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      )}
      {categories.map((cat) => {
        const items = grouped[cat];
        if (!items?.length) return null;
        return (
          <div key={cat} className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="flex flex-wrap gap-2">
              {items.map((fmt) => {
                const isSelected = selected?.ext === fmt.ext;
                return (
                  <button
                    key={fmt.ext}
                    onClick={() => onSelect(fmt)}
                    className={[
                      "px-3 py-1.5 rounded-lg border text-sm font-semibold font-mono transition-all",
                      isSelected
                        ? CATEGORY_COLORS[fmt.category] + " ring-2 ring-violet-400 scale-105"
                        : "bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-500 hover:bg-gray-700",
                    ].join(" ")}
                  >
                    {fmt.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
