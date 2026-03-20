import { FormatInfo } from "../utils/formats";
import {
  GifOptions, VideoOptions, AudioOptions, ImageOptions,
  DEFAULT_GIF_OPTIONS, DEFAULT_VIDEO_OPTIONS, DEFAULT_AUDIO_OPTIONS, DEFAULT_IMAGE_OPTIONS,
} from "../utils/ffmpegCommands";

interface OptionsPanelProps {
  outputFormat: FormatInfo;
  inputCategory: string;
  gifOptions: GifOptions;
  videoOptions: VideoOptions;
  audioOptions: AudioOptions;
  imageOptions: ImageOptions;
  onGifChange: (o: GifOptions) => void;
  onVideoChange: (o: VideoOptions) => void;
  onAudioChange: (o: AudioOptions) => void;
  onImageChange: (o: ImageOptions) => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <label className="text-sm text-gray-400 sm:w-36 shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Select({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function NumberInput({ value, onChange, min, max, step = 1, suffix }: {
  value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full max-w-[7rem] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"
      />
      {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full max-w-[10rem] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500 placeholder-gray-600"
    />
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={["relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
        value ? "bg-violet-600" : "bg-gray-700"].join(" ")}
    >
      <span className={["inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
        value ? "translate-x-6" : "translate-x-1"].join(" ")} />
      <span className="sr-only">{label}</span>
    </button>
  );
}

