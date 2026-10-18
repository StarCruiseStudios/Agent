import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { catalog, pack, references, skill, temporary, override } from '../helpers.ts';
import { NodeFileSystem } from '../../src/filesystem/NodeFileSystem.ts';
import { CompassError } from '../../src/catalog/CompassError.ts';

test('recursive relative and absolute references use depth first precedence without merging skills', async t => {
  const root = await temporary(t);
  const first = path.join(root, 'first');
  const deep = path.join(root, 'deep');
  const last = path.join(root, 'last');
  await skill(await pack(root, 'local'), 'local-skill');
  await skill(await pack(first, 'local'), 'external-skill');
  await skill(await pack(deep, 'shared'), 'deep-skill', 'Deep instructions');
  await skill(await pack(last, 'shared'), 'last-skill');
  await pack(last, 'unique');
  await references(root, ['../first/.compass', path.join(last, '.compass')]);
  await references(first, ['../../deep/.compass']);
  const service = catalog();
  const list = await service.list(root);
  assert.deepEqual(list.agents.map(item => item.name), ['local', 'shared', 'unique']);
  assert.deepEqual(list.problems, []);
  assert.equal(list.compassPath, path.join(root, '.compass'));
  assert.equal(list.found, true);
  assert.deepEqual((await service.fetch(root, 'local')).skills.map(item => item.name), ['local-skill']);
  const fetched = await service.fetch(root, 'shared');
  assert.equal(fetched.projectRoot, root);
  assert.equal(fetched.compassPath, await fs.realpath(path.join(deep, '.compass')));
  assert.deepEqual(fetched.skills.map(item => item.name), ['deep-skill']);
  assert.equal((await service.fetchSkill(root, 'shared', 'deep-skill')).instructions, 'Deep instructions');
  await assert.rejects(service.fetchSkill(root, 'shared', 'last-skill'), (error: unknown) => error instanceof CompassError && error.code === 'unknown_skill');
  await references(root, [path.join(last, '.compass'), '../first/.compass']);
  assert.deepEqual((await service.fetch(root, 'shared')).skills.map(item => item.name), ['last-skill']);
});

test('malformed first definition never falls back to a later valid agent', async t => {
  const root = await temporary(t);
  const other = path.join(root, 'other');
  const local = await pack(root);
  await fs.unlink(path.join(local, 'instructions.md'));
  await pack(other);
  await references(root, ['../other/.compass']);
  const list = await catalog().list(root);
  assert.deepEqual(list.agents, []);
  assert.equal(list.problems[0].reason, 'malformed_pack:missing_instructions');
  await assert.rejects(catalog().fetch(root, 'reviewer'), /missing_instructions/);
});

test('diamonds, duplicate paths and directory aliases load once without false cycles', async t => {
  const root = await temporary(t);
  const left = path.join(root, 'left');
  const right = path.join(root, 'right');
  const shared = path.join(root, 'shared');
  await pack(shared, 'shared');
  await references(left, ['../../shared/.compass']);
  await references(right, ['../../shared/.compass']);
  await references(root, ['../left/.compass', '../right/.compass', '../shared/.compass', '../shared/.compass']);
  await fs.symlink(path.join(shared, '.compass'), path.join(root, 'alias'), process.platform === 'win32' ? 'junction' : 'dir');
  await references(right, ['../../shared/.compass', '../../alias']);
  const result = await catalog().list(root);
  assert.deepEqual(result.agents.map(item => item.name), ['shared']);
  assert.deepEqual(result.problems, []);
});

test('self loops and multi-directory loops report chains and retain all reachable agents', async t => {
  const root = await temporary(t);
  const child = path.join(root, 'child');
  await skill(await pack(root, 'local'));
  await pack(child, 'remote');
  await references(root, ['.', '../child/.compass']);
  await references(child, ['../../.compass']);
  const result = await catalog().list(root);
  assert.deepEqual(result.agents.map(item => item.name), ['local', 'remote']);
  assert.deepEqual(result.problems.map(item => item.reason), ['catalog_cycle', 'catalog_cycle']);
  assert.deepEqual(result.problems[0].chain, [path.join(root, '.compass'), path.join(root, '.compass')]);
  assert.deepEqual(result.problems[1].chain, [path.join(root, '.compass'), path.join(child, '.compass'), path.join(root, '.compass')]);
  assert.deepEqual((await catalog().fetch(root, 'local')).catalogProblems, result.problems);
  assert.deepEqual((await catalog().fetchSkill(root, 'local', 'sample')).catalogProblems, result.problems);
});

