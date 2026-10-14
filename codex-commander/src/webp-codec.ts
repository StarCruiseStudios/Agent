import { readFile } from "node:fs/promises";
import { simd } from "wasm-feature-detect";
import decode, { init as initDecoder } from "@jsquash/webp/decode.js";
import encode, { init as initEncoder } from "@jsquash/webp/encode.js";

let ready: Promise<void> | undefined;

/**
 * Loads the WebP codec once. The published package fetches its wasm by URL, which Node cannot do, so the local wasm files are compiled explicitly.
 */
function ensureCodec(): Promise<void> {
  ready ??= loadCodec();
  return ready;
}

async function loadCodec(): Promise<void> {
  const encoderName = (await simd()) ? "webp_enc_simd.wasm" : "webp_enc.wasm";
  const encoder = await compileWasm(encoderName, "enc");
  const decoder = await compileWasm("webp_dec.wasm", "dec");
  await initEncoder(encoder as never);
  await initDecoder(decoder as never);
}

async function compileWasm(fileName: string, folder: "enc" | "dec"): Promise<WebAssembly.Module> {
  const fileUrl = new URL(`../node_modules/@jsquash/webp/codec/${folder}/${fileName}`, import.meta.url);
  return WebAssembly.compile(await readFile(fileUrl));
}

/**
 * Encodes an RGBA buffer as lossless WebP, preserving RGB under fully transparent pixels.
 *
 * @param pixels - Row-major RGBA bytes.
 * @param width - Image width in pixels.
 * @param height - Image height in pixels.
 * @returns The WebP file bytes.
 */
export async function encodeLosslessWebp(pixels: Buffer, width: number, height: number): Promise<Buffer> {
  await ensureCodec();
  const imageData = new ImageData(new Uint8ClampedArray(pixels), width, height);
  const encoded = await encode(imageData, { lossless: 1, exact: 1, quality: 100, alpha_quality: 100, method: 6 });
  return Buffer.from(encoded);
}

/**
 * Decodes a WebP file to straight RGBA pixels.
 *
 * @param bytes - WebP file contents.
 * @returns Width, height, and row-major RGBA bytes.
 */
export async function decodeWebp(bytes: Buffer): Promise<{ width: number; height: number; pixels: Buffer }> {
  await ensureCodec();
  const image = await decode(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
  return { width: image.width, height: image.height, pixels: Buffer.from(image.data) };
}
