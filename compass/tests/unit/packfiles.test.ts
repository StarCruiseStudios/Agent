import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { CompassError } from '../../src/catalog/CompassError.ts';
import { NodeFileSystem } from '../../src/filesystem/NodeFileSystem.ts';
import { FetchResourcePathTool } from '../../src/tools/FetchResourcePathTool.ts';
import { FetchScriptPathTool } from '../../src/tools/FetchScriptPathTool.ts';
import { ToolResultFactory } from '../../src/tools/ToolResultFactory.ts';
import { catalog, logger, override, pack, temporary } from '../helpers.ts';

const failure = (code: string) => (error: unknown) => error instanceof CompassError && error.code === code;

async function put(agent: string, dir: string, name: string, body = 'x') {
  await fs.mkdir(path.join(agent, dir), { recursive: true });
  await fs.writeFile(path.join(agent, dir, name), body);
  return path.join(agent, dir, name);
}

const kinds = [
  ['resource', 'resources', 'fetchResourcePath', 'unknown_resource'],
  ['script', 'scripts', 'fetchScriptPath', 'unknown_script'],
] as const;

for (const [kind, dir, method, unknown] of kinds) {
  test(`${kind} paths are pack scoped, resolved by name and never read`, async t => {
    const root = await temporary(t);
    const agent = await pack(root);
    const other = await pack(root, 'writer');
    const file = await put(agent, dir, 'tool.v1.txt');
    await put(other, dir, 'tool.v1.txt');
    const native = new NodeFileSystem();
    const service = catalog(override(native, { readFile: async value => {
      assert.ok(!value.endsWith('tool.v1.txt')); return native.readFile(value); } }));
    const result = await service[method](root, 'reviewer', 'tool.v1.txt');
    assert.equal(result.path, await fs.realpath(file));
    assert.equal(result.name, 'tool.v1.txt');
    assert.equal(result.agentName, 'reviewer');
    assert.notEqual((await service[method](root, 'writer', 'tool.v1.txt')).path, result.path);
  });

  test(`${kind} lookup fails for absent names, absent directories and other pack's files`, async t => {
    const root = await temporary(t);
    const agent = await pack(root);
    const other = await pack(root, 'writer');
    await assert.rejects(catalog()[method](root, 'reviewer', 'missing.txt'), failure(unknown));
    await put(other, dir, 'only-writer.txt');
    await assert.rejects(catalog()[method](root, 'reviewer', 'only-writer.txt'), failure(unknown));
    await fs.mkdir(path.join(agent, dir, 'subdir'), { recursive: true });
    await assert.rejects(catalog()[method](root, 'reviewer', 'subdir'), failure(unknown));
  });

  test(`${kind} names are validated before disk access`, async () => {
    const denied = override(new NodeFileSystem(), { realpath: async () => { assert.fail('disk accessed'); } });
    for (const name of ['../x', 'a/b', 'a\\b', '.hidden', '..', '', 'x'.repeat(129)]) {
      await assert.rejects(catalog(denied)[method](undefined, 'reviewer', name), failure('invalid_name'));
    }
    await assert.rejects(catalog(denied)[method](undefined, '../bad', 'ok.txt'), failure('invalid_name'));
  });

  test(`${kind} directory and file links cannot escape the pack`, async t => {
    for (const level of ['directory', 'file']) {
      const root = await temporary(t);
      const agent = await pack(root);
      const file = await put(agent, dir, 'a.txt');
      const external = path.join(root, 'external');
      await fs.writeFile(external, 'secret');
      const native = new NodeFileSystem();
      const target = level === 'directory' ? path.join(agent, dir) : file;
      const fake = override(native, { realpath: async value => value === target ? external : native.realpath(value) });
      await assert.rejects(catalog(fake)[method](root, 'reviewer', 'a.txt'), failure('path_escape'));
    }
  });

  test(`${kind} unknown names suggest at most three close file names and never the whole directory`, async t => {
    const root = await temporary(t);
    const agent = await pack(root);
    for (const name of ['run-a.ps1', 'run-b.ps1', 'run-c.ps1', 'run-d.ps1', 'other.txt', '.hidden.ps1']) await put(agent, dir, name);
    const rejection = async (name: string) => {
      try { await catalog()[method](root, 'reviewer', name); } catch (error) { return error as CompassError; }
      return assert.fail(`expected ${unknown}`);
    };
    const near = await rejection('run-x.ps1');
    assert.equal(near.code, unknown);
    assert.equal(near.details.name, 'run-x.ps1');
    assert.deepEqual(near.details.suggestions, ['run-a.ps1', 'run-b.ps1', 'run-c.ps1']);
    assert.match(near.message, /Did you mean: run-a\.ps1, run-b\.ps1, run-c\.ps1\?/);
    assert.deepEqual((await rejection('Other.txt')).details.suggestions, ['other.txt']);
    assert.deepEqual((await rejection('zzzz.bin')).details.suggestions, []);
    assert.deepEqual((await rejection('hidden.ps1')).details.suggestions, []);
    const absent = await temporary(t);
    await pack(absent);
    assert.deepEqual((await (async () => {
      try { await catalog()[method](absent, 'reviewer', 'run-a.ps1'); } catch (error) { return error as CompassError; }
      return assert.fail(`expected ${unknown}`);
    })()).details.suggestions, []);
  });

  test(`${kind} lookup validates the agent cheaply without reading its body`, async t => {
    const root = await temporary(t);
    const agent = await pack(root);
    await put(agent, dir, 'a.txt');
    const native = new NodeFileSystem();
    const guarded = override(native, { readFile: async value => {
      assert.ok(!value.endsWith('instructions.md'), 'agent body read'); return native.readFile(value); } });
    assert.ok((await catalog(guarded)[method](root, 'reviewer', 'a.txt')).path);
  });

  test(`${kind} case collisions are rejected`, async t => {
    const root = await temporary(t);
    const agent = await pack(root);
    await put(agent, dir, 'a.txt');
    const native = new NodeFileSystem();
    const fake = override(native, { readdir: async value => value.endsWith(dir) ? ['A.txt', 'a.txt'].map(name =>
      ({ name, isDirectory: () => false, isSymbolicLink: () => false })) : native.readdir(value) });
    await assert.rejects(catalog(fake)[method](root, 'reviewer', 'a.txt'), failure('case_collision'));
  });
}

