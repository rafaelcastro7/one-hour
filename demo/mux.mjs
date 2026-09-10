import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { FFMPEG, duration } from "./ff.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const timeline = JSON.parse(readFileSync(path.join(HERE, "timeline.json"), "utf8"));
const OUT_DIR = path.join(HERE, "final");
mkdirSync(OUT_DIR, { recursive: true });

function run(args) {
  execFileSync(FFMPEG, args, { stdio: ["ignore", "inherit", "inherit"] });
}

function decodeWav(key, out) {
  run(["-y", "-i", path.join(HERE, "audio", `${key}.mp3`), "-ar", "48000", "-ac", "2", out]);
}

const WAV = path.join(OUT_DIR, "_wav");
mkdirSync(WAV, { recursive: true });

function buildAudio(inputs, filters, chans, cues, offsetMs, lenSec, out) {
  run([
    "-y",
    ...inputs,
    "-filter_complex",
    `${filters.join(";")};${chans.join("")}amix=inputs=${inputs.length / 2}:normalize=0[aout]`,
    "-map", "[aout]",
    "-t", lenSec.toFixed(3),
    "-c:a", "pcm_s16le",
    out,
  ]);
}

function sceneCut(events, dur) {
  const s2b = events.find((e) => e.key === "s2b");
  const s2c = events.find((e) => e.key === "s2c");
  if (!s2b || !s2c) return null;
  const from = s2b.t + dur.s2b + 0.6;
  const to = s2c.t - 0.5;
  if (to - from < 2) return null;
  return { from, to };
}

const sceneVideos = [];
for (const scene of ["s1", "s2", "s3", "s4", "s5"]) {
  const meta = timeline.scenes[scene];
  if (!meta) continue;
  const events = timeline.events.filter((e) => e.scene === scene);
  const vlen = duration(meta.video);
  const cut = sceneCut(events, timeline.narration);
  const lastCueEnd = Math.max(...events.map((c) => c.t + (timeline.narration[c.key] ?? 0)), 0);
  const capEnd = Math.min(vlen, lastCueEnd + 1.6);
  console.log(
    `scene ${scene}: len=${vlen.toFixed(2)}s cues=${events
      .map((c) => `${c.key}@${c.t.toFixed(1)}`)
      .join(" ")}` + (cut ? ` cut=[${cut.from.toFixed(1)}..${cut.to.toFixed(1)}]` : "")
  );

  const cues = (from) => events.filter((c) => c.t >= from);

  const segments = !cut
    ? [{ startMs: 0, cues: events, clipStart: 0, clipLen: capEnd }]
    : [
        { startMs: 0, cues: events.filter((c) => c.t < cut.from), clipStart: 0, clipLen: cut.from },
        { startMs: cut.to * 1000, cues: events.filter((c) => c.t >= cut.to), clipStart: cut.to, clipLen: capEnd - cut.to },
      ].filter((s) => s.clipLen > 0.3);

  const segFiles = [];
  for (const seg of segments) {
    const inputs = [];
    const filters = [];
    const chans = [];
    seg.cues.forEach((c, i) => {
      const wav = path.join(WAV, `${scene}_${c.key}.wav`);
      decodeWav(c.key, wav);
      inputs.push("-i", wav);
      const ms = Math.max(0, Math.round(c.t * 1000 - seg.startMs));
      filters.push(`[${i}]adelay=${ms}|${ms}[a${i}]`);
      chans.push(`[a${i}]`);
    });
    if (seg.cues.length === 0) {
      throw new Error(`scene ${scene} segment with no cues would break sync`);
    }
    const wavOut = path.join(OUT_DIR, `${scene}_${segments.indexOf(seg)}.wav`);
    buildAudio(inputs, filters, chans, seg.cues, seg.startMs, seg.clipLen, wavOut);

    const segFile = path.join(OUT_DIR, `${scene}_${segments.indexOf(seg)}.mp4`);
    run([
      "-y",
      "-ss", seg.clipStart.toFixed(3),
      "-t", seg.clipLen.toFixed(3),
      "-i", meta.video,
      "-i", wavOut,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
      "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
      "-shortest", "-movflags", "+faststart", segFile,
    ]);
    segFiles.push(segFile);
  }

  let sceneMp4;
  if (segFiles.length === 1) {
    sceneMp4 = segFiles[0];
  } else {
    const listPath = path.join(OUT_DIR, `${scene}_concat.txt`);
    writeFileSync(listPath, segFiles.map((v) => `file '${v.replaceAll("\\", "/")}'`).join("\n") + "\n");
    sceneMp4 = path.join(OUT_DIR, `scene_${scene}.mp4`);
    run([
      "-y", "-f", "concat", "-safe", "0", "-i", listPath,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
      "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
      "-movflags", "+faststart", sceneMp4,
    ]);
  }
  sceneVideos.push(sceneMp4);
  console.log(`  -> ${sceneMp4}`);
}

const listPath = path.join(OUT_DIR, "_concat.txt");
writeFileSync(listPath, sceneVideos.map((v) => `file '${v.replaceAll("\\", "/")}'`).join("\n") + "\n");
const finalPath = path.join(OUT_DIR, "one-hour-demo.mp4");
run([
  "-y", "-f", "concat", "-safe", "0", "-i", listPath,
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
  "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
  "-movflags", "+faststart", finalPath,
]);
console.log("FINAL:", finalPath, `(${duration(finalPath).toFixed(1)}s)`);