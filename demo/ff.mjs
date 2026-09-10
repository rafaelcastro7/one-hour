import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const DEFAULT_FF =
  "C:\\Users\\rafael\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0-full_build\\bin";

function findFFDir() {
  if (process.env.FFMPEG_DIR && existsSync(process.env.FFMPEG_DIR)) {
    return process.env.FFMPEG_DIR;
  }
  if (existsSync(DEFAULT_FF)) return DEFAULT_FF;
  return "";
}

export const FFDIR = findFFDir();
export const FFMPEG = FFDIR ? `${FFDIR}\\ffmpeg.exe` : "ffmpeg";
export const FFPROBE = FFDIR ? `${FFDIR}\\ffprobe.exe` : "ffprobe";

export function duration(path) {
  const out = execFileSync(
    FFPROBE,
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      path,
    ],
    { encoding: "utf8" }
  );
  return parseFloat(out.trim());
}