import { randomUUID } from "node:crypto";
import { access, readdir, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { ConfigError } from "./config-error.ts";
import { packageRoot } from "./package-root.ts";
import { pythonRound } from "./python-round.ts";
import { RgbaImage, type Resampling } from "./rgba-image.ts";

const defaultSourceRoot = path.join(packageRoot, "source");

/**
 * Numeric quantity or a coordinate accepted by a motion expression.
 */
type MotionValue = number | number[];

/**
 * A staged composite that has been written beside its final path.
 */
export interface StagedFrame {
  /**
   * Temporary PNG that holds the rendered frame.
   */
  temporary: string;
  /**
   * Final PNG path that should replace the previous frame.
   */
  output: string;
}

/**
 * Selects which animation folders to compose.
 */
export interface CombineOptions {
  /**
   * Directory whose children are animation folders. Defaults to `source/`.
   */
  sourceRoot?: string;
  /**
   * Animation folder names to compose. When omitted, every child with a `combine.json` is used.
   */
  animations?: string[];
  /**
   * When true, configurations are rendered in memory and no output PNG is replaced.
   */
  checkOnly?: boolean;
}

/**
 * Evaluates a literal value or a configured animation for one frame.
 *
 * @param spec - A constant or a motion object with a `type` field.
 * @param frame - Frame name being rendered.
 * @param index - Zero-based index of `frame` in `frames`.
 * @param frames - Ordered frame names for the animation.
 * @param propertyName - Transform property being evaluated, used in error text.
 * @returns The value for this frame.
 */
export function evaluateMotion(
  spec: unknown,
  frame: string,
  index: number,
  frames: string[],
  propertyName: string,
): unknown {
  if (!isRecord(spec) || !("type" in spec)) {
    return spec;
  }

  const motionType = spec.type;
  const progress = frameProgress(index, frames.length);
  const easingName = typeof spec.easing === "string" ? spec.easing : "linear";

  if (motionType === "frames") {
    const values = spec.values;
    if (!isRecord(values)) {
      throw new ConfigError(`${propertyName}.values must be an object`);
    }
    if (frame in values) {
      return values[frame];
    }
    if ("default" in spec) {
      return spec.default;
    }
    throw new ConfigError(`${propertyName} has no value for frame ${frame}`);
  }

  if (motionType === "linear") {
    return interpolate(spec.start, spec.end, eased(progress, easingName), propertyName);
  }

  if (motionType === "keyframes") {
    return evaluateKeyframes(spec.keyframes, index, frames, propertyName);
  }

  if (motionType === "ellipse" || motionType === "arc") {
    if (propertyName !== "position") {
      throw new ConfigError(`${String(motionType)} motion is supported only for position`);
    }
    const center = vector(spec.center, `${propertyName}.center`);
    const radii =
      motionType === "ellipse"
        ? vector(spec.radii, `${propertyName}.radii`)
        : ([numberValue(spec.radius, `${propertyName}.radius`), numberValue(spec.radius, `${propertyName}.radius`)] as const);
    const startAngle = numberValue(spec.startAngle, `${propertyName}.startAngle`);
    const endAngle = numberValue(spec.endAngle, `${propertyName}.endAngle`);
    const angle = ((startAngle + (endAngle - startAngle) * eased(progress, easingName)) * Math.PI) / 180;
    return [center[0] + radii[0] * Math.cos(angle), center[1] + radii[1] * Math.sin(angle)];
  }

  throw new ConfigError(`unsupported ${propertyName} motion type ${JSON.stringify(motionType)}`);
}

/**
 * Renders one animation. When `checkOnly` is false, frames are written to temporary
 * files and returned so the caller can publish them together.
 *
 * @param configPath - `combine.json` path for one animation folder.
 * @param checkOnly - When true, render and discard the pixels.
 * @returns Staged frame pairs. Empty when `checkOnly` is true.
 */
export async function composeAnimation(configPath: string, checkOnly: boolean): Promise<StagedFrame[]> {
  const config = await loadConfig(configPath);
  const animationDirectory = path.dirname(configPath);
  const canvas = vector(config.canvas, "canvas");
  if (canvas.some((value) => value !== Math.trunc(value) || value <= 0)) {
    throw new ConfigError("canvas dimensions must be positive integers");
  }
  const canvasSize: [number, number] = [canvas[0], canvas[1]];
  const frames = stringList(config.frames, "frames");
  if (new Set(frames).size !== frames.length) {
    throw new ConfigError("frames must not contain duplicates");
  }
  const layerOrder = stringList(config.layerOrder, "layerOrder");
  const layers = config.layers;
  if (
    new Set(layerOrder).size !== layerOrder.length ||
    !isRecord(layers) ||
    !sameMembers(layerOrder, Object.keys(layers))
  ) {
    throw new ConfigError("layerOrder must contain every layer exactly once");
  }
  const outputPattern = config.output ?? "{frame}.png";
  if (typeof outputPattern !== "string" || !outputPattern.includes("{frame}")) {
    throw new ConfigError("output must be a pattern containing {frame}");
  }

  const staged: StagedFrame[] = [];
  try {
    for (const [index, frame] of frames.entries()) {
      const composed = RgbaImage.empty(canvasSize[0], canvasSize[1]);
      for (const layerName of layerOrder) {
        const layer = layers[layerName];
        if (!isRecord(layer) || typeof layer.source !== "string") {
          throw new ConfigError(`layer ${JSON.stringify(layerName)} requires a source pattern`);
        }
        const source = path.join(animationDirectory, layer.source.replaceAll("{frame}", frame));
        const layerImage = await renderLayer(
          source,
          canvasSize,
          mergedTransform(layer, frame),
          frame,
          index,
          frames,
        );
        composed.alphaComposite(layerImage, 0, 0);
      }
      if (checkOnly) {
        continue;
      }
      const output = path.join(animationDirectory, outputPattern.replaceAll("{frame}", frame));
      const temporary = path.join(
        animationDirectory,
        `.${path.parse(output).name}.combine-${randomUUID()}${path.extname(output)}`,
      );
      await composed.writePng(temporary);
      staged.push({ temporary, output });
    }
    return staged;
  } catch (error) {
    await discardStaged(staged);
    throw error;
  }
}

/**
 * Composes the selected animations and publishes every frame only after all of them render.
 *
 * @param options - Source root, animation filter, and check-only flag.
 */
export async function combineImages(options: CombineOptions = {}): Promise<void> {
  const sourceRoot = options.sourceRoot ?? defaultSourceRoot;
  const configs = await selectedConfigs(sourceRoot, options.animations);
  const staged: StagedFrame[] = [];
  try {
    for (const configPath of configs) {
      staged.push(...(await composeAnimation(configPath, options.checkOnly ?? false)));
    }
    if (options.checkOnly) {
      return;
    }
    for (const frame of staged) {
      await replaceFile(frame.temporary, frame.output);
    }
  } catch (error) {
    await discardStaged(staged);
    throw error;
  }
}

async function renderLayer(
  source: string,
  canvasSize: [number, number],
  transform: Record<string, unknown>,
  frame: string,
  index: number,
  frames: string[],
): Promise<RgbaImage> {
  try {
    await access(source);
  } catch {
    throw new ConfigError(`missing source image ${source}`);
  }
  let image = await RgbaImage.read(source);
  if (image.width !== canvasSize[0] || image.height !== canvasSize[1]) {
    throw new ConfigError(`${source} is ${image.width}x${image.height}, expected ${canvasSize[0]}x${canvasSize[1]}`);
  }
  const resamplingName = typeof transform.resampling === "string" ? transform.resampling : "nearest";
  if (!isResampling(resamplingName)) {
    throw new ConfigError(`unsupported resampling mode ${JSON.stringify(resamplingName)}`);
  }
  const anchor = anchorPoint(transform.anchor ?? "content-center", image, canvasSize);
  const scaleValue = evaluateMotion(transform.scale ?? 1, frame, index, frames, "scale");
  const scale: [number, number] = typeof scaleValue === "number" ? [numberValue(scaleValue, "scale"), numberValue(scaleValue, "scale")] : [vector(scaleValue, "scale")[0], vector(scaleValue, "scale")[1]];
  image = await scaleAboutAnchor(image, scale, anchor, resamplingName);

  const rotation = numberValue(evaluateMotion(transform.rotation ?? 0, frame, index, frames, "rotation"), "rotation");
  if (rotation !== 0) {
    image = image.rotateClockwise(rotation, anchor[0], anchor[1], resamplingName);
  }

  const opacity = numberValue(evaluateMotion(transform.opacity ?? 1, frame, index, frames, "opacity"), "opacity");
  if (opacity < 0 || opacity > 1) {
    throw new ConfigError("opacity must be between 0 and 1");
  }
  if (opacity !== 1) {
    image = image.withAlphaScale(opacity);
  }

  const position = vector(evaluateMotion(transform.position ?? [0, 0], frame, index, frames, "position"), "position");
  const translated = RgbaImage.empty(canvasSize[0], canvasSize[1]);
  translated.alphaComposite(image, pythonRound(position[0]), pythonRound(position[1]));
  return translated;
}

async function scaleAboutAnchor(
  image: RgbaImage,
  scale: [number, number],
  anchor: [number, number],
  resampling: Resampling,
): Promise<RgbaImage> {
  const [sx, sy] = scale;
  if (sx === 0 || sy === 0) {
    throw new ConfigError("scale values must not be zero");
  }
  const scaledSize: [number, number] = [
    Math.max(1, pythonRound(image.width * Math.abs(sx))),
    Math.max(1, pythonRound(image.height * Math.abs(sy))),
  ];
  let scaled = await image.resize(scaledSize[0], scaledSize[1], resampling);
  let anchorX = anchor[0] * Math.abs(sx);
  let anchorY = anchor[1] * Math.abs(sy);
  if (sx < 0) {
    scaled = scaled.mirror();
    anchorX = scaled.width - anchorX;
  }
  if (sy < 0) {
    scaled = scaled.flip();
    anchorY = scaled.height - anchorY;
  }
  const output = RgbaImage.empty(image.width, image.height);
  output.alphaComposite(scaled, pythonRound(anchor[0] - anchorX), pythonRound(anchor[1] - anchorY));
  return output;
}

function anchorPoint(anchor: unknown, image: RgbaImage, canvasSize: [number, number]): [number, number] {
  if (anchor === "canvas-center") {
    return [canvasSize[0] / 2, canvasSize[1] / 2];
  }
  if (anchor === "content-center") {
    const bounds = image.alphaBounds();
    if (bounds === undefined) {
      return [canvasSize[0] / 2, canvasSize[1] / 2];
    }
    return [(bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2];
  }
  const point = vector(anchor, "anchor");
  return [point[0]!, point[1]!];
}

function mergedTransform(layer: Record<string, unknown>, frame: string): Record<string, unknown> {
  const transform = isRecord(layer.transform) ? { ...layer.transform } : {};
  const overrides = layer.frameOverrides ?? {};
  if (!isRecord(overrides)) {
    throw new ConfigError("frameOverrides must be an object");
  }
  const override = overrides[frame] ?? {};
  if (!isRecord(override)) {
    throw new ConfigError(`frame override for ${frame} must be an object`);
  }
  return { ...transform, ...override };
}

async function loadConfig(configPath: string): Promise<Record<string, unknown>> {
  let config: unknown;
  try {
    config = JSON.parse(await readFile(configPath, "utf8")) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ConfigError(`${configPath}: invalid JSON: ${error.message}`);
    }
    throw error;
  }
  if (!isRecord(config) || config.version !== 1) {
    throw new ConfigError(`${configPath}: version must be 1`);
  }
  return config;
}

async function selectedConfigs(sourceRoot: string, animations: string[] | undefined): Promise<string[]> {
  const configs = animations
    ? animations.map((animation) => path.join(sourceRoot, animation, "combine.json"))
    : (await readdir(sourceRoot, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(sourceRoot, entry.name, "combine.json"))
        .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  const missing: string[] = [];
  for (const configPath of configs) {
    try {
      await readFile(configPath);
    } catch {
      missing.push(configPath);
    }
  }
  if (missing.length > 0) {
    throw new ConfigError(`missing configuration: ${missing.join(", ")}`);
  }
  if (configs.length === 0) {
    throw new ConfigError(`no combine.json files found below ${sourceRoot}`);
  }
  return configs;
}

function evaluateKeyframes(keyframes: unknown, index: number, frames: string[], propertyName: string): unknown {
  if (!Array.isArray(keyframes) || keyframes.length === 0) {
    throw new ConfigError(`${propertyName}.keyframes must be a non-empty array`);
  }
  const parsed: Array<{ index: number; value: unknown; easing: string }> = [];
  for (const keyframe of keyframes) {
    if (!isRecord(keyframe) || !("frame" in keyframe) || !("value" in keyframe)) {
      throw new ConfigError(`${propertyName} keyframes require frame and value`);
    }
    const keyFrame = keyframe.frame;
    if (typeof keyFrame !== "string" || !frames.includes(keyFrame)) {
      throw new ConfigError(`${propertyName} keyframe references unknown frame ${JSON.stringify(keyFrame)}`);
    }
    parsed.push({
      index: frames.indexOf(keyFrame),
      value: keyframe.value,
      easing: typeof keyframe.easing === "string" ? keyframe.easing : "linear",
    });
  }
  parsed.sort((left, right) => left.index - right.index);
  if (new Set(parsed.map((item) => item.index)).size !== parsed.length) {
    throw new ConfigError(`${propertyName} has duplicate keyframes`);
  }
  const first = parsed[0]!;
  const last = parsed[parsed.length - 1]!;
  if (index <= first.index) {
    return first.value;
  }
  if (index >= last.index) {
    return last.value;
  }
  for (let cursor = 0; cursor < parsed.length - 1; cursor += 1) {
    const left = parsed[cursor]!;
    const right = parsed[cursor + 1]!;
    if (left.index <= index && index <= right.index) {
      const span = right.index - left.index;
      return interpolate(left.value, right.value, eased((index - left.index) / span, left.easing), propertyName);
    }
  }
  throw new Error("keyframe lookup should always find a segment");
}

function interpolate(start: unknown, end: unknown, progress: number, label: string): MotionValue {
  if (typeof start === "number") {
    return numberValue(start, label) + (numberValue(end, label) - numberValue(start, label)) * progress;
  }
  const startVector = vector(start, label);
  const endVector = vector(end, label, startVector.length);
  return startVector.map((left, index) => left + (endVector[index]! - left) * progress);
}

function eased(progress: number, easing: string): number {
  if (easing === "linear") {
    return progress;
  }
  if (easing === "step") {
    return progress < 1 ? 0 : 1;
  }
  if (easing === "ease-in") {
    return progress * progress;
  }
  if (easing === "ease-out") {
    return 1 - (1 - progress) ** 2;
  }
  if (easing === "ease-in-out") {
    return progress < 0.5 ? 2 * progress * progress : 1 - ((-2 * progress + 2) ** 2) / 2;
  }
  throw new ConfigError(`unsupported easing ${JSON.stringify(easing)}`);
}

function frameProgress(index: number, frameCount: number): number {
  return frameCount === 1 ? 0 : index / (frameCount - 1);
}

function numberValue(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ConfigError(`${label} must be a number`);
  }
  return value;
}

function vector(value: unknown, label: string, length = 2): number[] {
  if (!Array.isArray(value) || value.length !== length) {
    throw new ConfigError(`${label} must be a ${length}-element array`);
  }
  return value.map((item) => numberValue(item, label));
}

function stringList(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== "string" || item.length === 0)) {
    throw new ConfigError(label === "frames" ? "frames must be a non-empty array of names" : "layerOrder must be a non-empty array");
  }
  return value as string[];
}

function sameMembers(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const remaining = new Set(right);
  return left.every((item) => remaining.has(item));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isResampling(value: string): value is Resampling {
  return value === "nearest" || value === "bilinear" || value === "bicubic" || value === "lanczos";
}

async function discardStaged(staged: StagedFrame[]): Promise<void> {
  await Promise.all(staged.map((frame) => rm(frame.temporary, { force: true })));
}

async function replaceFile(temporary: string, output: string): Promise<void> {
  try {
    await rename(temporary, output);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "EEXIST" && code !== "EPERM") {
      throw error;
    }
    await rm(output, { force: true });
    await rename(temporary, output);
  }
}
