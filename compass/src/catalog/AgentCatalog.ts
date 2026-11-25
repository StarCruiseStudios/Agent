import * as path from 'node:path';
import type { FileSystem } from '../filesystem/FileSystem.ts';
import type { DiagnosticLogger } from '../logging/DiagnosticLogger.ts';
import type { AgentInstructions } from './AgentInstructions.ts';
import type { AgentSummary } from './AgentSummary.ts';
import type { CatalogProblem } from './CatalogProblem.ts';
import type { AgentPackParser } from './AgentPackParser.ts';
import type { CompassPathGuard } from './CompassPathGuard.ts';
import type { ProjectRootResolver } from './ProjectRootResolver.ts';
import { AgentName } from './AgentName.ts';
import { CompassError } from './CompassError.ts';
import { CatalogGraph, type CatalogDirectory } from './CatalogGraph.ts';
import { DirectoryScanner } from './DirectoryScanner.ts';
import { NameMatching } from './NameMatching.ts';
import { SkillCatalog } from './SkillCatalog.ts';
import { PackFileCatalog } from './PackFileCatalog.ts';

/**
 * Reads a fresh graph for every operation. Only a validly named directory can claim an agent name;
 * the first claim wins, including all of its skills, resources and scripts.
 */
export class AgentCatalog {
  private readonly graph: CatalogGraph;
  private readonly skills: SkillCatalog;
  private readonly resources: PackFileCatalog;
  private readonly scripts: PackFileCatalog;
  private readonly resolver: ProjectRootResolver;
  private readonly guard: CompassPathGuard;
  private readonly parser: AgentPackParser;
  private readonly logger: DiagnosticLogger;

  constructor(fs: FileSystem, resolver: ProjectRootResolver,
    guard: CompassPathGuard, parser: AgentPackParser, logger: DiagnosticLogger) {
    const scanner = new DirectoryScanner(fs);
    this.resolver = resolver;
    this.guard = guard;
    this.parser = parser;
    this.logger = logger;
    this.graph = new CatalogGraph(fs, scanner);
    this.skills = new SkillCatalog(fs, guard, scanner);
    this.resources = new PackFileCatalog(fs, 'resource');
    this.scripts = new PackFileCatalog(fs, 'script');
  }

  private async inspect(root: unknown) {
    const projectRoot = await this.resolver.resolve(root);
    this.logger.debug('Resolved catalog', { projectRoot, compassPath: path.join(projectRoot, '.compass') });
    return this.graph.discover(projectRoot);
  }

  private async load<Full extends boolean>(directory: CatalogDirectory, name: string, full: Full) {
    const childPath = path.join(directory.compassPath, name);
    try {
      const agentPath = await this.guard.resolve(directory.compassPath, childPath);
      const pack = full ? await this.parser.parse(agentPath, name) : await this.parser.parseSummary(agentPath, name);
      return { ...pack, agentPath } as (Full extends true ? { instructions: string } : object) & { summary: AgentSummary; agentPath: string };
    } catch (error) {
      if (error instanceof CompassError) throw error.with({ name, path: childPath });
      throw error;
    }
  }

  private problem(error: unknown, directory: CatalogDirectory, name: string): CatalogProblem {
    if (!(error instanceof CompassError)) throw error;
    const reason = (error.code === 'malformed_pack' ? `malformed_pack:${error.reason ?? 'unreadable'}` : error.code) as CatalogProblem['reason'];
    this.logger.warn('Invalid pack', { name, code: error.code, reason });
    return { name, path: path.join(directory.compassPath, name), reason };
  }

