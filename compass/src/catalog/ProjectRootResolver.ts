import * as path from 'node:path';
import type { FileSystem } from '../filesystem/FileSystem.ts';
import { CompassError } from './CompassError.ts';

/**
 * Validates an explicit root without cwd, environment, or ancestor fallbacks.
 */
export class ProjectRootResolver {
  private readonly fs: FileSystem;
  constructor(fs: FileSystem) { this.fs = fs; }

  async resolve(projectRoot: unknown): Promise<string> {
    if (typeof projectRoot !== 'string' || !path.isAbsolute(projectRoot)) {
      throw new CompassError('invalid_project_root', 'An explicit absolute projectRoot is required.');
    }
    try {
      const real = await this.fs.realpath(projectRoot);
      if (!(await this.fs.stat(real)).isDirectory()) throw new Error('not a directory');
      return real;
    } catch {
      throw new CompassError('invalid_project_root', 'The projectRoot must be an accessible directory.');
    }
  }
}
