import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CompassError } from '../../src/catalog/CompassError.ts';
import { NodeFileSystem } from '../../src/filesystem/NodeFileSystem.ts';
import { catalog, metadata, override, pack, temporary } from '../helpers.ts';

const native = new NodeFileSystem();
const failure = (code: string, token?: string) => (error: unknown) =>
  error instanceof CompassError && error.code === code && (!token || error.message.includes(`${token}.`));

test('fixture list-to-fetch returns summaries, model hints, default tools and only instructions', async () => {
  const root = fileURLToPath(new URL('../fixtures/project', import.meta.url));
  const service = catalog();
  const list = await service.list(root);
  assert.equal(list.found, true);
  assert.equal(list.agents.length, 1);
  assert.deepEqual(list.problems, []);
  const summary = list.agents[0];
  assert.equal(summary.modelHint, 'grok');
  assert.ok(summary.description && summary.whenToUse);
  assert.deepEqual(summary.tools, []);
  assert.equal('agentPath' in summary, false);
  assert.equal('instructions' in summary, false);
  const fetched = await service.fetch(root, summary.name);
  assert.equal(fetched.agentPath, await fs.realpath(path.join(root, '.compass', summary.name)));
  assert.equal(fetched.projectRoot, await fs.realpath(root));
  assert.equal(fetched.compassPath, path.join(fetched.projectRoot, '.compass'));
  assert.equal(fetched.instructions, await fs.readFile(path.join(fetched.agentPath, 'instructions.md'), 'utf8'));
});

for (const root of [undefined, '', '.', 'relative/path', 42, null]) {
  test(`invalid project root ${JSON.stringify(root)} is rejected before disk access`, async () => {
    const denied = override(native, { realpath: async () => { assert.fail('disk accessed'); } });
    await assert.rejects(catalog(denied).list(root), failure('invalid_project_root'));
  });
}

test('missing and non-directory roots are invalid', async t => {
  const root = await temporary(t);
  await fs.writeFile(path.join(root, 'file'), 'text');
  for (const invalid of ['absent', 'file']) {
    await assert.rejects(catalog().list(path.join(root, invalid)), failure('invalid_project_root'));
  }
});

test('missing catalog never uses parent or nested catalogs; empty catalog is found', async t => {
  const parent = await temporary(t);
  await pack(parent);
  const root = path.join(parent, 'child');
  await fs.mkdir(root);
  await pack(path.join(root, 'nested'));
  const missing = await catalog().list(root);
  assert.deepEqual(missing, { projectRoot: root, compassPath: path.join(root, '.compass'), found: false, agents: [], problems: [] });
  await assert.rejects(catalog().fetch(root, 'reviewer'), failure('catalog_missing'));
  await fs.mkdir(path.join(root, '.compass'));
  assert.deepEqual(await catalog().list(root), { ...missing, found: true });
  await assert.rejects(catalog().fetch(root, 'reviewer'), failure('unknown_agent'));
});

for (const name of ['', '.', '..', '../reviewer', 'a/b', 'a\\b', 'Bad', '-bad', 'bad-', 'a--b', 'a\n', 'a'.repeat(65), undefined, 7]) {
  test(`invalid name ${JSON.stringify(name)} never accesses disk`, async () => {
    const denied = override(native, { realpath: async () => { assert.fail('disk accessed'); } });
    await assert.rejects(catalog(denied).fetch(undefined, name), failure('invalid_name'));
  });
}

test('sorting and mixed invalid packs; hidden directories and loose files ignored', async t => {
  const root = await temporary(t);
  await pack(root, 'zebra');
  await pack(root, 'alpha');
  await fs.mkdir(path.join(root, '.compass', 'bad pack'));
  await fs.mkdir(path.join(root, '.compass', 'broken'));
  await fs.mkdir(path.join(root, '.compass', '.hidden'));
  await fs.writeFile(path.join(root, '.compass', 'loose'), 'ignored');
  const list = await catalog().list(root);
  assert.deepEqual(list.agents.map(agent => agent.name), ['alpha', 'zebra']);
  assert.deepEqual(list.problems.map(problem => [problem.name, problem.reason]),
    [['bad pack', 'invalid_name'], ['broken', 'malformed_pack:missing_metadata']]);
  assert.equal(list.problems[0].path, path.join(root, '.compass', 'bad pack'));
});

