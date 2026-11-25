import type { FileSystem } from '../filesystem/FileSystem.ts';
import { AgentName } from './AgentName.ts';
import { CompassError } from './CompassError.ts';
import { PathContainment } from './PathContainment.ts';

/**
 * Validates names before disk access and restricts packs to real catalog children.
 */
export class CompassPathGuard {
  private readonly fs: FileSystem;
  constructor(fs: FileSystem) { this.fs = fs; }

  /**
   * Throws `invalid_name` for anything other than a valid single name segment. When a near-miss has an
   * obvious valid form (case or spacing), it is returned as a suggestion.
   */
  validateName(name: unknown, kind: 'agent' | 'skill' = 'agent'): asserts name is string {
    if (AgentName.isValid(name)) return;
    const normalized = AgentName.normalize(name);
    const hint = normalized ? ` Did you mean "${normalized}"?` : '';
    throw new CompassError('invalid_name',
      `The ${kind} name must be lowercase letters and digits in hyphen-separated runs, starting with a letter (at most ${AgentName.maxLength} characters).${hint}`,
      { details: normalized ? { suggestions: [normalized] } : {} });
  }

  /**
   * Resolves `childPath` and requires its real path to be an immediate child of `compassPath`'s real path.
   */
  async resolve(compassPath: string, childPath: string): Promise<string> {
    let catalogReal: string;
    let packReal: string;
    try {
      catalogReal = await this.fs.realpath(compassPath);
      packReal = await this.fs.realpath(childPath);
    } catch {
      throw new CompassError('malformed_pack', 'The pack is malformed: unreadable.', { reason: 'unreadable' });
    }
    if (!PathContainment.immediateChild(catalogReal, packReal)) {
      throw new CompassError('path_escape', 'The real path must be an immediate child of its containing directory.');
    }
    return packReal;
  }
}
