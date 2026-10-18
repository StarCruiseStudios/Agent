import * as path from 'node:path';
import type { FileSystem } from '../filesystem/FileSystem.ts';
import type { DiagnosticLogger } from '../logging/DiagnosticLogger.ts';
import type { AgentInstructions } from './AgentInstructions.ts';
import type { AgentSummary } from './AgentSummary.ts';
import type { CatalogProblem } from './CatalogProblem.ts';
import type { AgentPackParser } from './AgentPackParser.ts';
import type { CompassPathGuard } from './CompassPathGuard.ts';
import type { ProjectRootResolver } from './ProjectRootResolver.ts';
import { CompassError } from './CompassError.ts';

/**
 * Reads a fresh catalog for every operation and isolates invalid child packs.
 */
export class AgentCatalog {
  private readonly fs: FileSystem;
  private readonly resolver: ProjectRootResolver;
  private readonly guard: CompassPathGuard;
  private readonly parser: AgentPackParser;
  private readonly logger: DiagnosticLogger;

  constructor(fs: FileSystem, resolver: ProjectRootResolver, guard: CompassPathGuard,
    parser: AgentPackParser, logger: DiagnosticLogger) {
    this.fs = fs;
    this.resolver = resolver;
    this.guard = guard;
    this.parser = parser;
    this.logger = logger;
  }

  private async inspect(root: unknown) {
    const projectRoot = await this.resolver.resolve(root);
    const compassPath = path.join(projectRoot, '.compass');
    this.logger.debug('Resolved catalog', { projectRoot, compassPath });
    let entries: Awaited<ReturnType<FileSystem['readdir']>>;
    try { entries = await this.fs.readdir(compassPath); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // A dangling .compass symlink exists, but cannot be read.
        try {
          const siblings = await this.fs.readdir(projectRoot);
          if (siblings.some(entry => entry.name === '.compass')) {
            throw new CompassError('malformed_pack', 'The catalog is malformed: unreadable.');
          }
        } catch (rootError) {
          if (rootError instanceof CompassError) throw rootError;
          throw new CompassError('malformed_pack', 'The catalog is malformed: unreadable.');
        }
        return { projectRoot, compassPath, found: false, names: [] as string[] };
      }
      throw new CompassError('malformed_pack', 'The catalog is malformed: unreadable.');
    }
    const names: string[] = [];
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      if (entry.isDirectory()) names.push(entry.name);
      else if (entry.isSymbolicLink()) {
        try {
          if ((await this.fs.stat(path.join(compassPath, entry.name))).isDirectory()) names.push(entry.name);
        } catch {
          // Keep broken links visible so they receive the unreadable problem token.
          names.push(entry.name);
        }
      }
    }
    names.sort();
    return { projectRoot, compassPath, found: true, names };
  }

  private collision(name: string, names: string[]): boolean {
    return names.filter(candidate => candidate.toLowerCase() === name.toLowerCase()).length > 1;
  }

  private async load(compassPath: string, name: string, names: string[]) {
    if (this.collision(name, names)) {
      throw new CompassError('case_collision', 'Multiple pack directories share this case-folded name.');
    }
    this.guard.validateName(name);
    const agentPath = await this.guard.resolve(compassPath, path.join(compassPath, name));
    const pack = await this.parser.parse(agentPath, name);
    return { ...pack, agentPath };
  }

  async list(root: unknown) {
    const catalog = await this.inspect(root);
    const agents: AgentSummary[] = [];
    const problems: CatalogProblem[] = [];
    for (const name of catalog.names) {
      try { agents.push((await this.load(catalog.compassPath, name, catalog.names)).summary); }
      catch (error) {
        if (!(error instanceof CompassError)) throw error;
        const token = error.message.match(/malformed: ([a-z_]+)\./)?.[1];
        const reason = (error.code === 'malformed_pack' ? `malformed_pack:${token ?? 'unreadable'}` : error.code) as CatalogProblem['reason'];
        problems.push({ name, path: path.join(catalog.compassPath, name), reason });
        this.logger.warn('Invalid pack', { name, code: error.code, reason });
      }
    }
    this.logger.info('Listed catalog', { projectRoot: catalog.projectRoot, compassPath: catalog.compassPath,
      agentCount: agents.length, problemCount: problems.length });
    return { projectRoot: catalog.projectRoot, compassPath: catalog.compassPath, found: catalog.found, agents, problems };
  }

  async fetch(root: unknown, name: unknown): Promise<AgentInstructions> {
    this.guard.validateName(name);
    this.logger.info('Fetching pack', { name });
    const catalog = await this.inspect(root);
    if (!catalog.found) throw new CompassError('catalog_missing', 'The project catalog does not exist.');
    if (this.collision(name, catalog.names)) {
      throw new CompassError('case_collision', 'Multiple pack directories share this case-folded name.');
    }
    if (!catalog.names.includes(name)) throw new CompassError('unknown_agent', 'The named pack directory does not exist.');
    const pack = await this.load(catalog.compassPath, name, catalog.names);
    return { projectRoot: catalog.projectRoot, compassPath: catalog.compassPath,
      ...pack.summary, agentPath: pack.agentPath, instructions: pack.instructions };
  }
}
