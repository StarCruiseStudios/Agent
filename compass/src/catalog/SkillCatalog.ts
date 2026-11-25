import * as path from 'node:path';
import { parseDocument } from 'yaml';
import { z } from 'zod';
import type { FileSystem } from '../filesystem/FileSystem.ts';
import type { CompassPathGuard } from './CompassPathGuard.ts';
import { AgentName } from './AgentName.ts';
import { AgentPackParser } from './AgentPackParser.ts';
import { CompassError } from './CompassError.ts';
import type { DirectoryScanner } from './DirectoryScanner.ts';
import { NameMatching } from './NameMatching.ts';
import { PathContainment } from './PathContainment.ts';

/**
 * A skill's name and description, as returned with its owning agent.
 */
export interface SkillSummary { name: string; description: string }

/**
 * One skill that could not be loaded, reported without hiding the agent or its other skills.
 */
export interface SkillProblem { name: string; path: string; reason: string }

const Metadata = z.object({ name: z.string(), description: z.string().refine(value => value.trim().length > 0) });

/** Skills are inspected only after an agent has been selected. */
export class SkillCatalog {
  private readonly fs: FileSystem;
  private readonly guard: CompassPathGuard;
  private readonly scanner: DirectoryScanner;
  constructor(fs: FileSystem, guard: CompassPathGuard, scanner: DirectoryScanner) {
    this.fs = fs; this.guard = guard; this.scanner = scanner;
  }

  private fail(reason: string): never {
    throw new CompassError('malformed_skill', `The skill is malformed: ${reason}.`, { reason });
  }

  private async directory(agentPath: string): Promise<string | undefined> {
    try {
      if (!(await this.fs.readdir(agentPath)).some(entry => entry.name === 'skills')) return undefined;
      return await this.guard.resolve(agentPath, path.join(agentPath, 'skills'));
    } catch (error) {
      if (error instanceof CompassError && error.code === 'path_escape') throw error;
      this.fail('unreadable');
    }
  }

  private async load(skillsPath: string, name: string, names: string[]) {
    if (NameMatching.collides(name, names)) {
      throw new CompassError('case_collision', 'Multiple skill directories share this case-folded name.', { details: { name } });
    }
    this.guard.validateName(name, 'skill');
    const skillPath = await this.guard.resolve(skillsPath, path.join(skillsPath, name));
    let bytes: Uint8Array;
    try {
      const file = await this.fs.realpath(path.join(skillPath, 'SKILL.md'));
      if (!PathContainment.within(skillPath, file)) {
        throw new CompassError('path_escape', 'The skill file must remain within its skill directory.');
      }
      bytes = await this.fs.readFile(file);
    } catch (error) {
      if (error instanceof CompassError) throw error;
      this.fail('unreadable');
    }
    if (bytes.byteLength > AgentPackParser.maxInstructionBytes) this.fail('instructions_too_large');
    let text: string;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { this.fail('invalid_encoding'); }
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
    if (!frontmatter) this.fail('invalid_metadata');
    let summary: SkillSummary;
    try {
      const document = parseDocument(frontmatter[1]);
      if (document.errors.length) this.fail('invalid_metadata');
      summary = Metadata.parse(document.toJS());
    } catch { this.fail('invalid_metadata'); }
    if (!AgentName.isValid(summary.name)) this.fail('invalid_metadata');
    if (summary.name !== name) this.fail('name_mismatch');
    const instructions = text.slice(frontmatter[0].length);
    if (!instructions.trim()) this.fail('empty_instructions');
    return { name: summary.name, description: summary.description, skillPath, instructions };
  }

  /**
   * Returns every valid skill summary of an agent and a problem for each invalid one.
   */
  async list(agentPath: string) {
    const skills: SkillSummary[] = [];
    const skillProblems: SkillProblem[] = [];
    try {
      const directory = await this.directory(agentPath);
      if (directory) {
        const names = await this.scanner.childDirectories(directory);
        for (const name of names) {
          try { const skill = await this.load(directory, name, names); skills.push({ name: skill.name, description: skill.description }); }
          catch (error) { skillProblems.push(this.problem(error, name, path.join(directory, name))); }
        }
      }
    } catch (error) { skillProblems.push(this.problem(error, 'skills', path.join(agentPath, 'skills'))); }
    return { skills, skillProblems };
  }

  private problem(error: unknown, name: string, file: string): SkillProblem {
    let reason = 'malformed_skill:unreadable';
    if (error instanceof CompassError) {
      reason = error.code === 'malformed_skill' || error.code === 'malformed_pack' ?
        `malformed_skill:${error.reason ?? 'unreadable'}` : error.code;
    }
    return { name, path: file, reason };
  }

  /**
   * Loads one skill of an agent by exact name.
   */
  async fetch(agentPath: string, name: string) {
    const unknown = (names: string[]) => {
      const suggestions = NameMatching.suggest(name, names);
      return new CompassError('unknown_skill',
        `This agent has no skill named "${name}".${suggestions.length ? ` Did you mean: ${suggestions.join(', ')}?` : ''}`,
        { details: { name, suggestions } });
    };
    const directory = await this.directory(agentPath);
    if (!directory) throw unknown([]);
    let names: string[];
    try { names = await this.scanner.childDirectories(directory); } catch { this.fail('unreadable'); }
    if (NameMatching.collides(name, names)) {
      throw new CompassError('case_collision', 'Multiple skill directories share this case-folded name.', { details: { name } });
    }
    if (!names.includes(name)) throw unknown(names.filter(candidate => AgentName.isValid(candidate)));
    try { return await this.load(directory, name, names); }
    catch (error) {
      if (error instanceof CompassError && error.code !== 'malformed_pack') throw error.with({ name, path: path.join(directory, name) });
      return this.fail('unreadable');
    }
  }
}
