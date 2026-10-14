import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";
import sharp from "sharp";
import { pythonRound } from "./python-round.ts";
import { decodeWebp, encodeLosslessWebp } from "./webp-codec.ts";

/**
 * Names the resampling kernel used when scaling or rotating a sprite.
 */
export type Resampling = "nearest" | "bilinear" | "bicubic" | "lanczos";

/**
 * Exclusive alpha bounds as left, top, right, and bottom.
 */
export interface AlphaBounds {
  /**
   * Left edge in pixels, inclusive.
   */
  left: number;
  /**
   * Top edge in pixels, inclusive.
   */
  top: number;
  /**
   * Right edge in pixels, exclusive.
   */
  right: number;
  /**
   * Bottom edge in pixels, exclusive.
   */
  bottom: number;
}

/**
 * Mutable straight-alpha RGBA image stored in row-major order.
 *
 * Pixel operations that the compositor shares with Pillow, including nearest
 * resize and source-over compositing, follow Pillow's integer rounding.
 */
export class RgbaImage {
  /**
   * Image width in pixels.
   */
  readonly width: number;

  /**
   * Image height in pixels.
   */
  readonly height: number;

  /**
   * Row-major RGBA bytes. Length is `width * height * 4`.
   */
  readonly pixels: Buffer;

  /**
   * @param width - Image width in pixels. Must be positive.
   * @param height - Image height in pixels. Must be positive.
   * @param pixels - Row-major RGBA bytes. Length must be `width * height * 4`.
   */
  constructor(width: number, height: number, pixels: Buffer) {
    if (pixels.length !== width * height * 4) {
      throw new Error(`expected ${width * height * 4} bytes, received ${pixels.length}`);
    }
    this.width = width;
    this.height = height;
    this.pixels = pixels;
  }

  /**
   * Creates a fully transparent image.
   *
   * @param width - Image width in pixels. Must be positive.
   * @param height - Image height in pixels. Must be positive.
   * @returns A blank RGBA image.
   */
  static empty(width: number, height: number): RgbaImage {
    return new RgbaImage(width, height, Buffer.alloc(width * height * 4));
  }

  /**
   * Decodes an image file into straight RGBA pixels.
   *
   * @param filePath - PNG, WebP, or JPEG file to read.
   * @returns The decoded image. JPEG input is given an opaque alpha channel.
   */
  static async read(filePath: string): Promise<RgbaImage> {
    if (path.extname(filePath).toLowerCase() === ".png") {
      const png = PNG.sync.read(await readFile(filePath));
      return new RgbaImage(png.width, png.height, Buffer.from(png.data));
    }
    const decoded = await decodeWebp(await readFile(filePath));
    return new RgbaImage(decoded.width, decoded.height, decoded.pixels);
  }

  /**
   * @returns A detached copy of this image.
   */
  clone(): RgbaImage {
    return new RgbaImage(this.width, this.height, Buffer.from(this.pixels));
  }

