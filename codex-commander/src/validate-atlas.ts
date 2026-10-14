import { readFile } from "node:fs/promises";
import { PNG } from "pngjs";
import { colorDistance, parseHexColor, ATLAS_WIDTH, CELL_HEIGHT, CELL_WIDTH, COLUMNS, EXTENDED_ATLAS_HEIGHT, STANDARD_ATLAS_HEIGHT } from "./pet-atlas.ts";
import { RgbaImage } from "./rgba-image.ts";
import { decodeWebp } from "./webp-codec.ts";

const ROW_BY_INDEX: ReadonlyArray<readonly [string, number]> = [
  ["idle", 6],
  ["running-right", 8],
  ["running-left", 8],
  ["waving", 4],
  ["jumping", 5],
  ["failed", 8],
  ["waiting", 6],
  ["running", 6],
  ["review", 6],
  ["look-000-to-157.5", 8],
  ["look-180-to-337.5", 8],
];

/**
 * Settings for one atlas validation pass.
 */
export interface ValidateAtlasOptions {
  /**
   * `#RRGGBB` key used for leak and fringe checks.
   */
  chromaKey: string;
  /**
   * When true, only a 1536×2288 v2 atlas is accepted.
   */
  requireV2?: boolean;
  /**
   * RGB distance that still counts as fringe contamination. Defaults to 96.
   */
  chromaFringeThreshold?: number;
}

/**
 * Summary of an atlas validation. Cell details are omitted from the printed report.
 */
export interface AtlasValidation {
  /**
   * True when the atlas has no errors.
   */
  ok: boolean;
  /**
   * Absolute path that was validated, when the atlas came from a file.
   */
  file?: string;
  /**
   * Container format reported for a file, such as `PNG` or `WEBP`.
   */
  format?: string;
  /**
   * Source color mode, such as `RGBA`.
   */
  mode?: string;
  /**
   * Atlas column count.
   */
  columns: number;
  /**
   * Atlas row count.
   */
  rows: number;
  /**
   * `2` for an 11-row atlas and `1` for a 9-row atlas.
   */
  spriteVersionNumber: number;
  /**
   * Atlas width in pixels.
   */
  width: number;
  /**
   * Atlas height in pixels.
   */
  height: number;
  /**
   * Fully transparent pixels that still store a non-zero color.
   */
  transparentRgbResiduePixels: number;
  /**
   * Problems that make the atlas unusable.
   */
  errors: string[];
  /**
   * Problems recorded without failing the atlas.
   */
  warnings: string[];
}

/**
 * Validates a spritesheet file using the same checks as the Codex pet atlas validator.
 *
 * @param filePath - PNG or WebP atlas to inspect.
 * @param options - Chroma key and v2 requirement.
 * @returns The validation summary. `ok` is false when any error was recorded.
 */
export async function validateAtlasFile(filePath: string, options: ValidateAtlasOptions): Promise<AtlasValidation> {
  const bytes = await readFile(filePath);
  const format = detectFormat(bytes);
  if (format === undefined) {
    return invalidFile(`expected PNG or WebP, got unknown`, filePath);
  }
  const image = await decodeAtlas(bytes, format);
  const result = validateAtlas(image, options);
  const alpha = hasAlphaChannel(bytes, format);
  if (!alpha) {
    result.errors.unshift("atlas does not have an alpha channel");
    result.ok = false;
  }
  return { ...result, file: filePath, format, mode: alpha ? "RGBA" : "RGB" };
}

/**
 * Validates an in-memory atlas image.
 *
 * @param image - Decoded RGBA atlas.
 * @param options - Chroma key and v2 requirement.
 * @returns The validation summary.
 */