test('missing references, unreadable directories and invalid configs preserve other branches', async t => {
  const root = await temporary(t);
  const bad = path.join(root, 'bad');
  const good = path.join(root, 'good');
  await pack(root, 'local');
  await pack(bad, 'bad-config-agent');
  await pack(good, 'good-agent');
  await fs.writeFile(path.join(root, 'file'), 'not a directory');
  await fs.writeFile(path.join(bad, '.compass', 'config.json'), '{');
  await references(root, ['../missing', '../file', '../bad/.compass', '../good/.compass']);
  const result = await catalog().list(root);
  assert.deepEqual(result.agents.map(item => item.name), ['bad-config-agent', 'good-agent', 'local']);
  assert.deepEqual(result.problems.map(item => item.reason), ['catalog_unreadable', 'catalog_unreadable', 'invalid_config']);
  for (const config of ['{', '{"directories":[""]}', '{"directories":[42]}', '{"directories":[],"extra":true}']) {
    await fs.writeFile(path.join(root, '.compass', 'config.json'), config);
    const invalid = await catalog().list(root);
    assert.deepEqual(invalid.agents.map(item => item.name), ['local']);
    assert.equal(invalid.problems[0].reason, 'invalid_config');
  }
  const native = new NodeFileSystem();
  const denied = override(native, { readFile: async value => {
    if (value.endsWith('config.json')) throw new Error('denied');
    return native.readFile(value);
  } });
  assert.equal((await catalog(denied).list(root)).problems[0].reason, 'invalid_config');
});

test('referenced catalogs retain local case collision checks', async t => {
  const root = await temporary(t);
  const remote = path.join(root, 'remote', '.compass');
  await fs.mkdir(remote, { recursive: true });
  await references(root, [remote]);
  const native = new NodeFileSystem();
  const fake = override(native, { readdir: async value => value === remote ? ['Reviewer', 'reviewer'].map(name =>
    ({ name, isDirectory: () => true, isSymbolicLink: () => false })) : native.readdir(value) });
  assert.deepEqual((await catalog(fake).list(root)).problems.map(item => item.reason), ['case_collision', 'case_collision']);
  await assert.rejects(catalog(fake).fetch(root, 'reviewer'), (error: unknown) => error instanceof CompassError && error.code === 'case_collision');
});

test('unreadable reference branches are reported without suppressing healthy branches', async t => {
  const root = await temporary(t);
  const denied = path.join(root, 'denied', '.compass');
  await pack(root, 'local');
  await pack(path.join(root, 'healthy'), 'healthy');
  await references(root, [denied, '../healthy/.compass']);
  const native = new NodeFileSystem();
  const fake = override(native, { readdir: async value => {
    if (value === denied) throw Object.assign(new Error('denied'), { code: 'EACCES' });
    return native.readdir(value);
  } });
  const result = await catalog(fake).list(root);
  assert.deepEqual(result.agents.map(item => item.name), ['healthy', 'local']);
  assert.deepEqual(result.problems, [{ name: '.compass', path: denied, reason: 'catalog_unreadable' }]);
  await fs.writeFile(path.join(root, '.compass', 'config.json'), new Uint8Array([0xff]));
  assert.equal((await catalog().list(root)).problems[0].reason, 'invalid_config');
});

test('Windows canonical path case differences detect cycles and deduplicate shared catalogs', { skip: process.platform !== 'win32' }, async t => {
  const root = await temporary(t);
  const remote = path.join(root, 'remote');
  await pack(root, 'local');
  await pack(remote, 'remote');
  await references(root, ['.', '../remote/.compass', '../remote/.compass']);
  const native = new NodeFileSystem();
  const counts = new Map<string, number>();
  const fake = override(native, { realpath: async value => {
    const real = await native.realpath(value);
    const count = (counts.get(real) ?? 0) + 1;
    counts.set(real, count);
    return count > 1 && value.endsWith('.compass') ? real.toUpperCase() : real;
  } });
  const result = await catalog(fake).list(root);
  assert.deepEqual(result.agents.map(item => item.name), ['local', 'remote']);
  assert.deepEqual(result.problems.map(item => item.reason), ['catalog_cycle']);
});

test('environment references work recursively, preserve loop detection and refresh on each call', async t => {
  const root = await temporary(t);
  const remote = path.join(root, 'remote');
  const replacement = path.join(root, 'replacement');
  const values = {
    COMPASS_TEST_REFERENCE_ROOT: remote,
    COMPASS_TEST_REFERENCE_PROJECT: root,
    COMPASS_TEST_REFERENCE_MISSING: undefined,
  };
  for (const [name, value] of Object.entries(values)) {
    const previous = process.env[name];
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
    t.after(() => { if (previous === undefined) delete process.env[name]; else process.env[name] = previous; });
  }
  await pack(root, 'local');
  await skill(await pack(remote, 'remote'));
  await pack(replacement, 'replacement');
  await references(root, ['${COMPASS_TEST_REFERENCE_MISSING}/.compass', '${COMPASS_TEST_REFERENCE_ROOT}/.compass']);
  await references(remote, ['%COMPASS_TEST_REFERENCE_PROJECT%/.compass']);
  const service = catalog();
  const result = await service.list(root);
  assert.deepEqual(result.agents.map(item => item.name), ['local', 'remote']);
  assert.deepEqual(result.problems.map(item => item.reason), ['invalid_reference', 'catalog_cycle']);
  assert.equal((await service.fetchSkill(root, 'remote', 'sample')).instructions, 'Skill instructions.');
  process.env.COMPASS_TEST_REFERENCE_ROOT = replacement;
  const updated = await service.list(root);
  assert.deepEqual(updated.agents.map(item => item.name), ['local', 'replacement']);
  assert.deepEqual(updated.problems.map(item => item.reason), ['invalid_reference']);
});
