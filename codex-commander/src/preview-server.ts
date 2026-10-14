import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadPreviewManifest } from "./pet-layout.ts";
import { packageRoot } from "./package-root.ts";

const MIME_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
};

/**
 * Serves the package root and `/manifest.json` for the animation preview.
 */
export class PreviewServer {
  private readonly sourceRoot = path.join(packageRoot, "source");

  /**
   * Starts the server on an ephemeral port.
   *
   * @returns The listening server and the preview URL.
   */
  async listen(): Promise<{ server: Server; url: string }> {
    const server = createServer((request, response) => {
      void this.handle(request, response);
    });
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("Preview server failed to bind a port.");
    }
    return { server, url: `http://127.0.0.1:${address.port}/preview/index.html` };
  }

  private async handle(
    request: import("node:http").IncomingMessage,
    response: import("node:http").ServerResponse,
  ): Promise<void> {
    try {
      const requestPath = decodeURIComponent((request.url ?? "/").split("?")[0] ?? "/");
      if (requestPath === "/manifest.json") {
        const manifest = await loadPreviewManifest(this.sourceRoot);
        response.writeHead(200, { "Content-Type": MIME_TYPES[".json"] });
        response.end(JSON.stringify(manifest));
        return;
      }
      if (requestPath === "/") {
        response.writeHead(302, { Location: "/preview/index.html" });
        response.end();
        return;
      }
      const relative = requestPath.replace(/^\/+/, "");
      const filePath = path.resolve(packageRoot, relative);
      const pathWithinRoot = path.relative(packageRoot, filePath);
      if (pathWithinRoot.startsWith("..") || path.isAbsolute(pathWithinRoot)) {
        response.writeHead(403);
        response.end();
        return;
      }
      const bytes = await readFile(filePath);
      const extension = path.extname(filePath).toLowerCase();
      response.writeHead(200, { "Content-Type": MIME_TYPES[extension] ?? "application/octet-stream" });
      response.end(bytes);
    } catch {
      response.writeHead(404);
      response.end();
    }
  }
}
