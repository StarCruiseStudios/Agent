import { readdir } from "node:fs/promises";
import path from "node:path";
import { LOOK_DIRECTION_LABELS, STANDARD_ANIMATION_ROWS, standardRowFramePaths } from "./pet-layout.ts";
import { pythonRound } from "./python-round.ts";
import { RgbaImage } from "./rgba-image.ts";

/**
 * Columns in every Codex pet spritesheet.
 */
export const COLUMNS = 8;

/**
 * Pixel width of one animation cell.
 */
export const CELL_WIDTH = 192;

/**
 * Pixel height of one animation cell.
 */
export const CELL_HEIGHT = 208;

/**
 * Rows in the standard animation atlas, before look directions.
 */
export const STANDARD_ROWS = 9;

/**
 * Rows in a v2 atlas, including the two look-direction rows.
 */
export const EXTENDED_ROWS = 11;

/**
 * Pixel width of a full spritesheet.
 */
export const ATLAS_WIDTH = COLUMNS * CELL_WIDTH;

/**
 * Pixel height of the nine standard animation rows.
 */
export const STANDARD_ATLAS_HEIGHT = STANDARD_ROWS * CELL_HEIGHT;

/**
 * Pixel height of a v2 spritesheet.
 */
export const EXTENDED_ATLAS_HEIGHT = EXTENDED_ROWS * CELL_HEIGHT;

const MIN_DETACHED_COMPONENT_PIXELS = 128;
const DEFAULT_EDGE_MARGIN = 2;
const DEFAULT_EDGE_PIXEL_THRESHOLD = 24;
const DEFAULT_CHROMA_THRESHOLD = 96;
const IMAGE_SUFFIXES = new Set([".png", ".webp", ".jpg", ".jpeg"]);

export { LOOK_DIRECTION_LABELS } from "./pet-layout.ts";

/**
 * Visible-sprite registration used to line look cells up with the neutral pose.
 */
interface CellGeometry {
  height: number;
  lowerCenterX: number;
  bottom: number;
}

/**
 * Builds the 8×9 atlas from combined animation frames under `framesRoot`.
 *
 * @param framesRoot - Directory containing one folder per standard animation state.
 * @returns The standard atlas with transparent unused cells.
 */
export async function composeStandardAtlas(framesRoot: string): Promise<RgbaImage> {
  const atlas = RgbaImage.empty(ATLAS_WIDTH, STANDARD_ATLAS_HEIGHT);
  for (const [state, row] of STANDARD_ANIMATION_ROWS) {
    const files = await standardRowFramePaths(framesRoot, state);
    for (const [column, framePath] of files.entries()) {
      await pasteCentered(atlas, await RgbaImage.read(framePath), row, column);
    }
  }
  atlas.clearTransparentRgb();
  return atlas;
}

/**
 * Options for attaching the 16 look directions to a standard atlas.
 */
export interface AssembleOptions {
  /**
   * Standard 1536×1872 atlas whose first nine rows are copied into the v2 sheet.
   */
  base: RgbaImage;
  /**
   * Directory of 16 labeled look-direction cells.
   */
  lookCellsDirectory: string;
  /**
   * External neutral cell written into idle column 6.
   */
  neutralCellPath: string;
  /**
   * `#RRGGBB` background key removed before registration.
   */
  chromaKey: string;
  /**
   * Maximum RGB distance that still counts as the chroma key. Defaults to 96.
   */
  chromaThreshold?: number;
  /**
   * Edge strip thickness used to reject cells that touch the cell border. Defaults to 2.
   */
  edgeMargin?: number;
  /**
   * Maximum non-transparent edge pixels allowed after registration. Defaults to 24.
   */
  edgePixelThreshold?: number;
}

/**
 * Registers look-direction cells to the neutral pose and paints them into rows 9 and 10.
 *
 * @param options - Base atlas, look cells, neutral cell, and chroma settings.
 * @returns The 1536×2288 v2 atlas.
 */
