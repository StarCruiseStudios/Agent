import * as path from 'node:path';
import { z } from 'zod';
import type { FileSystem } from '../filesystem/FileSystem.ts';
import type { CatalogProblem } from './CatalogProblem.ts';
import { CompassError } from './CompassError.ts';
import { resolveCompassReference } from './resolveCompassReference.ts';

const Config = z.strictObject({ directories: z.array(z.string().refine(value => value.trim().length > 0)) });
export interface CatalogDirectory { compassPath: string; names: string[] }

/** Discovers explicit references in preorder, distinguishing cycles from shared dependencies. */
export class CatalogGraph {
  private readonly fs: FileSystem;
  constructor(fs: FileSystem) { this.fs = fs; }

  async discover(projectRoot: string) {
    const compassPath = path.join(projectRoot, '.compass');
    const directories: CatalogDirectory[] = [];
    const problems: CatalogProblem[] = [];
    const active: Array<{ key: string; path: string }> = [];
    const completed = new Set<string>();
    let found = false;
    const visit = async (directory: string, top = false): Promise<void> => {
      let entries: Awaited<ReturnType<FileSystem['readdir']>>;
      let real: string;
      try {
        entries = await this.fs.readdir(directory);
        real = await this.fs.realpath(directory);
      } catch (error) {
        if (top) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            try {
              if (!(await this.fs.readdir(projectRoot)).some(entry => entry.name === '.compass')) return;
            } catch { /* Existing or unreadable root catalog is an error. */ }
          }
          throw new CompassError('malformed_pack', 'The catalog is malformed: unreadable.');
        }
        problems.push({ name: path.basename(directory), path: directory, reason: 'catalog_unreadable' });
        return;
      }
      if (top) found = true;
      const key = process.platform === 'win32' ? real.toLowerCase() : real;
      if (active.some(item => item.key === key)) {
        problems.push({ name: path.basename(directory), path: directory, reason: 'catalog_cycle',
          chain: [...active.map(item => item.path), real] });
        return;
      }
      if (completed.has(key)) return;
      active.push({ key, path: real });
      const names: string[] = [];
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'config.json') continue;
        if (entry.isDirectory()) names.push(entry.name);
        else if (entry.isSymbolicLink()) {
          try { if ((await this.fs.stat(path.join(real, entry.name))).isDirectory()) names.push(entry.name); }
          catch { names.push(entry.name); }
        }
      }
      directories.push({ compassPath: real, names: names.sort() });
      if (entries.some(entry => entry.name === 'config.json')) {
        let references: string[] = [];
        try {
          const text = new TextDecoder('utf-8', { fatal: true }).decode(await this.fs.readFile(path.join(real, 'config.json')));
          references = Config.parse(JSON.parse(text)).directories;
        } catch {
          problems.push({ name: 'config.json', path: path.join(real, 'config.json'), reason: 'invalid_config' });
        }
        for (const reference of references) {
          let resolved: string;
          try { resolved = resolveCompassReference(reference, real); }
          catch {
            problems.push({ name: reference, path: path.join(real, 'config.json'), reason: 'invalid_reference' });
            continue;
          }
          await visit(resolved);
        }
      }
      active.pop();
      completed.add(key);
    };
    await visit(compassPath, true);
    return { projectRoot, compassPath, found, directories, problems };
  }
}
