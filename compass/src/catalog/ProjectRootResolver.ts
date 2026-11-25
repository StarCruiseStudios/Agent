import * as path from 'node:path';
import type { FileSystem } from '../filesystem/FileSystem.ts';
import { CompassError } from './CompassError.ts';

/**
 * Validates a project root: the explicit per-call value, else the launch default.
 * There is no cwd, environment, or ancestor fallback; the launch flag is the only default.
 */
export class ProjectRootResolver {
  private readonly fs: FileSystem;
  private readonly defaultRoot: string | undefined;
  /** @param defaultRoot absolute launch default already produced by {@link resolveLaunchRoot}. */
  constructor(fs: FileSystem, defaultRoot?: string) { this.fs = fs; this.defaultRoot = defaultRoot; }

  /**
   * Resolves a launch value (absolute, or relative to cwd) to a real directory path.
   * Throws a CompassError when it is not an accessible directory.
   */
  async resolveLaunchRoot(value: string, cwd: string): Promise<string> {
    return this.validate(path.resolve(cwd, value), 'The --project-root value must be an accessible directory.');
  }

  async resolve(projectRoot: unknown): Promise<string> {
    if (projectRoot === undefined && this.defaultRoot !== undefined) {
      return this.validate(this.defaultRoot, 'The launch --project-root is no longer an accessible directory.');
    }
    if (typeof projectRoot !== 'string' || !path.isAbsolute(projectRoot)) {
      throw new CompassError('invalid_project_root',
        'An absolute projectRoot is required unless the server was launched with --project-root.');
    }
    return this.validate(projectRoot, 'The projectRoot must be an accessible directory.');
  }

  private async validate(candidate: string, message: string): Promise<string> {
    try {
      const real = await this.fs.realpath(candidate);
      if (!(await this.fs.stat(real)).isDirectory()) throw new Error('not a directory');
      return real;
    } catch {
      throw new CompassError('invalid_project_root', message);
    }
  }
}
