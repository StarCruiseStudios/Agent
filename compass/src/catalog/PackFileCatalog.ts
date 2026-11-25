import * as path from 'node:path';
import type { FileSystem } from '../filesystem/FileSystem.ts';
import { CompassError } from './CompassError.ts';
import { NameMatching } from './NameMatching.ts';
import { PathContainment } from './PathContainment.ts';

/**
 * Resolves named files from a pack's `resources` or `scripts` directory to absolute paths.
 * Contents are never read or listed: pack instructions and skills tell agents which names exist.
 * A failed lookup may suggest up to three close names, never the whole directory.
 */
export class PackFileCatalog {
  private readonly fs: FileSystem;
  private readonly kind: 'resource' | 'script';
  private readonly directoryName: string;
  constructor(fs: FileSystem, kind: 'resource' | 'script') {
    this.fs = fs;
    this.kind = kind;
    this.directoryName = kind === 'resource' ? 'resources' : 'scripts';
  }

  /**
   * Throws `invalid_name` unless `name` is a single file name (letters, digits, `.`, `_`, `-`;
   * not starting with `.`; at most 128 characters).
   */
  validate(name: unknown): asserts name is string {
    if (typeof name !== 'string' || name.length > 128 || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) {
      throw new CompassError('invalid_name', `The ${this.kind} name must be a single file name without path separators.`);
    }
  }

  /**
   * Returns the real path of the named file in the agent's `resources` or `scripts` directory.
   */
  async fetchPath(agentPath: string, name: string) {
    const unknown = (names: string[]) => {
      const suggestions = NameMatching.suggest(name, names);
      return new CompassError(this.kind === 'resource' ? 'unknown_resource' : 'unknown_script',
        `This agent has no ${this.kind} named "${name}".${suggestions.length ? ` Did you mean: ${suggestions.join(', ')}?` : ''}`,
        { details: { name, suggestions } });
    };
    try {
      const entries = await this.fs.readdir(agentPath);
      if (!entries.some(entry => entry.name === this.directoryName)) throw unknown([]);
      const directory = await this.fs.realpath(path.join(agentPath, this.directoryName));
      if (!PathContainment.within(await this.fs.realpath(agentPath), directory)) {
        throw new CompassError('path_escape', `The ${this.directoryName} directory must remain within its pack.`);
      }
      const names = (await this.fs.readdir(directory)).map(entry => entry.name);
      if (NameMatching.collides(name, names)) {
        throw new CompassError('case_collision', `Multiple ${this.kind} files share this case-folded name.`, { details: { name } });
      }
      if (!names.includes(name)) throw unknown(names.filter(candidate => !candidate.startsWith('.')));
      const file = await this.fs.realpath(path.join(directory, name));
      if (!PathContainment.within(directory, file)) {
        throw new CompassError('path_escape', `The ${this.kind} file must remain within its ${this.directoryName} directory.`);
      }
      if ((await this.fs.stat(file)).isDirectory()) throw unknown([]);
      return { name, path: file };
    } catch (error) {
      if (error instanceof CompassError) throw error;
      throw new CompassError('malformed_pack', 'The pack is malformed: unreadable.', { reason: 'unreadable' });
    }
  }
}
