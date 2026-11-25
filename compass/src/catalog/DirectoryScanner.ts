import * as path from 'node:path';
import type { FileSystem } from '../filesystem/FileSystem.ts';

/**
 * Lists the child directories of a catalog-like directory: real directories, links to directories,
 * and broken links (kept so they surface as unreadable problems instead of disappearing).
 * Names starting with `.` are ignored.
 */
export class DirectoryScanner {
  private readonly fs: FileSystem;
  constructor(fs: FileSystem) { this.fs = fs; }

  /**
   * Returns the sorted child directory names of `directory`. Errors from reading `directory` propagate.
   */
  async childDirectories(directory: string, entries?: Awaited<ReturnType<FileSystem['readdir']>>): Promise<string[]> {
    const names: string[] = [];
    for (const entry of entries ?? await this.fs.readdir(directory)) {
      if (entry.name.startsWith('.')) continue;
      if (entry.isDirectory()) names.push(entry.name);
      else if (entry.isSymbolicLink()) {
        try { if ((await this.fs.stat(path.join(directory, entry.name))).isDirectory()) names.push(entry.name); }
        catch { names.push(entry.name); }
      }
    }
    return names.sort();
  }
}