export async function assembleExtendedAtlas(options: AssembleOptions): Promise<RgbaImage> {
  const chromaKey = parseHexColor(options.chromaKey);
  const threshold = options.chromaThreshold ?? DEFAULT_CHROMA_THRESHOLD;
  const atlas = extendBase(options.base);
  const neutral = await fitToCell(
    removeChromaBackground(await RgbaImage.read(options.neutralCellPath), chromaKey, threshold),
  );
  const cells = await loadLookCells(options.lookCellsDirectory, chromaKey, threshold);
  const target = cellGeometry(neutral);
  if (target === undefined) {
    throw new Error("neutral reference cell must contain visible pixels");
  }
  const scale = normalizationScale(cells, target);
  const normalized = await Promise.all(cells.map((cell) => normalizeCell(cell, target, scale)));
  validateNormalizedLookCells(
    normalized,
    0,
    options.edgeMargin ?? DEFAULT_EDGE_MARGIN,
    options.edgePixelThreshold ?? DEFAULT_EDGE_PIXEL_THRESHOLD,
  );
  pasteLookCells(atlas, normalized);
  atlas.alphaComposite(neutral, 6 * CELL_WIDTH, 0);
  atlas.clearTransparentRgb();
  return atlas;
}

/**
 * Parses an `#RRGGBB` color.
 *
 * @param value - Hex color, including the leading `#`.
 * @returns Red, green, and blue channels from 0 through 255.
 */
export function parseHexColor(value: string): [number, number, number] {
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(`invalid chroma key color: ${value}; expected #RRGGBB`);
  }
  return [Number.parseInt(value.slice(1, 3), 16), Number.parseInt(value.slice(3, 5), 16), Number.parseInt(value.slice(5, 7), 16)];
}

/**
 * Euclidean RGB distance.
 *
 * @param red - Red channel from 0 through 255.
 * @param green - Green channel from 0 through 255.
 * @param blue - Blue channel from 0 through 255.
 * @param key - Comparison color.
 * @returns The distance.
 */
export function colorDistance(red: number, green: number, blue: number, key: [number, number, number]): number {
  return Math.hypot(red - key[0], green - key[1], blue - key[2]);
}

function extendBase(base: RgbaImage): RgbaImage {
  if (base.width !== ATLAS_WIDTH || (base.height !== STANDARD_ATLAS_HEIGHT && base.height !== EXTENDED_ATLAS_HEIGHT)) {
    throw new Error(`base atlas must be 1536x1872 or 1536x2288; got ${base.width}x${base.height}`);
  }
  const extended = RgbaImage.empty(ATLAS_WIDTH, EXTENDED_ATLAS_HEIGHT);
  extended.alphaComposite(base.height === STANDARD_ATLAS_HEIGHT ? base : base.crop({ left: 0, top: 0, right: ATLAS_WIDTH, bottom: STANDARD_ATLAS_HEIGHT }), 0, 0);
  return extended;
}

async function loadLookCells(
  cellsDirectory: string,
  chromaKey: [number, number, number],
  threshold: number,
): Promise<RgbaImage[]> {
  const files = await imageFiles(cellsDirectory);
  const cellsByLabel = new Map<string, string>();
  for (const filePath of files) {
    for (const label of labelsForPath(filePath)) {
      if (!cellsByLabel.has(label)) {
        cellsByLabel.set(label, filePath);
      }
    }
  }
  const ordered =
    cellsByLabel.size === LOOK_DIRECTION_LABELS.length
      ? LOOK_DIRECTION_LABELS.map((label) => cellsByLabel.get(label)!)
      : files.length >= LOOK_DIRECTION_LABELS.length
        ? files.slice(0, LOOK_DIRECTION_LABELS.length)
        : undefined;
  if (ordered === undefined) {
    throw new Error(`look cells dir must contain 16 labeled or sortable images; found ${files.length}`);
  }
  const cells: RgbaImage[] = [];
  for (const filePath of ordered) {
    cells.push(removeChromaBackground(await RgbaImage.read(filePath), chromaKey, threshold));
  }
  return cells;
}

