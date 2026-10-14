import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { composeAnimation, evaluateMotion } from "../src/combine-images.ts";
import { ConfigError } from "../src/config-error.ts";
import { RgbaImage } from "../src/rgba-image.ts";

describe("evaluateMotion", () => {
  const frames = ["00", "01", "02"];

  it("covers endpoints and intermediate frames", () => {
    assert.equal(evaluateMotion({ type: "linear", start: 0, end: 10 }, "01", 1, frames, "rotation"), 5);
    assert.equal(
      evaluateMotion({ type: "frames", values: { "00": 1, "01": 2, "02": 3 } }, "01", 1, frames, "rotation"),
      2,
    );
    assert.deepEqual(
      evaluateMotion(
        { type: "keyframes", keyframes: [{ frame: "00", value: [0, 0] }, { frame: "02", value: [4, 8] }] },
        "01",
        1,
        frames,
        "position",
      ),
      [2, 4],
    );
    const ellipse = evaluateMotion(
      { type: "ellipse", center: [5, 5], radii: [2, 3], startAngle: 0, endAngle: 90 },
      "02",
      2,
      frames,
      "position",
    ) as number[];
    assert.ok(Math.abs(ellipse[0]! - 5) < 1e-9);
    assert.ok(Math.abs(ellipse[1]! - 8) < 1e-9);
    const arc = evaluateMotion(
      { type: "arc", center: [0, 0], radius: 4, startAngle: 0, endAngle: 180 },
      "01",
      1,
      frames,
      "position",
    ) as number[];
    assert.ok(Math.abs(arc[0]!) < 1e-9);
    assert.ok(Math.abs(arc[1]! - 4) < 1e-9);
  });
});

describe("composeAnimation", () => {
  it("paints later layers over earlier layers and honors frame overrides", async () => {
    const temporary = await mkdtemp(path.join(os.tmpdir(), "commander-combine-"));
    try {
      const animation = path.join(temporary, "idle");
      await writeLayer(animation, "drone", [
        [0, 0, 255, 0, 0, 255],
        [0, 0, 255, 0, 0, 255],
      ]);
      await writeLayer(animation, "robot", [
        [1, 0, 0, 0, 255, 255],
        [1, 0, 0, 0, 255, 255],
      ]);
      const config = {
        version: 1,
        canvas: [4, 4],
        frames: ["00", "01"],
        layerOrder: ["drone", "robot"],
        layers: {
          drone: {
            source: "drone/{frame}.png",
            transform: { position: { type: "linear", start: [0, 0], end: [1, 0] } },
            frameOverrides: { "01": { opacity: 0.5 } },
          },
          robot: { source: "robot/{frame}.png" },
        },
      };
      const configPath = path.join(animation, "combine.json");
      await writeFile(configPath, JSON.stringify(config));
      const staged = await composeAnimation(configPath, false);
      for (const frame of staged) {
        const { rename, rm: remove } = await import("node:fs/promises");
        try {
          await rename(frame.temporary, frame.output);
        } catch {
          await remove(frame.output, { force: true });
          await rename(frame.temporary, frame.output);
        }
      }
      const first = await RgbaImage.read(path.join(animation, "00.png"));
      const second = await RgbaImage.read(path.join(animation, "01.png"));
      assert.deepEqual(first.getPixel(1, 0), [0, 0, 255, 255]);
      assert.deepEqual(second.getPixel(1, 0), [0, 0, 255, 255]);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  });

  it("leaves existing outputs untouched when a later frame cannot render", async () => {
    const temporary = await mkdtemp(path.join(os.tmpdir(), "commander-combine-"));
    try {
      const animation = path.join(temporary, "idle");
      await writeLayer(animation, "drone", [[]]);
      await writeLayer(animation, "robot", [[]]);
      await writeFile(path.join(animation, "00.png"), Buffer.from("unchanged"));
      const config = {
        version: 1,
        canvas: [4, 4],
        frames: ["00", "01"],
        layerOrder: ["drone", "robot"],
        layers: {
          drone: { source: "drone/{frame}.png" },
          robot: { source: "robot/{frame}.png" },
        },
      };
      const configPath = path.join(animation, "combine.json");
      await writeFile(configPath, JSON.stringify(config));
      await assert.rejects(() => composeAnimation(configPath, false), ConfigError);
      assert.equal(await readFile(path.join(animation, "00.png"), "utf8"), "unchanged");
      const { readdir } = await import("node:fs/promises");
      const leftovers = (await readdir(animation)).filter((name) => name.includes(".combine-"));
      assert.deepEqual(leftovers, []);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  });
});

async function writeLayer(animation: string, layer: string, pixels: number[][]): Promise<void> {
  const { mkdir } = await import("node:fs/promises");
  const directory = path.join(animation, layer);
  await mkdir(directory, { recursive: true });
  for (const [index, pixel] of pixels.entries()) {
    const image = RgbaImage.empty(4, 4);
    if (pixel.length === 6) {
      image.setPixel(pixel[0]!, pixel[1]!, pixel[2]!, pixel[3]!, pixel[4]!, pixel[5]!);
    }
    await image.writePng(path.join(directory, `${String(index).padStart(2, "0")}.png`));
  }
}
