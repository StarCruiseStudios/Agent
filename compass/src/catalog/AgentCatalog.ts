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
import { CatalogGraph, type CatalogDirectory } from './CatalogGraph.ts';
import { SkillCatalog } from './SkillCatalog.ts';

/** Reads a fresh graph for every operation; the first definition owns its skills. */
export class AgentCatalog {
  private readonly graph: CatalogGraph;
  private readonly skills: SkillCatalog;
  private readonly resolver: ProjectRootResolver;
  private readonly guard: CompassPathGuard;
  private readonly parser: AgentPackParser;
  private readonly logger: DiagnosticLogger;

  constructor(fs: FileSystem, resolver: ProjectRootResolver,
    guard: CompassPathGuard, parser: AgentPackParser, logger: DiagnosticLogger) {
    this.resolver = resolver;
    this.guard = guard;
    this.parser = parser;
    this.logger = logger;
    this.graph = new CatalogGraph(fs);
    this.skills = new SkillCatalog(fs, guard);
  }

  private async inspect(root: unknown) {
    const projectRoot = await this.resolver.resolve(root);
    this.logger.debug('Resolved catalog', { projectRoot, compassPath: path.join(projectRoot, '.compass') });
    return this.graph.discover(projectRoot);
  }

  private collision(name: string, names: string[]): boolean {
    return names.filter(candidate => candidate.toLowerCase() === name.toLowerCase()).length > 1;
  }

  private async load(directory: CatalogDirectory, name: string) {
    if (this.collision(name, directory.names)) {
      throw new CompassError('case_collision', 'Multiple pack directories share this case-folded name.');
    }
    this.guard.validateName(name);
    const agentPath = await this.guard.resolve(directory.compassPath, path.join(directory.compassPath, name));
    const pack = await this.parser.parse(agentPath, name);
    return { ...pack, agentPath };
  }

  private definitions(directories: CatalogDirectory[]) {
    const winners = new Map<string, CatalogDirectory>();
    for (const directory of directories) {
      for (const name of directory.names) {
        if (!winners.has(name.toLowerCase())) winners.set(name.toLowerCase(), directory);
      }
    }
    return winners;
  }

  async list(root: unknown) {
    const catalog = await this.inspect(root);
    const agents: AgentSummary[] = [];
    const problems: CatalogProblem[] = [...catalog.problems];
    const winners = this.definitions(catalog.directories);
    for (const directory of catalog.directories) {
      for (const name of directory.names) {
        if (winners.get(name.toLowerCase()) !== directory) continue;
        try { agents.push((await this.load(directory, name)).summary); }
        catch (error) {
          if (!(error instanceof CompassError)) throw error;
          const token = error.message.match(/malformed: ([a-z_]+)\./)?.[1];
          const reason = (error.code === 'malformed_pack' ? `malformed_pack:${token ?? 'unreadable'}` : error.code) as CatalogProblem['reason'];
          problems.push({ name, path: path.join(directory.compassPath, name), reason });
          this.logger.warn('Invalid pack', { name, code: error.code, reason });
        }
      }
    }
    agents.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    this.logger.info('Listed catalog', { projectRoot: catalog.projectRoot, compassPath: catalog.compassPath,
      agentCount: agents.length, problemCount: problems.length });
    return { projectRoot: catalog.projectRoot, compassPath: catalog.compassPath, found: catalog.found, agents, problems };
  }

  private async select(root: unknown, name: string) {
    this.logger.info('Fetching pack', { name });
    const catalog = await this.inspect(root);
    if (!catalog.found) throw new CompassError('catalog_missing', 'The project catalog does not exist.');
    const directory = this.definitions(catalog.directories).get(name.toLowerCase());
    if (directory && this.collision(name, directory.names)) {
      throw new CompassError('case_collision', 'Multiple pack directories share this case-folded name.');
    }
    if (!directory || !directory.names.includes(name)) throw new CompassError('unknown_agent', 'The named pack directory does not exist.');
    const pack = await this.load(directory, name);
    return { projectRoot: catalog.projectRoot, compassPath: directory.compassPath,
      catalogProblems: catalog.problems, ...pack.summary, agentPath: pack.agentPath, instructions: pack.instructions };
  }

  async fetch(root: unknown, name: unknown): Promise<AgentInstructions> {
    this.guard.validateName(name);
    const agent = await this.select(root, name);
    return { ...agent, ...await this.skills.list(agent.agentPath) };
  }

  async fetchSkill(root: unknown, agentName: unknown, skillName: unknown) {
    this.guard.validateName(agentName);
    this.guard.validateName(skillName);
    const agent = await this.select(root, agentName);
    const skill = await this.skills.fetch(agent.agentPath, skillName);
    return { projectRoot: agent.projectRoot, compassPath: agent.compassPath, agentPath: agent.agentPath,
      agentName, catalogProblems: agent.catalogProblems, ...skill };
  }
}
