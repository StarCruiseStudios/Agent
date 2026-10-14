import { spawn } from "node:child_process";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { combineImages } from "../src/combine-images.ts";
import { ConfigError } from "../src/config-error.ts";
import { despillChroma } from "../src/despill-chroma.ts";
import { packageRoot } from "../src/package-root.ts";
import { assembleExtendedAtlas, composeStandardAtlas } from "../src/pet-atlas.ts";
import { PreviewServer } from "../src/preview-server.ts";
import { RgbaImage } from "../src/rgba-image.ts";
import { validateAtlas } from "../src/validate-atlas.ts";
import { decodeWebp, encodeLosslessWebp } from "../src/webp-codec.ts";

const CHROMA_KEY = "#FF00FF";

/**
 * Entry point for combine, build, install-pet, and preview commands.
 */
async function main(): Promise<void> {
  const command = process.argv[2];
  switch (command) {
    case "combine":
      await runCombine(process.argv.slice(3));
      return;
    case "build":
      await runBuild();
      return;
    case "install-pet":
      await runInstallPet();
      return;
    case "preview":
      await runPreview();
      return;
    default:
      process.stderr.write("Usage: node scripts/cli.ts <combine|build|install-pet|preview> [options]\n");
      process.exitCode = 1;
  }
}

async function runCombine(argv: string[]): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    options: {
      "source-root": { type: "string" },
      animation: { type: "string", multiple: true },
      check: { type: "boolean", default: false },
    },
  });
  await combineImages({
    sourceRoot: values["source-root"] === undefined ? undefined : path.resolve(values["source-root"]),
    animations: values.animation,
    checkOnly: values.check,
  });
}

async function runBuild(): Promise<void> {
  const sourceRoot = path.join(packageRoot, "source");
  const standard = await composeStandardAtlas(sourceRoot);
  const assembled = await assembleExtendedAtlas({
    base: standard,
    lookCellsDirectory: path.join(sourceRoot, "look-directions"),
    neutralCellPath: path.join(sourceRoot, "idle", "00.png"),
    chromaKey: CHROMA_KEY,
  });
  const cleaned = despillChroma(assembled, CHROMA_KEY);
  const encoded = await encodeLosslessWebp(cleaned.image.pixels, cleaned.image.width, cleaned.image.height);
  const decoded = await decodeWebp(encoded);
  const validation = validateAtlas(new RgbaImage(decoded.width, decoded.height, decoded.pixels), {
    chromaKey: CHROMA_KEY,
    chromaFringeThreshold: 80,
    requireV2: true,
  });
  if (!validation.ok) {
    process.stderr.write(`${validation.errors.join("\n")}\n`);
    throw new Error("Spritesheet validation failed.");
  }
  const outputPath = path.join(packageRoot, "output", "spritesheet.webp");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, encoded);
  process.stdout.write(`Despill changed ${cleaned.report.changedPixels} pixels.\n`);
  process.stdout.write(`Wrote ${outputPath}\n`);
}

async function runInstallPet(): Promise<void> {
  const destination = path.join(os.homedir(), ".codex", "pets", "commander");
  await mkdir(destination, { recursive: true });
  await copyFile(path.join(packageRoot, "output", "spritesheet.webp"), path.join(destination, "spritesheet.webp"));
  await copyFile(path.join(packageRoot, "output", "pet.json"), path.join(destination, "pet.json"));
  process.stdout.write(`Installed Commander to ${destination}\n`);
}

async function runPreview(): Promise<void> {
  const previewServer = new PreviewServer();
  const { server, url } = await previewServer.listen();
  process.stdout.write(`Preview at ${url}\n`);
  openBrowser(url);
  await new Promise<void>((resolve) => {
    server.on("close", () => resolve());
  });
}

function openBrowser(url: string): void {
  const command =
    process.platform === "win32" ? "powershell.exe" : process.platform === "darwin" ? "open" : "xdg-open";
  const args =
    process.platform === "win32" ? ["-NoProfile", "-Command", "Start-Process", url] : [url];
  const child = spawn(command, args, { detached: true, stdio: "ignore" });
  child.on("error", (error) => {
    process.stderr.write(`${error.message}\n`);
  });
  child.unref();
}

try {
  await main();
} catch (error) {
  if (error instanceof ConfigError) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