  /**
   * Finds the bounding box of pixels whose alpha is greater than zero.
   *
   * @returns Exclusive bounds, or `undefined` when the image is fully transparent.
   */
  alphaBounds(): AlphaBounds | undefined {
    let left = this.width;
    let top = this.height;
    let right = 0;
    let bottom = 0;
    let found = false;
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (this.pixels[(y * this.width + x) * 4 + 3] === 0) {
          continue;
        }
        found = true;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x + 1);
        bottom = Math.max(bottom, y + 1);
      }
    }
    return found ? { left, top, right, bottom } : undefined;
  }

  /**
   * Composites `source` over this image using Pillow's 8-bit source-over blend.
   * Source pixels that fall outside this image are clipped.
   *
   * @param source - Overlay image.
   * @param dx - Destination x offset in pixels. May be negative.
   * @param dy - Destination y offset in pixels. May be negative.
   */
  alphaComposite(source: RgbaImage, dx: number, dy: number): void {
    const startX = Math.max(0, -dx);
    const startY = Math.max(0, -dy);
    const endX = Math.min(source.width, this.width - dx);
    const endY = Math.min(source.height, this.height - dy);
    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        blendPixel(
          this.pixels,
          ((y + dy) * this.width + (x + dx)) * 4,
          source.pixels,
          (y * source.width + x) * 4,
        );
      }
    }
  }

  /**
   * @param width - Output width in pixels. Must be positive.
   * @param height - Output height in pixels. Must be positive.
   * @param resampling - Kernel used to sample the source.
   * @returns The resized image.
   */
  async resize(width: number, height: number, resampling: Resampling): Promise<RgbaImage> {
    if (width === this.width && height === this.height) {
      return this.clone();
    }
    if (resampling === "nearest") {
      return this.resizeNearest(width, height);
    }
    const data = await sharp(this.pixels, {
      raw: { width: this.width, height: this.height, channels: 4 },
      failOn: "none",
    })
      .resize(width, height, { kernel: sharpKernel(resampling), fit: "fill" })
      .ensureAlpha()
      .raw()
      .toBuffer();
    return new RgbaImage(width, height, data);
  }

  /**
   * @returns A left-right mirror of this image.
   */
  mirror(): RgbaImage {
    const output = RgbaImage.empty(this.width, this.height);
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        copyPixel(this, x, y, output, this.width - 1 - x, y);
      }
    }
    return output;
  }

  /**
   * @returns A top-bottom flip of this image.
   */
  flip(): RgbaImage {
    const output = RgbaImage.empty(this.width, this.height);
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        copyPixel(this, x, y, output, x, this.height - 1 - y);
      }
    }
    return output;
  }

  /**
   * Rotates the image clockwise around a point without changing its canvas size.
   * Nearest sampling matches Pillow's affine nearest-neighbor transform.
   *
   * @param degrees - Clockwise rotation in degrees.
   * @param centerX - Rotation center x in source pixels.
   * @param centerY - Rotation center y in source pixels.
   * @param resampling - Kernel used to sample the source.
   * @returns The rotated image on a canvas of the same size.
   */
  rotateClockwise(degrees: number, centerX: number, centerY: number, resampling: Resampling): RgbaImage {
    const { cos, sin, tx, ty } = pillowRotation(degrees, centerX, centerY);
    const output = RgbaImage.empty(this.width, this.height);
    if (resampling === "nearest") {
      this.rotateNearestFixed(output, cos, sin, tx, ty);
      return output;
    }
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const sample = applyAffine(cos, sin, tx, -sin, cos, ty, x + 0.5, y + 0.5);
        sampleBilinear(this, sample.x, sample.y, output, x, y);
      }
    }
    return output;
  }

  /**
   * @param factor - Multiplier applied to every alpha byte. Values outside 0–1 are preserved through rounding.
   * @returns A copy with scaled alpha.
   */
  withAlphaScale(factor: number): RgbaImage {
    const output = this.clone();
    for (let index = 3; index < output.pixels.length; index += 4) {
      output.pixels[index] = clampByte(pythonRound(output.pixels[index]! * factor));
    }
    return output;
  }

  /**
   * Crops to the exclusive rectangle. The rectangle must lie inside the image.
   *
   * @param bounds - Exclusive crop rectangle.
   * @returns The cropped image.
   */
  crop(bounds: AlphaBounds): RgbaImage {
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    const output = RgbaImage.empty(width, height);
    for (let y = 0; y < height; y += 1) {
      const sourceStart = ((bounds.top + y) * this.width + bounds.left) * 4;
      output.pixels.set(this.pixels.subarray(sourceStart, sourceStart + width * 4), y * width * 4);
    }
    return output;
  }

  /**
   * Sets RGB to zero wherever alpha is zero.
   */
  clearTransparentRgb(): void {
    for (let index = 0; index < this.pixels.length; index += 4) {
      if (this.pixels[index + 3] === 0) {
        this.pixels[index] = 0;
        this.pixels[index + 1] = 0;
        this.pixels[index + 2] = 0;
      }
    }
  }

  /**
   * Counts pixels whose alpha is greater than zero.
   *
   * @returns The number of non-transparent pixels.
   */
  nonTransparentCount(): number {
    let count = 0;
    for (let index = 3; index < this.pixels.length; index += 4) {
      if (this.pixels[index]! > 0) {
        count += 1;
      }
    }
    return count;
  }

  /**
   * Counts non-transparent pixels inside the four edge strips.
   * Corner pixels that belong to two strips are counted twice.
   *
   * @param margin - Strip thickness in pixels. Must be positive and within the image.
   * @returns The double-counted edge coverage.
   */
  edgeAlphaCount(margin: number): number {
    let total = 0;
    const boxes = [
      { left: 0, top: 0, right: this.width, bottom: margin },
      { left: 0, top: this.height - margin, right: this.width, bottom: this.height },
      { left: 0, top: 0, right: margin, bottom: this.height },
      { left: this.width - margin, top: 0, right: this.width, bottom: this.height },
    ];
    for (const box of boxes) {
      for (let y = box.top; y < box.bottom; y += 1) {
        for (let x = box.left; x < box.right; x += 1) {
          if (this.pixels[(y * this.width + x) * 4 + 3]! > 0) {
            total += 1;
          }
        }
      }
    }
    return total;
  }

  /**
   * @param red - Red channel from 0 through 255.
   * @param green - Green channel from 0 through 255.
   * @param blue - Blue channel from 0 through 255.
   * @param alpha - Alpha channel from 0 through 255.
   */
  setPixel(x: number, y: number, red: number, green: number, blue: number, alpha: number): void {
    const offset = (y * this.width + x) * 4;
    this.pixels[offset] = red;
    this.pixels[offset + 1] = green;
    this.pixels[offset + 2] = blue;
    this.pixels[offset + 3] = alpha;
  }

  /**
   * @param x - Pixel column.
   * @param y - Pixel row.
   * @returns The RGBA byte tuple at that pixel.
   */
  getPixel(x: number, y: number): [number, number, number, number] {
    const offset = (y * this.width + x) * 4;
    return [
      this.pixels[offset]!,
      this.pixels[offset + 1]!,
      this.pixels[offset + 2]!,
      this.pixels[offset + 3]!,
    ];
  }

  /**
   * Writes a PNG file, creating parent directories when needed.
   *
   * @param filePath - Destination PNG path.
   */
  async writePng(filePath: string): Promise<void> {
    await writeEncoded(this, filePath, "png");
  }

  /**
   * Writes a lossless WebP file that preserves RGB under transparent pixels.
   *
   * @param filePath - Destination WebP path.
   */
  async writeWebp(filePath: string): Promise<void> {
    await writeEncoded(this, filePath, "webp");
  }

  private rotateNearestFixed(output: RgbaImage, cos: number, sin: number, tx: number, ty: number): void {
    const a0 = fixed16(cos);
    const a1 = fixed16(sin);
    const a3 = fixed16(-sin);
    const a4 = fixed16(cos);
    let rowX = fixed16(tx + cos * 0.5 + sin * 0.5);
    let rowY = fixed16(ty - sin * 0.5 + cos * 0.5);
    for (let y = 0; y < this.height; y += 1) {
      let sampleX = rowX;
      let sampleY = rowY;
      for (let x = 0; x < this.width; x += 1) {
        const sourceX = sampleX >> 16;
        const sourceY = sampleY >> 16;
        if (sourceX >= 0 && sourceY >= 0 && sourceX < this.width && sourceY < this.height) {
          copyPixel(this, sourceX, sourceY, output, x, y);
        }
        sampleX += a0;
        sampleY += a3;
      }
      rowX += a1;
      rowY += a4;
    }
  }

  private resizeNearest(width: number, height: number): RgbaImage {
    const output = RgbaImage.empty(width, height);
    const columns = nearestIndices(this.width, width);
    const rows = nearestIndices(this.height, height);
    for (let y = 0; y < height; y += 1) {
      const sourceY = rows[y]!;
      for (let x = 0; x < width; x += 1) {
        copyPixel(this, columns[x]!, sourceY, output, x, y);
      }
    }
    return output;
  }
}