function labelsForPath(filePath: string): string[] {
  const stem = path.parse(filePath).name;
  const normalizedStem = normalizeLabel(stem);
  const exact = LOOK_DIRECTION_LABELS.filter((label) => normalizeLabel(label) === normalizedStem);
  if (exact.length > 0) {
    return [...exact];
  }
  const tokens = [...stem.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
  return LOOK_DIRECTION_LABELS.filter((label) => tokens.some((token) => Number(label) === token));
}

function normalizeLabel(value: string): string {
  return value.toLowerCase().replaceAll(".", "").replaceAll("-", "").replaceAll("_", "");
}

function removeChromaBackground(image: RgbaImage, chromaKey: [number, number, number], threshold: number): RgbaImage {
  const output = image.clone();
  for (let index = 0; index < output.pixels.length; index += 4) {
    if (colorDistance(output.pixels[index]!, output.pixels[index + 1]!, output.pixels[index + 2]!, chromaKey) <= threshold) {
      output.pixels[index] = 0;
      output.pixels[index + 1] = 0;
      output.pixels[index + 2] = 0;
      output.pixels[index + 3] = 0;
    }
  }
  return output;
}

async function fitToCell(image: RgbaImage): Promise<RgbaImage> {
  const bounds = image.alphaBounds();
  const target = RgbaImage.empty(CELL_WIDTH, CELL_HEIGHT);
  if (bounds === undefined) {
    return target;
  }
  let sprite = image.crop(bounds);
  const scale = Math.min((CELL_WIDTH - 10) / sprite.width, (CELL_HEIGHT - 10) / sprite.height, 1);
  if (scale !== 1) {
    sprite = await sprite.resize(Math.max(1, pythonRound(sprite.width * scale)), Math.max(1, pythonRound(sprite.height * scale)), "lanczos");
  }
  target.alphaComposite(sprite, Math.floor((CELL_WIDTH - sprite.width) / 2), Math.floor((CELL_HEIGHT - sprite.height) / 2));
  removeSmallDetachedComponents(target);
  return target;
}

async function normalizeCell(cell: RgbaImage, target: CellGeometry, scale: number): Promise<RgbaImage> {
  const bounds = cell.alphaBounds();
  if (bounds === undefined) {
    return cell;
  }
  const sourceGeometry = cellGeometry(cell);
  if (sourceGeometry === undefined || sourceGeometry.height <= 0) {
    return cell;
  }
  const scaledWidth = Math.max(1, pythonRound((bounds.right - bounds.left) * scale));
  const scaledHeight = Math.max(1, pythonRound((bounds.bottom - bounds.top) * scale));
  let crop = cell.crop(bounds);
  if (crop.width !== scaledWidth || crop.height !== scaledHeight) {
    crop = await crop.resize(scaledWidth, scaledHeight, "lanczos");
  }
  const output = RgbaImage.empty(CELL_WIDTH, CELL_HEIGHT);
  output.alphaComposite(
    crop,
    pythonRound(target.lowerCenterX - (sourceGeometry.lowerCenterX - bounds.left) * scale),
    target.bottom - scaledHeight,
  );
  removeSmallDetachedComponents(output);
  return output;
}

function normalizationScale(cells: RgbaImage[], target: CellGeometry): number {
  const geometries = cells.map((cell) => cellGeometry(cell));
  if (geometries.some((geometry) => geometry === undefined)) {
    throw new Error("look direction cells must contain visible pixels");
  }
  const visible = geometries as CellGeometry[];
  const maxHeight = Math.max(...visible.map((geometry) => geometry.height));
  const maxWidth = Math.max(...cells.map((cell) => {
    const bounds = cell.alphaBounds()!;
    return bounds.right - bounds.left;
  }));
  const limits = [target.height / maxHeight, (CELL_WIDTH - 10) / maxWidth, (CELL_HEIGHT - 10) / maxHeight, 1];
  const margin = 5;
  for (const [cell, geometry] of cells.map((item, index) => [item, geometries[index]!] as const)) {
    if (geometry === undefined) {
      continue;
    }
    const bounds = cell.alphaBounds()!;
    const localLowerCenterX = geometry.lowerCenterX - bounds.left;
    const rightExtent = bounds.right - bounds.left - localLowerCenterX;
    if (localLowerCenterX > 0) {
      limits.push((target.lowerCenterX - margin) / localLowerCenterX);
    }
    if (rightExtent > 0) {
      limits.push((CELL_WIDTH - margin - target.lowerCenterX) / rightExtent);
    }
    limits.push((target.bottom - margin) / geometry.height);
  }
  return Math.min(...limits);
}

function cellGeometry(cell: RgbaImage): CellGeometry | undefined {
  const points = opaquePoints(cell);
  if (points.length === 0) {
    return undefined;
  }
  const top = Math.min(...points.map((point) => point.y));
  const bottom = Math.max(...points.map((point) => point.y)) + 1;
  const lower = lowerBandPoints(points, top, bottom);
  return {
    height: bottom - top,
    lowerCenterX: lower.reduce((sum, point) => sum + point.x, 0) / lower.length,
    bottom,
  };
}

function opaquePoints(image: RgbaImage): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (image.pixels[(y * image.width + x) * 4 + 3]! > 16) {
        points.push({ x, y });
      }
    }
  }
  return points;
}