export function validateAtlas(image: RgbaImage, options: ValidateAtlasOptions): AtlasValidation {
  const chromaKey = parseHexColor(options.chromaKey);
  const fringeThreshold = options.chromaFringeThreshold ?? 96;
  const errors: string[] = [];
  const warnings: string[] = [];
  const nearOpaque = new Map<string, number[]>();
  const expectedHeights = options.requireV2 ? [EXTENDED_ATLAS_HEIGHT] : [STANDARD_ATLAS_HEIGHT, EXTENDED_ATLAS_HEIGHT];
  if (image.width !== ATLAS_WIDTH || !expectedHeights.includes(image.height)) {
    const expected = options.requireV2
      ? `${ATLAS_WIDTH}x${EXTENDED_ATLAS_HEIGHT} for a v2 pet`
      : `${ATLAS_WIDTH}x${STANDARD_ATLAS_HEIGHT} or ${ATLAS_WIDTH}x${EXTENDED_ATLAS_HEIGHT}`;
    errors.push(`expected ${expected}, got ${image.width}x${image.height}`);
  }

  const rowCount = Math.floor(image.height / CELL_HEIGHT);
  const isExtended = image.height === EXTENDED_ATLAS_HEIGHT;
  for (let rowIndex = 0; rowIndex < rowCount && rowIndex < ROW_BY_INDEX.length; rowIndex += 1) {
    const [state, frameCount] = ROW_BY_INDEX[rowIndex]!;
    for (let columnIndex = 0; columnIndex < COLUMNS; columnIndex += 1) {
      const cell = image.crop({
        left: columnIndex * CELL_WIDTH,
        top: rowIndex * CELL_HEIGHT,
        right: (columnIndex + 1) * CELL_WIDTH,
        bottom: (rowIndex + 1) * CELL_HEIGHT,
      });
      const nonTransparent = cell.nonTransparentCount();
      const used = columnIndex < frameCount || (isExtended && rowIndex === 0 && columnIndex === 6);
      const leakPixels = opaqueChromaCount(cell, chromaKey, 36);
      const fringePixels = chromaFringeCount(cell, chromaKey, fringeThreshold, 2, 16);
      if (used && nonTransparent < 50) {
        errors.push(`${state} row ${rowIndex} column ${columnIndex} is empty or too sparse (${nonTransparent} pixels)`);
      }
      if (used && leakPixels > 400) {
        errors.push(
          `${state} row ${rowIndex} column ${columnIndex} has ${leakPixels} opaque pixels near chroma key ${options.chromaKey}; this usually means the sprite background was not removed`,
        );
      }
      if (used && fringePixels > 0) {
        errors.push(
          `${state} row ${rowIndex} column ${columnIndex} has ${fringePixels} visible edge pixels contaminated by chroma key ${options.chromaKey}`,
        );
      }
      if (used && nonTransparent > CELL_WIDTH * CELL_HEIGHT * 0.95) {
        const label = `${state} row ${rowIndex}`;
        const columns = nearOpaque.get(label) ?? [];
        columns.push(columnIndex);
        nearOpaque.set(label, columns);
      }
      if (!used && nonTransparent !== 0) {
        errors.push(`${state} row ${rowIndex} unused column ${columnIndex} is not transparent (${nonTransparent} pixels)`);
      }
    }
  }

  for (const [rowLabel, columns] of nearOpaque) {
    errors.push(`${rowLabel} has ${columns.length} nearly opaque used cells; this usually means the sprite has a non-transparent background`);
  }

  const alphaCount = image.nonTransparentCount();
  if (alphaCount === ATLAS_WIDTH * STANDARD_ATLAS_HEIGHT) {
    errors.push("atlas is fully opaque; custom pets require a transparent sprite background");
  }
  const residue = transparentRgbResidue(image);
  if (residue > 0) {
    errors.push(`atlas has ${residue} fully transparent pixels with non-zero RGB residue`);
  }

  return {
    ok: errors.length === 0,
    columns: COLUMNS,
    rows: rowCount,
    spriteVersionNumber: isExtended ? 2 : 1,
    width: image.width,
    height: image.height,
    transparentRgbResiduePixels: residue,
    errors,
    warnings,
  };
}

