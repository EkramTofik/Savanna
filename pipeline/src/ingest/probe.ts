import { run } from "./exec";

export interface MediaInfo {
  durationSec: number;
  hasVideo: boolean;
  hasAudio: boolean;
  width?: number;
  height?: number;
  fps?: number;
}

interface FfprobeStream {
  codec_type?: string;
  width?: number;
  height?: number;
  r_frame_rate?: string;
  duration?: string;
}
interface FfprobeJson {
  streams?: FfprobeStream[];
  format?: { duration?: string };
}

const fraction = (s: string | undefined): number | undefined => {
  if (!s) return undefined;
  const [a, b] = s.split("/");
  const n = Number(a);
  const d = b === undefined ? 1 : Number(b);
  return d > 0 && Number.isFinite(n) ? n / d : undefined;
};

/** Pure: turns `ffprobe -print_format json` output into what ingest needs. */
export function parseProbe(json: FfprobeJson): MediaInfo {
  const streams = json.streams ?? [];
  const video = streams.find((s) => s.codec_type === "video");
  const audio = streams.find((s) => s.codec_type === "audio");
  const duration = Number(json.format?.duration ?? video?.duration ?? audio?.duration ?? 0);
  const fps = fraction(video?.r_frame_rate);
  return {
    durationSec: Number.isFinite(duration) ? duration : 0,
    hasVideo: video !== undefined,
    hasAudio: audio !== undefined,
    ...(video?.width !== undefined ? { width: video.width } : {}),
    ...(video?.height !== undefined ? { height: video.height } : {}),
    ...(fps !== undefined ? { fps } : {}),
  };
}

export async function probeMedia(file: string, ffprobe = "ffprobe"): Promise<MediaInfo> {
  const { stdout } = await run(ffprobe, ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", file]);
  return parseProbe(JSON.parse(stdout) as FfprobeJson);
}
