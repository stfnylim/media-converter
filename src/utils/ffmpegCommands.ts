export interface GifOptions {
  fps: number;
  width: number; // 0 = keep original
  loop: number; // 0 = infinite, -1 = no loop, n = n times
  quality: "low" | "medium" | "high";
  dither: boolean;
}

export interface VideoOptions {
  audioBitrate: string; // e.g. "128k"
  resolution: string; // e.g. "1920x1080" or "" for keep
  fps: string; // e.g. "30" or "" for keep
  crf: number; // 0-51, lower is better
  preset: "ultrafast" | "superfast" | "fast" | "medium" | "slow";
}

export interface AudioOptions {
  bitrate: string; // e.g. "128k"
  sampleRate: string; // e.g. "44100"
  channels: string; // "1" | "2"
}

export interface ImageOptions {
  quality: number; // 1-100
  width: number; // 0 = keep
  height: number; // 0 = keep
}

export interface TrimOptions {
  start: number; // seconds, 0 = beginning
  end: number;   // seconds, 0 = full duration
  totalDuration: number;
}


export const DEFAULT_GIF_OPTIONS: GifOptions = {
  fps: 15,
  width: 640,
  loop: 0,
  quality: "medium",
  dither: true,
};

export const DEFAULT_VIDEO_OPTIONS: VideoOptions = {
  audioBitrate: "128k",
  resolution: "",
  fps: "",
  crf: 23,
  preset: "medium",
};

export const DEFAULT_AUDIO_OPTIONS: AudioOptions = {
  bitrate: "192k",
  sampleRate: "44100",
  channels: "2",
};

export const DEFAULT_IMAGE_OPTIONS: ImageOptions = {
  quality: 85,
  width: 0,
  height: 0,
};

export function buildGifCommand(
  inputName: string,
  outputName: string,
  opts: GifOptions,
  trim: TrimOptions
): string[] {
  const args: string[] = [];

  // Trim args must come before -i for accurate seeking
  if (trim.start > 0) args.push("-ss", trim.start.toFixed(3));
  args.push("-i", inputName);
  if (trim.end > 0 && trim.end < trim.totalDuration) {
    args.push("-t", (trim.end - trim.start).toFixed(3));
  }

  const scaleFilter =
    opts.width > 0
      ? `scale=${opts.width}:-1:flags=lanczos`
      : "scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos";
  const palettegenFlags =
    opts.quality === "high"
      ? "stats_mode=full"
      : opts.quality === "low"
      ? "stats_mode=diff"
      : "stats_mode=single";
  const ditherFlag = opts.dither ? "bayer:bayer_scale=5" : "none";

  const filters = `fps=${opts.fps},${scaleFilter},split[s0][s1];[s0]palettegen=${palettegenFlags}[p];[s1][p]paletteuse=dither=${ditherFlag}`;
  args.push("-vf", filters);

  if (opts.loop === 0) args.push("-loop", "0");
  else if (opts.loop === -1) args.push("-loop", "-1");
  else args.push("-loop", String(opts.loop));

  args.push("-f", "gif", outputName);
  return args;
}

export function buildVideoCommand(
  inputName: string,
  outputName: string,
  outputExt: string,
  opts: VideoOptions,
  trim: TrimOptions
): string[] {
  const args: string[] = [];

  if (trim.start > 0) args.push("-ss", trim.start.toFixed(3));
  args.push("-i", inputName);
  if (trim.end > 0 && trim.end < trim.totalDuration) {
    args.push("-t", (trim.end - trim.start).toFixed(3));
  }

  // Audio extraction
  if (["mp3", "aac", "wav", "ogg", "flac", "m4a", "opus", "wma"].includes(outputExt)) {
    args.push("-vn");
    if (outputExt === "mp3") args.push("-acodec", "libmp3lame", "-ab", opts.audioBitrate);
    else if (outputExt === "aac") args.push("-acodec", "aac", "-ab", opts.audioBitrate);
    else if (outputExt === "wav") args.push("-acodec", "pcm_s16le");
    else args.push("-ab", opts.audioBitrate);
    args.push(outputName);
    return args;
  }

  if (opts.resolution) {
    args.push("-vf", `scale=${opts.resolution.replace("x", ":")}`);
  }
  if (opts.fps) args.push("-r", opts.fps);

  if (outputExt === "webm") {
    args.push("-c:v", "libvpx-vp9", "-crf", String(opts.crf), "-b:v", "0");
    args.push("-c:a", "libopus", "-b:a", opts.audioBitrate);
  } else {
    args.push("-c:v", "libx264", "-crf", String(opts.crf), "-preset", opts.preset);
    args.push("-c:a", "aac", "-b:a", opts.audioBitrate);
  }

  args.push("-movflags", "+faststart", outputName);
  return args;
}

export function buildAudioCommand(
  inputName: string,
  outputName: string,
  outputExt: string,
  opts: AudioOptions,
  trim: TrimOptions
): string[] {
  const args: string[] = [];

  if (trim.start > 0) args.push("-ss", trim.start.toFixed(3));
  args.push("-i", inputName, "-vn");
  if (trim.end > 0 && trim.end < trim.totalDuration) {
    args.push("-t", (trim.end - trim.start).toFixed(3));
  }

  args.push("-ar", opts.sampleRate, "-ac", opts.channels);

  if (outputExt === "mp3") {
    args.push("-c:a", "libmp3lame", "-ab", opts.bitrate);
  } else if (outputExt === "aac" || outputExt === "m4a") {
    args.push("-c:a", "aac", "-ab", opts.bitrate);
  } else if (outputExt === "wav") {
    args.push("-c:a", "pcm_s16le");
  } else if (outputExt === "flac") {
    args.push("-c:a", "flac");
  } else if (outputExt === "opus") {
    args.push("-c:a", "libopus", "-ab", opts.bitrate);
  } else if (outputExt === "ogg") {
    args.push("-c:a", "libvorbis", "-ab", opts.bitrate);
  } else {
    args.push("-ab", opts.bitrate);
  }

  args.push(outputName);
  return args;
}

export function buildImageCommand(
  inputName: string,
  outputName: string,
  outputExt: string,
  opts: ImageOptions,
  trim: TrimOptions
): string[] {
  const args: string[] = [];

  // For image extraction from video, seek to the trim start frame
  if (trim.start > 0) args.push("-ss", trim.start.toFixed(3));
  args.push("-i", inputName);

  const filters: string[] = [];
  if (opts.width > 0 && opts.height > 0) {
    filters.push(`scale=${opts.width}:${opts.height}`);
  } else if (opts.width > 0) {
    filters.push(`scale=${opts.width}:-1`);
  } else if (opts.height > 0) {
    filters.push(`scale=-1:${opts.height}`);
  }

  if (filters.length > 0) args.push("-vf", filters.join(","));

  if (outputExt === "jpg") {
    args.push("-q:v", String(Math.round(2 + ((100 - opts.quality) * 29) / 100)));
  } else if (outputExt === "webp") {
    args.push("-quality", String(opts.quality));
  } else if (outputExt === "png") {
    args.push("-compression_level", String(Math.round((100 - opts.quality) / 10)));
  }

  args.push("-frames:v", "1", outputName);
  return args;
}