  /**
   * Lists every winning agent summary and every invalid agent directory as a problem.
   */
  async list(root: unknown) {
    const catalog = await this.inspect(root);
    const agents: AgentSummary[] = [];
    const problems: CatalogProblem[] = [...catalog.problems];
    const claimed = new Set<string>();
    for (const directory of catalog.directories) {
      for (const group of NameMatching.groups(directory.names)) {
        const key = NameMatching.fold(group[0]!);
        if (group.length > 1) {
          if (claimed.has(key)) continue;
          claimed.add(key);
          for (const name of group) problems.push({ name, path: path.join(directory.compassPath, name), reason: 'case_collision' });
          continue;
        }
        const name = group[0]!;
        if (!AgentName.isValid(name)) {
          problems.push({ name, path: path.join(directory.compassPath, name), reason: 'invalid_name' });
          continue;
        }
        if (claimed.has(name)) continue;
        claimed.add(name);
        try { agents.push((await this.load(directory, name, false)).summary); }
        catch (error) { problems.push(this.problem(error, directory, name)); }
      }
    }
    agents.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    this.logger.info('Listed catalog', { projectRoot: catalog.projectRoot, compassPath: catalog.compassPath,
      agentCount: agents.length, problemCount: problems.length });
    return { projectRoot: catalog.projectRoot, compassPath: catalog.compassPath, found: catalog.found, agents, problems };
  }

  /**
   * Finds the winning definition of a validated name. A directory claims the name when it holds that
   * exact directory, or a case-fold group of several (which is reported as a collision).
   */
  private async select<Full extends boolean>(root: unknown, name: string, full: Full) {
    this.logger.info('Fetching pack', { name });
    const catalog = await this.inspect(root);
    if (!catalog.found) {
      throw new CompassError('catalog_missing', 'The project catalog does not exist.', { details: { path: catalog.compassPath } });
    }
    for (const directory of catalog.directories) {
      const group = directory.names.filter(candidate => NameMatching.fold(candidate) === name);
      if (group.length > 1) {
        throw new CompassError('case_collision', 'Multiple pack directories share this case-folded name.',
          { details: { name, path: directory.compassPath } });
      }
      if (group[0] !== name) continue;
      const pack = await this.load(directory, name, full);
      return { projectRoot: catalog.projectRoot, compassPath: directory.compassPath, pack };
    }
    const suggestions = NameMatching.suggest(name,
      catalog.directories.flatMap(directory => directory.names).filter(candidate => AgentName.isValid(candidate)));
    throw new CompassError('unknown_agent',
      `No agent named "${name}" exists in this catalog.${suggestions.length ? ` Did you mean: ${suggestions.join(', ')}?` : ''}`,
      { details: { name, suggestions } });
  }

  /**
   * Returns one agent's metadata, instructions and skill summaries.
   */
  async fetch(root: unknown, name: unknown): Promise<AgentInstructions> {
    this.guard.validateName(name);
    const { projectRoot, compassPath, pack } = await this.select(root, name, true);
    return { projectRoot, compassPath, ...pack.summary, agentPath: pack.agentPath, instructions: pack.instructions,
      ...await this.skills.list(pack.agentPath) };
  }

  /**
   * Returns one skill body of an agent. The agent's own instructions are validated only cheaply.
   */
  async fetchSkill(root: unknown, agentName: unknown, skillName: unknown) {
    this.guard.validateName(agentName);
    this.guard.validateName(skillName, 'skill');
    const { projectRoot, compassPath, pack } = await this.select(root, agentName, false);
    const skill = await this.skills.fetch(pack.agentPath, skillName);
    return { projectRoot, compassPath, agentPath: pack.agentPath, agentName, ...skill };
  }

  /**
   * Returns the real path of a named file in the agent's `resources` directory.
   */
  async fetchResourcePath(root: unknown, agentName: unknown, resourceName: unknown) {
    return this.fetchPackFile(this.resources, root, agentName, resourceName);
  }

  /**
   * Returns the real path of a named file in the agent's `scripts` directory.
   */
  async fetchScriptPath(root: unknown, agentName: unknown, scriptName: unknown) {
    return this.fetchPackFile(this.scripts, root, agentName, scriptName);
  }

  private async fetchPackFile(files: PackFileCatalog, root: unknown, agentName: unknown, name: unknown) {
    this.guard.validateName(agentName);
    files.validate(name);
    const { projectRoot, compassPath, pack } = await this.select(root, agentName, false);
    const file = await files.fetchPath(pack.agentPath, name);
    return { projectRoot, compassPath, agentPath: pack.agentPath, agentName, name: file.name, path: file.path };
  }
}
