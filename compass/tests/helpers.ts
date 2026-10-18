import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import type { TestContext } from 'node:test';
import { AgentCatalog } from '../src/catalog/AgentCatalog.ts';
import { AgentPackParser } from '../src/catalog/AgentPackParser.ts';
import { CompassPathGuard } from '../src/catalog/CompassPathGuard.ts';
import { ProjectRootResolver } from '../src/catalog/ProjectRootResolver.ts';
import { NodeFileSystem } from '../src/filesystem/NodeFileSystem.ts';
import type { FileSystem } from '../src/filesystem/FileSystem.ts';
import type { DiagnosticLogger } from '../src/logging/DiagnosticLogger.ts';

export const logger: DiagnosticLogger = { debug() {}, info() {}, warn() {}, error() {} };
export const metadata = (name = 'reviewer') => ({ name, description: 'Review changes.', whenToUse: 'Review requested.', modelHint: 'any-model' });

export function catalog(fileSystem: FileSystem = new NodeFileSystem()) {
  return new AgentCatalog(fileSystem, new ProjectRootResolver(fileSystem), new CompassPathGuard(fileSystem),
    new AgentPackParser(fileSystem), logger);
}

export async function temporary(t: TestContext): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'compass-test-'));
  // root is the exact mkdtemp result under the OS temp directory, never caller input.
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return fs.realpath(root);
}

export async function pack(root: string, name = 'reviewer') {
  const directory = path.join(root, '.compass', name);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, 'agent.json'), JSON.stringify(metadata(name)));
  await fs.writeFile(path.join(directory, 'instructions.md'), '# Review\nRead carefully.\n');
  return directory;
}

export function override(base: FileSystem, changes: Partial<FileSystem>): FileSystem {
  return {
    realpath: changes.realpath ?? base.realpath.bind(base),
    readdir: changes.readdir ?? base.readdir.bind(base),
    stat: changes.stat ?? base.stat.bind(base),
    readFile: changes.readFile ?? base.readFile.bind(base),
  };
}
