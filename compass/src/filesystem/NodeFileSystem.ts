import * as fs from 'node:fs/promises';
import type { FileSystem } from './FileSystem.ts';

/**
 * Native read-only filesystem adapter.
 */
export class NodeFileSystem implements FileSystem {
  realpath(path: string) { return fs.realpath(path); }
  stat(path: string) { return fs.stat(path); }
  readdir(path: string) { return fs.readdir(path, { withFileTypes: true }); }
  readFile(path: string) { return fs.readFile(path); }
}
