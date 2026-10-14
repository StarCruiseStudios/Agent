import { RgbaImage } from "./rgba-image.ts";
import { CELL_HEIGHT, CELL_WIDTH, parseHexColor } from "./pet-atlas.ts";
import { pythonRound } from "./python-round.ts";

const ALGORITHM = "edge-local-chroma-spill-suppression";

/**
 * Counts and parameters reported by one despill pass.
 */
export interface DespillReport {
  /**
   * Name of the edge-local spill algorithm that produced the image.
   */
  algorithm: string;
  /**
   * Blend toward the interior reference color, from 0 through 1.
   */
  strength: number;
  /**
   * Chebyshev radius of the silhouette band that is eligible for cleanup.
   */
  edgeRadius: number;
  /**
   * How far a color may sit from the key direction and still count as spill.
   */
  spillTolerance: number;
  /**
   * Minimum saturation required before an opaque boundary pixel is treated as spill.
   */
  minimumSaturation: number;
  /**
   * Pixels whose stored color changed.
   */
  changedPixels: number;
  /**
   * Changed pixels that were not fully opaque.
   */
  decontaminatedPixels: number;
  /**
   * Boundary pixels whose color was replaced.
   */
  spillSuppressedPixels: number;
  /**
   * Pixels rejected by the pass. This algorithm reports zero.
   */
  rejectedPixels: number;
  /**
   * Changed-pixel counts keyed by `r{row}c{column}`, largest first.
   */
  changedByCell: Record<string, number>;
  /**
   * True when every output alpha byte matches the input.
   */
  alphaPreserved: boolean;
}

/**
 * Removes chroma-key spill from silhouette edges while preserving alpha.
 *
 * @param image - Atlas or cell to clean. It is not mutated.
 * @param chromaKey - `#RRGGBB` key the spill is measured against.
 * @returns The cleaned image and the cleanup report.
 */
export function despillChroma(image: RgbaImage, chromaKey: string): { image: RgbaImage; report: DespillReport } {
  const strength = 1;
  const edgeRadius = 5;
  const spillTolerance = 0.15;
  const minimumSaturation = 0.1;
  const key = parseHexColor(chromaKey).map((channel) => srgbToLinear(channel / 255)) as [number, number, number];
  const source = image.clone();
  const boundary = atlasEdgeBand(source, edgeRadius);
  const { pixels, suppressed } = suppressBoundarySpill(source, boundary, key, strength, edgeRadius, spillTolerance, minimumSaturation);
  const output = RgbaImage.empty(source.width, source.height);
  const changedByCell = new Map<string, number>();
  let decontaminatedPixels = 0;
  let spillSuppressedPixels = 0;
  for (let index = 0; index < pixels.length; index += 1) {
    const sourceOffset = index * 4;
    const sourcePixel = source.pixels.subarray(sourceOffset, sourceOffset + 4);
    const outputPixel = sourcePixel[3] === 0 ? [0, 0, 0, 0] : pixels[index]!;
    output.pixels.set(outputPixel, sourceOffset);
    if (suppressed[index]) {
      spillSuppressedPixels += 1;
      if (sourcePixel[3]! < 255) {
        decontaminatedPixels += 1;
      }
    }
    if (!samePixel(sourcePixel, outputPixel)) {
      const x = index % source.width;
      const y = Math.floor(index / source.width);
      const cell = `r${Math.floor(y / CELL_HEIGHT)}c${Math.floor(x / CELL_WIDTH)}`;
      changedByCell.set(cell, (changedByCell.get(cell) ?? 0) + 1);
    }
  }
  const orderedCells = [...changedByCell.entries()].sort((left, right) => right[1] - left[1] || (left[0] < right[0] ? -1 : 1));
  return {
    image: output,
    report: {
      algorithm: ALGORITHM,
      strength,
      edgeRadius,
      spillTolerance,
      minimumSaturation,
      changedPixels: [...changedByCell.values()].reduce((sum, count) => sum + count, 0),
      decontaminatedPixels,
      spillSuppressedPixels,
      rejectedPixels: 0,
      changedByCell: Object.fromEntries(orderedCells),
      alphaPreserved: true,
    },
  };
}