function lowerBandPoints(points: Array<{ x: number; y: number }>, top: number, bottom: number): Array<{ x: number; y: number }> {
  const threshold = top + (bottom - top) * 0.72;
  const lower = points.filter((point) => point.y >= threshold);
  return lower.length > 0 ? lower : points;
}

function validateNormalizedLookCells(cells: RgbaImage[], directionOffset: number, edgeMargin: number, edgePixelThreshold: number): void {
  for (const [index, cell] of cells.entries()) {
    const edgePixels = cell.edgeAlphaCount(edgeMargin);
    if (edgePixels > edgePixelThreshold) {
      const label = LOOK_DIRECTION_LABELS[directionOffset + index];
      throw new Error(
        `look direction ${label} has ${edgePixels} non-transparent pixels near its final cell edge after deterministic registration; resynthesize the complete source row`,
      );
    }
  }
}

function pasteLookCells(atlas: RgbaImage, cells: RgbaImage[]): void {
  if (cells.length !== LOOK_DIRECTION_LABELS.length) {
    throw new Error(`expected 16 look cells, got ${cells.length}`);
  }
  for (const [index, cell] of cells.entries()) {
    const row = STANDARD_ROWS + Math.floor(index / COLUMNS);
    const column = index % COLUMNS;
    atlas.alphaComposite(cell, column * CELL_WIDTH, row * CELL_HEIGHT);
  }
}

async function pasteCentered(atlas: RgbaImage, source: RgbaImage, row: number, column: number): Promise<void> {
  let frame = source;
  if (frame.width !== CELL_WIDTH || frame.height !== CELL_HEIGHT) {
    frame = await thumbnail(frame, CELL_WIDTH, CELL_HEIGHT);
  }
  const left = column * CELL_WIDTH + Math.floor((CELL_WIDTH - frame.width) / 2);
  const top = row * CELL_HEIGHT + Math.floor((CELL_HEIGHT - frame.height) / 2);
  atlas.alphaComposite(frame, left, top);
}

async function thumbnail(image: RgbaImage, maxWidth: number, maxHeight: number): Promise<RgbaImage> {
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  if (scale === 1) {
    return image;
  }
  return image.resize(Math.max(1, pythonRound(image.width * scale)), Math.max(1, pythonRound(image.height * scale)), "lanczos");
}

function removeSmallDetachedComponents(image: RgbaImage): void {
  const visited = new Uint8Array(image.width * image.height);
  const components: number[][] = [];
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const start = y * image.width + x;
      if (visited[start] === 1 || image.pixels[start * 4 + 3]! <= 16) {
        continue;
      }
      const component: number[] = [];
      const stack = [start];
      visited[start] = 1;
      while (stack.length > 0) {
        const current = stack.pop()!;
        component.push(current);
        const currentX = current % image.width;
        const currentY = (current - currentX) / image.width;
        const neighbors = [
          currentX > 0 ? current - 1 : -1,
          currentX + 1 < image.width ? current + 1 : -1,
          currentY > 0 ? current - image.width : -1,
          currentY + 1 < image.height ? current + image.width : -1,
        ];
        for (const next of neighbors) {
          if (next < 0 || visited[next] === 1 || image.pixels[next * 4 + 3]! <= 16) {
            continue;
          }
          visited[next] = 1;
          stack.push(next);
        }
      }
      components.push(component);
    }
  }
  if (components.length === 0) {
    return;
  }
  const largest = Math.max(...components.map((component) => component.length));
  for (const component of components) {
    if (component.length === largest || component.length >= MIN_DETACHED_COMPONENT_PIXELS) {
      continue;
    }
    for (const index of component) {
      image.pixels.fill(0, index * 4, index * 4 + 4);
    }
  }
}

async function imageFiles(directory: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isFile() && IMAGE_SUFFIXES.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort(comparePaths)
    .map((name) => path.join(directory, name));
}

function comparePaths(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