test('resource and script directories are independent', async t => {
  const root = await temporary(t);
  const agent = await pack(root);
  await put(agent, 'resources', 'shared.txt');
  await assert.rejects(catalog().fetchScriptPath(root, 'reviewer', 'shared.txt'), failure('unknown_script'));
});

test('path tools return matching text/structured results and handle input failures', async t => {
  const root = await temporary(t);
  const agent = await pack(root);
  await put(agent, 'resources', 'r.txt');
  await put(agent, 'scripts', 's.ps1');
  const results = new ToolResultFactory(logger);
  const cases: Array<[{ execute(input: unknown): Promise<any> }, string, string]> = [
    [new FetchResourcePathTool(catalog(), results), 'resourceName', 'r.txt'],
    [new FetchScriptPathTool(catalog(), results), 'scriptName', 's.ps1'],
  ];
  for (const [tool, field, name] of cases) {
    const ok = await tool.execute({ projectRoot: root, agentName: 'reviewer', [field]: name });
    assert.deepEqual(JSON.parse(ok.content[0].text), ok.structuredContent);
    assert.equal(ok.structuredContent.name, name);
    assert.equal('isError' in ok, false);
    assert.equal((await tool.execute({ projectRoot: root, agentName: 'reviewer', [field]: 'nope' })).structuredContent.error.startsWith('unknown_'), true);
    assert.equal((await tool.execute({})).structuredContent.error, 'invalid_input');
    assert.equal((await tool.execute({ agentName: 'reviewer', [field]: name })).structuredContent.error, 'invalid_project_root');
    assert.equal((await tool.execute({ projectRoot: root, agentName: 'reviewer', [field]: name, extra: 1 })).structuredContent.error, 'invalid_input');
    assert.equal((await tool.execute({ projectRoot: root, agentName: 'reviewer', [field]: '../x' })).structuredContent.error, 'invalid_name');
  }
});
