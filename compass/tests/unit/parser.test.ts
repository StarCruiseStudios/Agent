import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { AgentMetadata } from '../../src/catalog/AgentMetadata.ts';
import { CompassError } from '../../src/catalog/CompassError.ts';
import { NodeFileSystem } from '../../src/filesystem/NodeFileSystem.ts';
import { catalog, metadata, override, pack, temporary } from '../helpers.ts';

const native = new NodeFileSystem();
// `listed` marks failures that list_agents detects without reading the instruction body.
const scenarios: Array<[string, boolean, (directory: string) => Promise<unknown>]> = [
  ['missing_metadata', true, directory => fs.unlink(path.join(directory, 'agent.json'))],
  ['invalid_encoding', true, directory => fs.writeFile(path.join(directory, 'agent.json'), new Uint8Array([0xc3, 0x28]))],
  ['invalid_metadata', true, directory => fs.writeFile(path.join(directory, 'agent.json'), '{')],
  ['name_mismatch', true, directory => fs.writeFile(path.join(directory, 'agent.json'), JSON.stringify(metadata('another')))],
  ['missing_instructions', true, directory => fs.unlink(path.join(directory, 'instructions.md'))],
  ['instructions_too_large', true, directory => fs.writeFile(path.join(directory, 'instructions.md'), Buffer.alloc(262145, 0xff))],
  ['invalid_encoding', false, directory => fs.writeFile(path.join(directory, 'instructions.md'), new Uint8Array([0xff]))],
  ['empty_instructions', false, directory => fs.writeFile(path.join(directory, 'instructions.md'), ' \r\n\t')],
  ['empty_instructions', false, directory => fs.writeFile(path.join(directory, 'instructions.md'), '')],
];

for (const [token, listed, mutate] of scenarios) {
  test(`malformed pack: ${token} (fetch${listed ? ' and list' : ' only'})`, async t => {
    const root = await temporary(t);
    await mutate(await pack(root));
    await assert.rejects(catalog().fetch(root, 'reviewer'), error =>
      error instanceof CompassError && error.code === 'malformed_pack' && error.reason === token && error.message.includes(`${token}.`));
    const list = await catalog().list(root);
    if (listed) {
      assert.deepEqual(list.agents, []);
      assert.equal(list.problems[0].reason, `malformed_pack:${token}`);
    } else {
      assert.deepEqual(list.agents.map(agent => agent.name), ['reviewer']);
      assert.deepEqual(list.problems, []);
    }
  });
}

test('list never reads instruction bodies and checks their size by byte length at the exact limit', async t => {
  const root = await temporary(t);
  const directory = await pack(root);
  const guarded = override(native, { readFile: async file => {
    assert.ok(!file.endsWith('instructions.md'), 'list read the body'); return native.readFile(file); } });
  await fs.writeFile(path.join(directory, 'instructions.md'), Buffer.alloc(262144, 0x61));
  assert.deepEqual((await catalog(guarded).list(root)).agents.map(agent => agent.name), ['reviewer']);
  await fs.writeFile(path.join(directory, 'instructions.md'), 'é'.repeat(131073));
  assert.equal((await catalog(guarded).list(root)).problems[0].reason, 'malformed_pack:instructions_too_large');
});

test('list reports an instructions directory, an unstattable body and a dangling body link as unreadable', async t => {
  const root = await temporary(t);
  const directory = await pack(root);
  await fs.unlink(path.join(directory, 'instructions.md'));
  await fs.mkdir(path.join(directory, 'instructions.md'));
  assert.equal((await catalog().list(root)).problems[0].reason, 'malformed_pack:unreadable');
  await fs.rmdir(path.join(directory, 'instructions.md'));
  await fs.writeFile(path.join(directory, 'instructions.md'), 'Body');
  const file = path.join(directory, 'instructions.md');
  for (const code of ['EACCES', 'ENOENT']) {
    const fake = override(native, { stat: async value => {
      if (value === file) throw Object.assign(new Error('stat failed'), { code });
      return native.stat(value);
    } });
    assert.equal((await catalog(fake).list(root)).problems[0].reason, 'malformed_pack:unreadable', code);
  }
});

test('unreadable required file and directory failure are malformed, not missing', async t => {
  const root = await temporary(t);
  const directory = await pack(root);
  const denied = override(native, { readFile: async () => { throw Object.assign(new Error('denied'), { code: 'EACCES' }); } });
  assert.equal((await catalog(denied).list(root)).problems[0].reason, 'malformed_pack:unreadable');
  const gone = override(native, {
    readFile: async () => { throw Object.assign(new Error('gone'), { code: 'ENOENT' }); },
    readdir: async value => {
      if (value === directory) throw Object.assign(new Error('gone'), { code: 'ENOENT' });
      return native.readdir(value);
    },
  });
  assert.equal((await catalog(gone).list(root)).problems[0].reason, 'malformed_pack:unreadable');
});