function nearestIndices(inSize: number, outSize: number): Int32Array {
  const scale = inSize / outSize;
  const indices = new Int32Array(outSize);
  let position = scale * 0.5;
  for (let index = 0; index < outSize; index += 1) {
    const source = position < 0 ? 0 : Math.trunc(position);
    indices[index] = Math.min(inSize - 1, source);
    position += scale;
  }
  return indices;
}

function sharpKernel(resampling: Exclude<Resampling, "nearest">): "linear" | "cubic" | "lanczos3" {
  if (resampling === "bilinear") {
    return "linear";
  }
  if (resampling === "bicubic") {
    return "cubic";
  }
  return "lanczos3";
}

function copyPixel(source: RgbaImage, sourceX: number, sourceY: number, target: RgbaImage, targetX: number, targetY: number): void {
  const sourceOffset = (sourceY * source.width + sourceX) * 4;
  target.pixels.set(source.pixels.subarray(sourceOffset, sourceOffset + 4), (targetY * target.width + targetX) * 4);
}

function pillowRotation(clockwiseDegrees: number, centerX: number, centerY: number): { cos: number; sin: number; tx: number; ty: number } {
  const pillowAngle = pythonModulo(-clockwiseDegrees, 360);
  const radians = (-pillowAngle * Math.PI) / 180;
  const cos = Number(Math.cos(radians).toFixed(15));
  const sin = Number(Math.sin(radians).toFixed(15));
  const translated = applyAffine(cos, sin, 0, -sin, cos, 0, -centerX, -centerY);
  return { cos, sin, tx: translated.x + centerX, ty: translated.y + centerY };
}

function pythonModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

function fixed16(value: number): number {
  return Math.floor(value * 65536 + 0.5);
}

function applyAffine(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  x: number,
  y: number,
): { x: number; y: number } {
  return { x: a * x + b * y + c, y: d * x + e * y + f };
}

function sampleBilinear(source: RgbaImage, sampleX: number, sampleY: number, target: RgbaImage, targetX: number, targetY: number): void {
  const left = Math.floor(sampleX);
  const top = Math.floor(sampleY);
  if (left < 0 || top < 0 || left >= source.width || top >= source.height) {
    return;
  }
  const horizontal = sampleX - left;
  const vertical = sampleY - top;
  const right = Math.min(left + 1, source.width - 1);
  const bottom = Math.min(top + 1, source.height - 1);
  const targetOffset = (targetY * target.width + targetX) * 4;
  for (let channel = 0; channel < 4; channel += 1) {
    const topLeft = source.pixels[(top * source.width + left) * 4 + channel]!;
    const topRight = source.pixels[(top * source.width + right) * 4 + channel]!;
    const bottomLeft = source.pixels[(bottom * source.width + left) * 4 + channel]!;
    const bottomRight = source.pixels[(bottom * source.width + right) * 4 + channel]!;
    const blended =
      topLeft * (1 - horizontal) * (1 - vertical) +
      topRight * horizontal * (1 - vertical) +
      bottomLeft * (1 - horizontal) * vertical +
      bottomRight * horizontal * vertical;
    target.pixels[targetOffset + channel] = clampByte(pythonRound(blended));
  }
}

/**
 * Blends one source pixel over a destination pixel with Pillow's integer source-over formula.
 */
function blendPixel(destination: Buffer, destinationOffset: number, source: Buffer, sourceOffset: number): void {
  const sourceAlpha = source[sourceOffset + 3]!;
  if (sourceAlpha === 0) {
    return;
  }
  const destinationAlpha = destination[destinationOffset + 3]!;
  const blend = destinationAlpha * (255 - sourceAlpha);
  const outa255 = sourceAlpha * 255 + blend;
  const precisionBits = 7;
  const coefficient1 = Math.trunc((sourceAlpha * 255 * 255 * (1 << precisionBits)) / outa255);
  const coefficient2 = 255 * (1 << precisionBits) - coefficient1;
  for (let channel = 0; channel < 3; channel += 1) {
    const weighted = source[sourceOffset + channel]! * coefficient1 + destination[destinationOffset + channel]! * coefficient2;
    destination[destinationOffset + channel] = shiftForDiv255(weighted + (0x80 << precisionBits)) >> precisionBits;
  }
  destination[destinationOffset + 3] = shiftForDiv255(outa255 + 0x80);
}

function shiftForDiv255(value: number): number {
  return ((value >> 8) + value) >> 8;
}

function clampByte(value: number): number {
  return Math.min(255, Math.max(0, value));
}

async function writeEncoded(image: RgbaImage, filePath: string, format: "png" | "webp"): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  if (format === "webp") {
    await writeFile(filePath, await encodeLosslessWebp(image.pixels, image.width, image.height));
    return;
  }
  await sharp(image.pixels, {
    raw: { width: image.width, height: image.height, channels: 4 },
    failOn: "none",
  })
    .png()
    .toFile(filePath);
}
