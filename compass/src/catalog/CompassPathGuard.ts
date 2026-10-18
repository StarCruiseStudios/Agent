import * as path from 'node:path';
import type { FileSystem } from '../filesystem/FileSystem.ts';
import { CompassError } from './CompassError.ts';

/**
 * Validates names before disk access and restricts packs to real catalog children.
 */
export class CompassPathGuard {
  private readonly fs: FileSystem;
  constructor(fs: FileSystem) { this.fs = fs; }

  validateName(name: unknown): asserts name is string {
    if (typeof name !== 'string' || name.length > 64 || name !== name.trim() || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
      throw new CompassError('invalid_name', 'The name must be a valid single pack directory segment.');
    }
  }

  async resolve(compassPath: string, childPath: string): Promise<string> {
    let catalogReal: string;
    let packReal: string;
    try {
      catalogReal = await this.fs.realpath(compassPath);
      packReal = await this.fs.realpath(childPath);
    } catch {
      throw new CompassError('malformed_pack', 'The pack is malformed: unreadable.');
    }
    const relative = path.relative(catalogReal, packReal);
    if (!relative || path.isAbsolute(relative) || relative.startsWith('..') || relative.includes(path.sep)) {
      throw new CompassError('path_escape', 'The pack real path must be an immediate child of the catalog.');
    }
    return packReal;
  }
}