function suppressBoundarySpill(
  image: RgbaImage,
  boundary: boolean[],
  keyLinear: [number, number, number],
  strength: number,
  edgeRadius: number,
  spillTolerance: number,
  minimumSaturation: number,
): { pixels: Array<[number, number, number, number]>; suppressed: boolean[] } {
  const { width, height } = image;
  const count = width * height;
  const source: Array<[number, number, number, number]> = [];
  const colors: Array<[number, number, number]> = [];
  for (let index = 0; index < count; index += 1) {
    const offset = index * 4;
    const pixel: [number, number, number, number] = [
      image.pixels[offset]!,
      image.pixels[offset + 1]!,
      image.pixels[offset + 2]!,
      image.pixels[offset + 3]!,
    ];
    source.push(pixel);
    colors.push([srgbToLinear(pixel[0] / 255), srgbToLinear(pixel[1] / 255), srgbToLinear(pixel[2] / 255)]);
  }
  const similarityThreshold = 1 - Math.min(spillTolerance, 1);
  const pending = source.map((pixel, index) => {
    const color = colors[index]!;
    return (
      pixel[3] > 0 &&
      boundary[index] === true &&
      (pixel[3] < 250 || (chromaSaturation(color) >= minimumSaturation && chromaSimilarity(color, keyLinear) >= similarityThreshold))
    );
  });
  const filled = source.map((pixel, index) => pixel[3] > 0 && !pending[index]);
  const output = source.map((pixel) => [...pixel] as [number, number, number, number]);
  const suppressed = new Array<boolean>(count).fill(false);
  const cellWidth = width % CELL_WIDTH === 0 ? CELL_WIDTH : width;
  const cellHeight = height % CELL_HEIGHT === 0 ? CELL_HEIGHT : height;

  for (let pass = 0; pass < edgeRadius * 2 + 1; pass += 1) {
    const updates: Array<{ index: number; cleaned: [number, number, number] }> = [];
    for (let index = 0; index < count; index += 1) {
      if (!pending[index]) {
        continue;
      }
      const x = index % width;
      const y = Math.floor(index / width);
      const cellLeft = Math.floor(x / cellWidth) * cellWidth;
      const cellTop = Math.floor(y / cellHeight) * cellHeight;
      const references: Array<[number, number, number]> = [];
      for (let neighborY = Math.max(cellTop, y - 1); neighborY < Math.min(cellTop + cellHeight, y + 2); neighborY += 1) {
        for (let neighborX = Math.max(cellLeft, x - 1); neighborX < Math.min(cellLeft + cellWidth, x + 2); neighborX += 1) {
          const neighbor = neighborY * width + neighborX;
          if (neighbor !== index && filled[neighbor]) {
            references.push(colors[neighbor]!);
          }
        }
      }
      if (references.length === 0) {
        continue;
      }
      const reference: [number, number, number] = [0, 0, 0];
      for (const color of references) {
        reference[0] += color[0];
        reference[1] += color[1];
        reference[2] += color[2];
      }
      reference[0] /= references.length;
      reference[1] /= references.length;
      reference[2] /= references.length;
      const observed = colors[index]!;
      updates.push({
        index,
        cleaned: [
          observed[0] + (reference[0] - observed[0]) * strength,
          observed[1] + (reference[1] - observed[1]) * strength,
          observed[2] + (reference[2] - observed[2]) * strength,
        ],
      });
    }
    if (updates.length === 0) {
      break;
    }
    for (const update of updates) {
      colors[update.index] = update.cleaned;
      filled[update.index] = true;
      pending[update.index] = false;
      const next: [number, number, number, number] = [
        encodeChannel(update.cleaned[0]),
        encodeChannel(update.cleaned[1]),
        encodeChannel(update.cleaned[2]),
        source[update.index]![3],
      ];
      suppressed[update.index] = !samePixel(next, source[update.index]!);
      output[update.index] = next;
    }
  }

  for (let index = 0; index < count; index += 1) {
    if (!pending[index]) {
      continue;
    }
    const observed = colors[index]!;
    const luminance = (observed[0] + observed[1] + observed[2]) / 3;
    const cleaned: [number, number, number] = [
      observed[0] + (luminance - observed[0]) * strength,
      observed[1] + (luminance - observed[1]) * strength,
      observed[2] + (luminance - observed[2]) * strength,
    ];
    const next: [number, number, number, number] = [
      encodeChannel(cleaned[0]),
      encodeChannel(cleaned[1]),
      encodeChannel(cleaned[2]),
      source[index]![3],
    ];
    output[index] = next;
    suppressed[index] = !samePixel(next, source[index]!);
  }
  return { pixels: output, suppressed };
}

