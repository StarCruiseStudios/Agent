import * as path from 'node:path';
import { parseDocument } from 'yaml';
import { z } from 'zod';
import type { FileSystem } from '../filesystem/FileSystem.ts';
import type { CompassPathGuard } from './CompassPathGuard.ts';
import { CompassError } from './CompassError.ts';

export interface SkillSummary { name: string; description: string }
export interface SkillProblem { name: string; path: string; reason: string }
const Metadata = z.object({ name: z.string(), description: z.string().refine(value => value.trim().length > 0) });

/** Skills are inspected only after an agent has been selected. */
export class SkillCatalog {
  private readonly fs: FileSystem;
  private readonly guard: CompassPathGuard;
  constructor(fs: FileSystem, guard: CompassPathGuard) { this.fs = fs; this.guard = guard; }

  private fail(reason: string): never { throw new CompassError('malformed_skill', `The skill is malformed: ${reason}.`); }

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
    if (names.filter(candidate => candidate.toLowerCase() === name.toLowerCase()).length > 1) {
      throw new CompassError('case_collision', 'Multiple skill directories share this case-folded name.');
    }
    this.guard.validateName(name);
    const skillPath = await this.guard.resolve(skillsPath, path.join(skillsPath, name));
    let bytes: Uint8Array;
    try {
      const file = await this.fs.realpath(path.join(skillPath, 'SKILL.md'));
      const relative = path.relative(skillPath, file);
      if (!relative || path.isAbsolute(relative) || relative === '..' || relative.startsWith(`..${path.sep}`)) {
        throw new CompassError('path_escape', 'The skill file must remain within its skill directory.');
      }
      bytes = await this.fs.readFile(file);
    } catch (error) {
      if (error instanceof CompassError) throw error;
      this.fail('unreadable');
    }
    if (bytes.byteLength > 262144) this.fail('instructions_too_large');
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
      this.guard.validateName(summary.name);
    } catch { this.fail('invalid_metadata'); }
    if (summary.name !== name) this.fail('name_mismatch');
    const instructions = text.slice(frontmatter[0].length);
    if (!instructions.trim()) this.fail('empty_instructions');
    return { ...summary, skillPath, instructions };
  }

  private async names(directory: string) {
    const names: string[] = [];
    for (const entry of await this.fs.readdir(directory)) {
      if (entry.name.startsWith('.')) continue;
      if (entry.isDirectory()) names.push(entry.name);
      else if (entry.isSymbolicLink()) {
        try { if ((await this.fs.stat(path.join(directory, entry.name))).isDirectory()) names.push(entry.name); }
        catch { names.push(entry.name); }
      }
    }
    return names.sort();
  }

  async list(agentPath: string) {
    const skills: SkillSummary[] = [];
    const skillProblems: SkillProblem[] = [];
    try {
      const directory = await this.directory(agentPath);
      if (directory) {
        const names = await this.names(directory);
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
        `malformed_skill:${error.message.match(/malformed: ([a-z_]+)\./)?.[1] ?? 'unreadable'}` : error.code;
    }
    return { name, path: file, reason };
  }

  async fetch(agentPath: string, name: string) {
    const directory = await this.directory(agentPath);
    if (!directory) throw new CompassError('unknown_skill', 'The named skill does not exist for this agent.');
    let names: string[];
    try { names = await this.names(directory); } catch { this.fail('unreadable'); }
    if (names.filter(candidate => candidate.toLowerCase() === name.toLowerCase()).length > 1) {
      throw new CompassError('case_collision', 'Multiple skill directories share this case-folded name.');
    }
    if (!names.includes(name)) throw new CompassError('unknown_skill', 'The named skill does not exist for this agent.');
    try { return await this.load(directory, name, names); }
    catch (error) {
      if (error instanceof CompassError && error.code !== 'malformed_pack') throw error;
      this.fail('unreadable');
    }
  }
}
