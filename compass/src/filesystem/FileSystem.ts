/**
 * Read-only operations needed to inspect a catalog.
 */
export interface FileSystem {
  realpath(path: string): Promise<string>;
  stat(path: string): Promise<{ isDirectory(): boolean }>;
  readdir(path: string): Promise<Array<{ name: string; isDirectory(): boolean; isSymbolicLink(): boolean }>>;
  readFile(path: string): Promise<Uint8Array>;
}
