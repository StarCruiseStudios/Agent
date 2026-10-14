import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));

/**
 * Absolute path of the commander pet package, which contains `source/` and `output/`.
 */
export const packageRoot = path.resolve(sourceDirectory, "..");
