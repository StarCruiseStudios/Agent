import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pythonRound } from "../src/python-round.ts";
import { RgbaImage } from "../src/rgba-image.ts";

describe("RgbaImage", () => {
  it("blends source-over the way Pillow does", () => {
    const destination = RgbaImage.empty(1, 1);
    destination.setPixel(0, 0, 10, 20, 30, 128);
    const source = RgbaImage.empty(1, 1);
    source.setPixel(0, 0, 200, 100, 50, 200);
    destination.alphaComposite(source, 0, 0);
    assert.deepEqual(destination.getPixel(0, 0), [177, 90, 48, 228]);
  });

  it("maps nearest-neighbor samples from pixel centers", () => {
    const source = RgbaImage.empty(10, 1);
    for (let x = 0; x < 10; x += 1) {
      source.setPixel(x, 0, x, 0, 0, 255);
    }
    return source.resize(7, 1, "nearest").then((resized) => {
      assert.deepEqual(
        Array.from({ length: 7 }, (_, x) => resized.getPixel(x, 0)[0]),
        [0, 2, 3, 5, 6, 7, 9],
      );
    });
  });

  it("rotates clockwise around the requested center", () => {
    const source = RgbaImage.empty(3, 3);
    let value = 1;
    for (let y = 0; y < 3; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        source.setPixel(x, y, value, 0, 0, 255);
        value += 1;
      }
    }
    const rotated = source.rotateClockwise(90, 1, 1, "nearest");
    assert.deepEqual(
      Array.from({ length: 9 }, (_, index) => rotated.getPixel(index % 3, Math.floor(index / 3))[0]),
      [4, 1, 0, 5, 2, 0, 6, 3, 0],
    );
  });

  it("rounds halves toward even", () => {
    assert.equal(pythonRound(0.5), 0);
    assert.equal(pythonRound(1.5), 2);
    assert.equal(pythonRound(2.5), 2);
    assert.equal(pythonRound(-1.5), -2);
  });
});