function opaqueChromaCount(image: RgbaImage, chromaKey: [number, number, number], threshold: number): number {
  let count = 0;
  for (let index = 0; index < image.pixels.length; index += 4) {
    if (image.pixels[index + 3]! > 16 && colorDistance(image.pixels[index]!, image.pixels[index + 1]!, image.pixels[index + 2]!, chromaKey) <= threshold) {
      count += 1;
    }
  }
  return count;
}

function chromaFringeCount(
  image: RgbaImage,
  chromaKey: [number, number, number],
  distanceThreshold: number,
  edgeRadius: number,
  alphaMinimum: number,
): number {
  let count = 0;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const offset = (y * image.width + x) * 4;
      const alpha = image.pixels[offset + 3]!;
      if (alpha < alphaMinimum) {
        continue;
      }
      if (!hasTransparentNeighbor(image, x, y, edgeRadius)) {
        continue;
      }
      if (colorDistance(image.pixels[offset]!, image.pixels[offset + 1]!, image.pixels[offset + 2]!, chromaKey) <= distanceThreshold) {
        count += 1;
      }
    }
  }
  return count;
}

function hasTransparentNeighbor(image: RgbaImage, x: number, y: number, radius: number): boolean {
  const y0 = Math.max(0, y - radius);
  const y1 = Math.min(image.height - 1, y + radius);
  const x0 = Math.max(0, x - radius);
  const x1 = Math.min(image.width - 1, x + radius);
  for (let neighborY = y0; neighborY <= y1; neighborY += 1) {
    for (let neighborX = x0; neighborX <= x1; neighborX += 1) {
      if (image.pixels[(neighborY * image.width + neighborX) * 4 + 3] === 0) {
        return true;
      }
    }
  }
  return false;
}

function invalidFile(message: string, filePath: string): AtlasValidation {
  return {
    ok: false,
    file: filePath,
    columns: COLUMNS,
    rows: 0,
    spriteVersionNumber: 0,
    width: 0,
    height: 0,
    transparentRgbResiduePixels: 0,
    errors: [message],
    warnings: [],
  };
}

async function decodeAtlas(bytes: Buffer, format: "PNG" | "WEBP"): Promise<RgbaImage> {
  if (format === "PNG") {
    const png = PNG.sync.read(bytes);
    return new RgbaImage(png.width, png.height, Buffer.from(png.data));
  }
  const decoded = await decodeWebp(bytes);
  return new RgbaImage(decoded.width, decoded.height, decoded.pixels);
}

function detectFormat(bytes: Buffer): "PNG" | "WEBP" | undefined {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "PNG";
  }
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    return "WEBP";
  }
  return undefined;
}

function hasAlphaChannel(bytes: Buffer, format: "PNG" | "WEBP"): boolean {
  if (format === "PNG") {
    const colorType = PNG.sync.read(bytes).colorType;
    return colorType === 4 || colorType === 6;
  }
  return webpHasAlpha(bytes);
}

function webpHasAlpha(bytes: Buffer): boolean {
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const tag = bytes.toString("ascii", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (tag === "VP8X" && data < bytes.length) {
      return (bytes[data]! & 0x10) !== 0;
    }
    if (tag === "ALPH") {
      return true;
    }
    if (tag === "VP8L" && data + 4 < bytes.length) {
      return ((bytes.readUInt32LE(data + 1) >> 28) & 1) === 1;
    }
    offset = data + size + (size & 1);
  }
  return false;
}

function transparentRgbResidue(image: RgbaImage): number {
  let count = 0;
  for (let index = 0; index < image.pixels.length; index += 4) {
    if (image.pixels[index + 3] === 0 && (image.pixels[index] !== 0 || image.pixels[index + 1] !== 0 || image.pixels[index + 2] !== 0)) {
      count += 1;
    }
  }
  return count;
}
