import { readFile } from "node:fs/promises";
import path from "node:path";
import { ConfigError } from "./config-error.ts";

/**
 * Clockwise look-direction labels, starting at up.
 */
export const LOOK_DIRECTION_LABELS = [
  "000",
  "022.5",
  "045",
  "067.5",
  "090",
  "112.5",
  "135",
  "157.5",
  "180",
  "202.5",
  "225",
  "247.5",
  "270",
  "292.5",
  "315",
  "337.5",
] as const;

/**
 * Standard animation folders in Codex spritesheet row order.
 */
export const STANDARD_ANIMATION_ROWS: ReadonlyArray<readonly [name: string, row: number]> = [
  ["idle", 0],
  ["running-right", 1],
  ["running-left", 2],
  ["waving", 3],
  ["jumping", 4],
  ["failed", 5],
  ["waiting", 6],
  ["running", 7],
  ["review", 8],
];

/**
 * One animation state exposed to the browser preview.
 */
export interface PreviewAnimation {
  /**
   * Folder name under `source/`.
   */
  name: string;
  /**
   * Frame stem names from `combine.json`, in playback order.
   */
  frames: string[];
}

/**
 * Reads the `frames` array from an animation's `combine.json`.
 *
 * @param animationDirectory - Folder that contains `combine.json`.
 * @returns Frame stem names in atlas order.
 */
export async function readCombineFrameNames(animationDirectory: string): Promise<string[]> {
  const config = await readCombineConfig(animationDirectory);
  const frames = config.frames;
  if (!Array.isArray(frames) || frames.length === 0 || !frames.every((frame) => typeof frame === "string")) {
    throw new ConfigError(`${path.join(animationDirectory, "combine.json")}: frames must be a non-empty string array`);
  }
  return frames;
}

/**
 * Resolves combined frame PNG paths for one standard animation row.
 *
 * @param sourceRoot - The `source/` directory.
 * @param state - Animation folder name.
 * @returns Absolute paths to combined frames for the row.
 */
export async function standardRowFramePaths(sourceRoot: string, state: string): Promise<string[]> {
  const animationDirectory = path.join(sourceRoot, state);
  const config = await readCombineConfig(animationDirectory);
  const frames = await readCombineFrameNames(animationDirectory);
  const outputPattern = typeof config.output === "string" ? config.output : "{frame}.png";
  return frames.map((frame) => path.join(animationDirectory, outputPattern.replaceAll("{frame}", frame)));
}

/**
 * Builds the preview manifest from `combine.json` in row order.
 *
 * @param sourceRoot - The `source/` directory.
 * @returns Animations and frame lists for the preview UI.
 */
export async function loadPreviewManifest(sourceRoot: string): Promise<PreviewAnimation[]> {
  const animations: PreviewAnimation[] = [];
  for (const [name] of STANDARD_ANIMATION_ROWS) {
    animations.push({
      name,
      frames: await readCombineFrameNames(path.join(sourceRoot, name)),
    });
  }
  animations.push({
    name: "look-directions",
    frames: await readCombineFrameNames(path.join(sourceRoot, "look-directions")),
  });
  return animations;
}

async function readCombineConfig(animationDirectory: string): Promise<Record<string, unknown>> {
  const configPath = path.join(animationDirectory, "combine.json");
  let config: unknown;
  try {
    config = JSON.parse(await readFile(configPath, "utf8")) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ConfigError(`${configPath}: invalid JSON: ${error.message}`);
    }
    throw error;
  }
  if (typeof config !== "object" || config === null || (config as Record<string, unknown>).version !== 1) {
    throw new ConfigError(`${configPath}: version must be 1`);
  }
  return config as Record<string, unknown>;
}