export function OptionsPanel({
  outputFormat, inputCategory,
  gifOptions, videoOptions, audioOptions, imageOptions,
  onGifChange, onVideoChange, onAudioChange, onImageChange,
}: OptionsPanelProps) {
  const isGif = outputFormat.ext === "gif";
  const isVideo = outputFormat.category === "video";
  const isAudio = outputFormat.category === "audio" || (inputCategory === "audio" && !isGif && !isVideo);
  const isImage = outputFormat.category === "image";

  if (isGif) {
    return (
      <div className="space-y-4">
        <SectionHeader title="GIF Options" onReset={() => onGifChange(DEFAULT_GIF_OPTIONS)} />
        <Row label="Frame Rate (FPS)">
          <div className="flex items-center gap-3">
            <NumberInput value={gifOptions.fps} onChange={(v) => onGifChange({ ...gifOptions, fps: v })} min={1} max={60} />
            <span className="text-xs text-gray-500">Lower = smaller file</span>
          </div>
        </Row>
        <Row label="Width (px)">
          <div className="flex items-center gap-2">
            <NumberInput value={gifOptions.width} onChange={(v) => onGifChange({ ...gifOptions, width: v })} min={0} max={3840} suffix="px" />
            <span className="text-xs text-gray-500">0 = original</span>
          </div>
        </Row>
        <Row label="Quality">
          <Select
            value={gifOptions.quality}
            onChange={(v) => onGifChange({ ...gifOptions, quality: v as GifOptions["quality"] })}
            options={[{ value: "low", label: "Low (fastest)" }, { value: "medium", label: "Medium" }, { value: "high", label: "High (slowest)" }]}
          />
        </Row>
        <Row label="Start Time">
          <div className="flex items-center gap-2">
            <NumberInput value={gifOptions.startTime} onChange={(v) => onGifChange({ ...gifOptions, startTime: v })} min={0} max={9999} step={0.1} suffix="sec" />
          </div>
        </Row>
        <Row label="Duration">
          <div className="flex items-center gap-2">
            <NumberInput value={gifOptions.duration} onChange={(v) => onGifChange({ ...gifOptions, duration: v })} min={0} max={9999} step={0.1} suffix="sec" />
            <span className="text-xs text-gray-500">0 = full</span>
          </div>
        </Row>
        <Row label="Loop">
          <Select
            value={String(gifOptions.loop)}
            onChange={(v) => onGifChange({ ...gifOptions, loop: Number(v) })}
            options={[
              { value: "0", label: "Infinite" },
              { value: "-1", label: "No loop" },
              { value: "1", label: "Once" },
              { value: "2", label: "Twice" },
              { value: "3", label: "3 times" },
            ]}
          />
        </Row>
        <Row label="Dithering">
          <div className="flex items-center gap-3">
            <Toggle value={gifOptions.dither} onChange={(v) => onGifChange({ ...gifOptions, dither: v })} label="Dithering" />
            <span className="text-sm text-gray-400">{gifOptions.dither ? "On (better gradients)" : "Off (flatter colors)"}</span>
          </div>
        </Row>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="space-y-4">
        <SectionHeader title="Video Options" onReset={() => onVideoChange(DEFAULT_VIDEO_OPTIONS)} />
        <Row label="Quality (CRF)">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={51}
              value={videoOptions.crf}
              onChange={(e) => onVideoChange({ ...videoOptions, crf: Number(e.target.value) })}
              className="w-40 accent-violet-500"
            />
            <span className="text-sm text-gray-300 w-8">{videoOptions.crf}</span>
            <span className="text-xs text-gray-500">Lower = better</span>
          </div>
        </Row>
        <Row label="Preset">
          <Select
            value={videoOptions.preset}
            onChange={(v) => onVideoChange({ ...videoOptions, preset: v as VideoOptions["preset"] })}
            options={[
              { value: "ultrafast", label: "Ultra Fast" },
              { value: "superfast", label: "Super Fast" },
              { value: "fast", label: "Fast" },
              { value: "medium", label: "Medium" },
              { value: "slow", label: "Slow (best quality)" },
            ]}
          />
        </Row>
        <Row label="Resolution">
          <TextInput
            value={videoOptions.resolution}
            onChange={(v) => onVideoChange({ ...videoOptions, resolution: v })}
            placeholder="1920x1080 or blank"
          />
        </Row>
        <Row label="Frame Rate">
          <TextInput
            value={videoOptions.fps}
            onChange={(v) => onVideoChange({ ...videoOptions, fps: v })}
            placeholder="e.g. 30 or blank"
          />
        </Row>
        <Row label="Audio Bitrate">
          <Select
            value={videoOptions.audioBitrate}
            onChange={(v) => onVideoChange({ ...videoOptions, audioBitrate: v })}
            options={[
              { value: "64k", label: "64 kbps" },
              { value: "96k", label: "96 kbps" },
              { value: "128k", label: "128 kbps" },
              { value: "192k", label: "192 kbps" },
              { value: "256k", label: "256 kbps" },
            ]}
          />
        </Row>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="space-y-4">
        <SectionHeader title="Audio Options" onReset={() => onAudioChange(DEFAULT_AUDIO_OPTIONS)} />
        <Row label="Bitrate">
          <Select
            value={audioOptions.bitrate}
            onChange={(v) => onAudioChange({ ...audioOptions, bitrate: v })}
            options={[
              { value: "64k", label: "64 kbps" },
              { value: "96k", label: "96 kbps" },
              { value: "128k", label: "128 kbps" },
              { value: "192k", label: "192 kbps" },
              { value: "256k", label: "256 kbps" },
              { value: "320k", label: "320 kbps" },
            ]}
          />
        </Row>
        <Row label="Sample Rate">
          <Select
            value={audioOptions.sampleRate}
            onChange={(v) => onAudioChange({ ...audioOptions, sampleRate: v })}
            options={[
              { value: "22050", label: "22050 Hz" },
              { value: "44100", label: "44100 Hz (CD)" },
              { value: "48000", label: "48000 Hz" },
              { value: "96000", label: "96000 Hz" },
            ]}
          />
        </Row>
        <Row label="Channels">
          <Select
            value={audioOptions.channels}
            onChange={(v) => onAudioChange({ ...audioOptions, channels: v })}
            options={[
              { value: "1", label: "Mono" },
              { value: "2", label: "Stereo" },
            ]}
          />
        </Row>
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="space-y-4">
        <SectionHeader title="Image Options" onReset={() => onImageChange(DEFAULT_IMAGE_OPTIONS)} />
        <Row label="Quality">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={100}
              value={imageOptions.quality}
              onChange={(e) => onImageChange({ ...imageOptions, quality: Number(e.target.value) })}
              className="w-40 accent-violet-500"
            />
            <span className="text-sm text-gray-300 w-8">{imageOptions.quality}</span>
          </div>
        </Row>
        <Row label="Width">
          <div className="flex items-center gap-2">
            <NumberInput
              value={imageOptions.width}
              onChange={(v) => onImageChange({ ...imageOptions, width: v })}
              min={0}
              max={7680}
              suffix="px"
            />
            <span className="text-xs text-gray-500">0 = original</span>
          </div>
        </Row>
        <Row label="Height">
          <div className="flex items-center gap-2">
            <NumberInput
              value={imageOptions.height}
              onChange={(v) => onImageChange({ ...imageOptions, height: v })}
              min={0}
              max={4320}
              suffix="px"
            />
            <span className="text-xs text-gray-500">0 = original</span>
          </div>
        </Row>
      </div>
    );
  }

  return null;
}

function SectionHeader({ title, onReset }: { title: string; onReset: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
      <button
        onClick={onReset}
        className="text-xs text-gray-500 hover:text-violet-400 transition-colors"
      >
        Reset defaults
      </button>
    </div>
  );
}
