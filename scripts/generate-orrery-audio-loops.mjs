import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(root, "orrery/public/audio");
const sampleRate = 22_050;
const durationSeconds = 2;
const frameCount = sampleRate * durationSeconds;

const loops = [
  {
    filename: "orrery-pulse-v1.wav",
    seed: 0x51a2b3c4,
    hits: [
      [0, 0.62, 0.11],
      [0.5, 0.38, 0.07],
      [1, 0.62, 0.11],
      [1.5, 0.38, 0.07],
    ],
  },
  {
    filename: "orrery-ticks-v1.wav",
    seed: 0x90b1c2d3,
    hits: [
      [0, 0.32, 0.045],
      [0.25, 0.2, 0.035],
      [0.5, 0.32, 0.045],
      [0.75, 0.2, 0.035],
      [1, 0.32, 0.045],
      [1.25, 0.2, 0.035],
      [1.5, 0.32, 0.045],
      [1.75, 0.2, 0.035],
    ],
  },
  {
    filename: "orrery-grain-v1.wav",
    seed: 0x4d3c2b1a,
    hits: [
      [0, 0.25, 0.16],
      [0.375, 0.18, 0.08],
      [0.75, 0.25, 0.16],
      [1.125, 0.18, 0.08],
      [1.5, 0.25, 0.16],
      [1.875, 0.18, 0.08],
    ],
  },
];

function nextNoise(state) {
  const next = (state * 1_664_525 + 1_013_904_223) >>> 0;
  return [next, next / 0x1_0000_0000 * 2 - 1];
}

function wavBuffer(loop) {
  const samples = new Int16Array(frameCount);
  let randomState = loop.seed;

  for (let frame = 0; frame < frameCount; frame += 1) {
    let signal = 0;
    for (const [time, gain, decay] of loop.hits) {
      const hitStart = Math.round(time * sampleRate);
      const offset = frame - hitStart;
      if (offset < 0 || offset >= decay * sampleRate) {
        continue;
      }

      const noise = nextNoise(randomState);
      randomState = noise[0];
      const envelope = Math.exp(-offset / (decay * sampleRate * 0.33));
      signal += noise[1] * gain * envelope;
    }
    samples[frame] = Math.round(Math.max(-0.92, Math.min(0.92, signal)) * 32_767);
  }

  const bytes = Buffer.alloc(44 + samples.byteLength);
  bytes.write("RIFF", 0, "ascii");
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write("WAVE", 8, "ascii");
  bytes.write("fmt ", 12, "ascii");
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(sampleRate, 24);
  bytes.writeUInt32LE(sampleRate * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36, "ascii");
  bytes.writeUInt32LE(samples.byteLength, 40);
  for (let index = 0; index < samples.length; index += 1) {
    bytes.writeInt16LE(samples[index], 44 + index * 2);
  }
  return bytes;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

const check = process.argv.includes("--check");
if (!check) {
  mkdirSync(outputDirectory, { recursive: true });
}

for (const loop of loops) {
  const path = resolve(outputDirectory, loop.filename);
  const expected = wavBuffer(loop);
  if (check) {
    if (!existsSync(path) || !readFileSync(path).equals(expected)) {
      throw new Error(`${loop.filename} is not reproducible; run node scripts/generate-orrery-audio-loops.mjs`);
    }
  } else {
    writeFileSync(path, expected);
  }
  process.stdout.write(`${loop.filename} ${sha256(expected)}\n`);
}