function atlasEdgeBand(image: RgbaImage, radius: number): boolean[] {
  const boundary = edgeBand(image, 0, 0, image.width, image.height, radius);
  if (image.width % CELL_WIDTH !== 0 || image.height % CELL_HEIGHT !== 0) {
    return boundary;
  }
  for (let top = 0; top < image.height; top += CELL_HEIGHT) {
    for (let left = 0; left < image.width; left += CELL_WIDTH) {
      const cellBand = edgeBand(image, left, top, CELL_WIDTH, CELL_HEIGHT, radius);
      for (let index = 0; index < cellBand.length; index += 1) {
        if (!cellBand[index]) {
          continue;
        }
        const x = left + (index % CELL_WIDTH);
        const y = top + Math.floor(index / CELL_WIDTH);
        boundary[y * image.width + x] = true;
      }
    }
  }
  return boundary;
}

function edgeBand(image: RgbaImage, originX: number, originY: number, width: number, height: number, radius: number): boolean[] {
  const band = new Array<boolean>(width * height).fill(false);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = image.pixels[((originY + y) * image.width + originX + x) * 4 + 3]!;
      if (alpha === 0) {
        continue;
      }
      let nearbyTransparent = false;
      const y0 = Math.max(0, y - radius);
      const y1 = Math.min(height - 1, y + radius);
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(width - 1, x + radius);
      for (let neighborY = y0; neighborY <= y1 && !nearbyTransparent; neighborY += 1) {
        for (let neighborX = x0; neighborX <= x1; neighborX += 1) {
          if (image.pixels[((originY + neighborY) * image.width + originX + neighborX) * 4 + 3] === 0) {
            nearbyTransparent = true;
            break;
          }
        }
      }
      band[y * width + x] = nearbyTransparent;
    }
  }
  return band;
}

function chromaSimilarity(color: [number, number, number], key: [number, number, number]): number {
  const colorMean = (color[0] + color[1] + color[2]) / 3;
  const keyMean = (key[0] + key[1] + key[2]) / 3;
  const colorChroma = color.map((channel) => channel - colorMean);
  const keyChroma = key.map((channel) => channel - keyMean);
  const denominator = colorChroma.reduce((sum, channel) => sum + channel * channel, 0) * keyChroma.reduce((sum, channel) => sum + channel * channel, 0);
  if (denominator <= 1e-12) {
    return -1;
  }
  const dot = colorChroma.reduce((sum, channel, index) => sum + channel * keyChroma[index]!, 0);
  return dot / Math.sqrt(denominator);
}

function chromaSaturation(color: [number, number, number]): number {
  const maximum = Math.max(...color);
  if (maximum <= 0) {
    return 0;
  }
  return (maximum - Math.min(...color)) / maximum;
}

function srgbToLinear(value: number): number {
  if (value <= 0.04045) {
    return value / 12.92;
  }
  return ((value + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value: number): number {
  if (value <= 0.0031308) {
    return value * 12.92;
  }
  return 1.055 * value ** (1 / 2.4) - 0.055;
}

function encodeChannel(linear: number): number {
  return pythonRound(linearToSrgb(Math.min(1, Math.max(0, linear))) * 255);
}

function samePixel(left: ArrayLike<number>, right: ArrayLike<number>): boolean {
  return left[0] === right[0] && left[1] === right[1] && left[2] === right[2] && left[3] === right[3];
}