test('case collisions precede invalid names and never read pack files', async t => {
  const root = await temporary(t);
  await fs.mkdir(path.join(root, '.compass'));
  const fake = override(native, {
    readdir: async directory => directory.endsWith('.compass') ? ['Reviewer', 'reviewer', 'BAD', 'bad'].map(name =>
      ({ name, isDirectory: () => true, isSymbolicLink: () => false })) : native.readdir(directory),
    readFile: async () => { assert.fail('collision opened a file'); },
  });
  assert.deepEqual((await catalog(fake).list(root)).problems.map(problem => problem.reason), Array(4).fill('case_collision'));
  await assert.rejects(catalog(fake).fetch(root, 'reviewer'), failure('case_collision'));
  await assert.rejects(catalog(fake).fetch(root, 'bad'), failure('case_collision'));
});

test('different-case sole directory is unknown even on a case-insensitive filesystem', async t => {
  const root = await temporary(t);
  await fs.mkdir(path.join(root, '.compass', 'Reviewer'), { recursive: true });
  await assert.rejects(catalog().fetch(root, 'reviewer'), failure('unknown_agent'));
  assert.equal((await catalog().list(root)).problems[0].reason, 'invalid_name');
});

test('next call reads edited metadata and instructions, including list body validation', async t => {
  const root = await temporary(t);
  const directory = await pack(root);
  const service = catalog();
  await service.fetch(root, 'reviewer');
  await fs.writeFile(path.join(directory, 'instructions.md'), 'Updated body');
  await fs.writeFile(path.join(directory, 'agent.json'), JSON.stringify({ ...metadata(), modelHint: 'new-model' }));
  assert.equal((await service.fetch(root, 'reviewer')).instructions, 'Updated body');
  assert.equal((await service.list(root)).agents[0].modelHint, 'new-model');
  await fs.writeFile(path.join(directory, 'instructions.md'), '  ');
  assert.equal((await service.list(root)).problems[0].reason, 'malformed_pack:empty_instructions');
});

test('internal and external real directory links obey containment', async t => {
  const root = await temporary(t);
  const target = await pack(root, 'target');
  const external = path.join(root, 'external');
  await fs.mkdir(external);
  await fs.writeFile(path.join(target, 'agent.json'), JSON.stringify(metadata('alias')));
  await fs.symlink(target, path.join(root, '.compass', 'alias'), process.platform === 'win32' ? 'junction' : 'dir');
  await fs.symlink(external, path.join(root, '.compass', 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
  const service = catalog();
  assert.equal((await service.fetch(root, 'alias')).agentPath, await fs.realpath(target));
  await assert.rejects(service.fetch(root, 'escape'), failure('path_escape'));
  assert.ok((await service.list(root)).problems.some(problem => problem.name === 'escape' && problem.reason === 'path_escape'));
});

test('guard rejects catalog itself and nested real targets; broken realpaths are unreadable', async t => {
  const root = await temporary(t);
  await pack(root);
  for (const target of [path.join(root, '.compass'), path.join(root, '.compass', 'nested', 'child')]) {
    const fake = override(native, { realpath: async value => value.endsWith('reviewer') ? target : native.realpath(value) });
    await assert.rejects(catalog(fake).fetch(root, 'reviewer'), failure('path_escape'));
  }
  const fake = override(native, { realpath: async value => {
    if (value.endsWith('reviewer')) throw Object.assign(new Error('missing target'), { code: 'ENOENT' });
    return native.realpath(value);
  } });
  await assert.rejects(catalog(fake).fetch(root, 'reviewer'), failure('malformed_pack', 'unreadable'));
});

test('directory link classification includes broken links but ignores links to loose files', async t => {
  const root = await temporary(t);
  await fs.mkdir(path.join(root, '.compass'));
  const fake = override(native, {
    readdir: async directory => directory.endsWith('.compass') ? ['broken', 'loose'].map(name =>
      ({ name, isDirectory: () => false, isSymbolicLink: () => true })) : native.readdir(directory),
    stat: async value => {
      if (value.endsWith('broken')) throw Object.assign(new Error('missing target'), { code: 'ENOENT' });
      if (value.endsWith('loose')) return { isDirectory: () => false };
      return native.stat(value);
    },
  });
  const list = await catalog(fake).list(root);
  assert.deepEqual(list.problems.map(problem => [problem.name, problem.reason]), [['broken', 'malformed_pack:unreadable']]);
  assert.deepEqual(list.agents, []);
});

test('an existing unreadable catalog is never reported as missing', async t => {
  const root = await temporary(t);
  await fs.writeFile(path.join(root, '.compass'), 'not a directory');
  await assert.rejects(catalog().list(root), failure('malformed_pack', 'unreadable'));
  const fake = override(native, { readdir: async value => {
    if (value.endsWith('.compass')) throw Object.assign(new Error('dangling catalog'), { code: 'ENOENT' });
    return native.readdir(value);
  } });
  await assert.rejects(catalog(fake).list(root), failure('malformed_pack', 'unreadable'));
});