test('dangling required-file symlink is unreadable', async t => {
  const root = await temporary(t);
  const directory = await pack(root);
  const fake = override(native, { readFile: async value => {
    if (value === path.join(directory, 'agent.json')) throw Object.assign(new Error('target missing'), { code: 'ENOENT' });
    return native.readFile(value);
  } });
  assert.equal((await catalog(fake).list(root)).problems[0].reason, 'malformed_pack:unreadable');
});

test('UTF-8 BOMs are stripped and exact byte limit is accepted without trimming body', async t => {
  const root = await temporary(t);
  const directory = await pack(root);
  await fs.writeFile(path.join(directory, 'agent.json'), '\ufeff' + JSON.stringify(metadata()));
  const body = ' \nUnicode: 🌍\n ';
  await fs.writeFile(path.join(directory, 'instructions.md'), '\ufeff' + body);
  assert.equal((await catalog().fetch(root, 'reviewer')).instructions, body);
  await fs.writeFile(path.join(directory, 'instructions.md'), Buffer.alloc(262144, 0x61));
  assert.equal((await catalog().fetch(root, 'reviewer')).instructions.length, 262144);
  await fs.writeFile(path.join(directory, 'instructions.md'), 'é'.repeat(131073));
  await assert.rejects(catalog().fetch(root, 'reviewer'), /instructions_too_large/);
});

test('metadata failures precede body failures, and size precedes body decoding', async t => {
  const root = await temporary(t);
  const directory = await pack(root);
  await fs.writeFile(path.join(directory, 'agent.json'), JSON.stringify(metadata('different')));
  await fs.unlink(path.join(directory, 'instructions.md'));
  await assert.rejects(catalog().fetch(root, 'reviewer'), /name_mismatch/);
  await fs.writeFile(path.join(directory, 'agent.json'), new Uint8Array([0xff]));
  await assert.rejects(catalog().fetch(root, 'reviewer'), /invalid_encoding/);
});

const invalidMetadata: unknown[] = [
  null, [], true, 'text', {},
  { ...metadata(), unknown: true },
  { ...metadata(), name: 'Bad' },
  { ...metadata(), name: 'a\n' },
  { ...metadata(), name: 'a'.repeat(65) },
  { ...metadata(), description: '' },
  { ...metadata(), description: ' '.repeat(3) },
  { ...metadata(), description: 'x'.repeat(501) },
  { ...metadata(), whenToUse: '' },
  { ...metadata(), whenToUse: 'x'.repeat(501) },
  { ...metadata(), modelHint: null },
  { ...metadata(), modelHint: '' },
  { ...metadata(), modelHint: 'x'.repeat(501) },
  { ...metadata(), tools: ['same', 'same'] },
  { ...metadata(), tools: [''] },
  { ...metadata(), tools: ['x'.repeat(65)] },
  { ...metadata(), tools: Array.from({ length: 33 }, (_, i) => `tool-${i}`) },
  { ...metadata(), tools: [1] },
  { ...metadata(), tools: null },
];

test('metadata schema is strict and enforces all field constraints', () => {
  for (const value of invalidMetadata) assert.equal(AgentMetadata.safeParse(value).success, false, JSON.stringify(value));
  const { modelHint: _omitted, ...withoutModel } = metadata();
  assert.equal(AgentMetadata.safeParse(withoutModel).success, false);
  const valid = { name: 'a'.repeat(64), description: 'd'.repeat(500), whenToUse: 'w'.repeat(500),
    modelHint: 'm'.repeat(500), tools: Array.from({ length: 32 }, (_, i) => String(i).padStart(64, 't')) };
  assert.equal(AgentMetadata.safeParse(valid).success, true);
  assert.deepEqual(AgentMetadata.parse(metadata()).tools, []);
});

test('invalid metadata schema is surfaced by catalog parsing', async t => {
  const root = await temporary(t);
  const directory = await pack(root);
  for (const json of [null, [], { ...metadata(), extra: 'unknown' }, { ...metadata(), tools: ['dup', 'dup'] }]) {
    await fs.writeFile(path.join(directory, 'agent.json'), JSON.stringify(json));
    await assert.rejects(catalog().fetch(root, 'reviewer'), /invalid_metadata/);
  }
});
