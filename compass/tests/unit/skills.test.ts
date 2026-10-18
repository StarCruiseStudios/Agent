import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { CompassError } from '../../src/catalog/CompassError.ts';
import { NodeFileSystem } from '../../src/filesystem/NodeFileSystem.ts';
import { FetchSkillInstructionsTool } from '../../src/tools/FetchSkillInstructionsTool.ts';
import { ToolResultFactory } from '../../src/tools/ToolResultFactory.ts';
import { catalog, logger, override, pack, skill, temporary } from '../helpers.ts';

const failure = (code: string) => (error: unknown) => error instanceof CompassError && error.code === code;

test('skills are agent scoped, sorted, described only in details and refreshed on each call', async t => {
  const root = await temporary(t);
  const agent = await pack(root);
  const other = await pack(root, 'writer');
  const first = await skill(agent, 'zebra', 'First body');
  await skill(agent, 'alpha');
  await skill(other, 'zebra', 'Other body');
  const service = catalog();
  const details = await service.fetch(root, 'reviewer');
  assert.deepEqual(details.skills, [{ name: 'alpha', description: 'A skill.' }, { name: 'zebra', description: 'A skill.' }]);
  assert.deepEqual(details.skillProblems, []);
  assert.deepEqual(details.catalogProblems, []);
  assert.equal((await service.fetchSkill(root, 'reviewer', 'zebra')).instructions, 'First body');
  assert.equal((await service.fetchSkill(root, 'writer', 'zebra')).instructions, 'Other body');
  await fs.writeFile(path.join(first, 'SKILL.md'), '---\nname: zebra\ndescription: Updated\nextra: allowed\n---\nChanged');
  const fetched = await service.fetchSkill(root, 'reviewer', 'zebra');
  assert.equal(fetched.description, 'Updated');
  assert.equal(fetched.instructions, 'Changed');
  assert.equal(fetched.skillPath, await fs.realpath(first));
  assert.equal(fetched.agentName, 'reviewer');
  const native = new NodeFileSystem();
  const guarded = override(native, {
    readdir: async file => { assert.ok(!file.endsWith('skills')); return native.readdir(file); },
    readFile: async file => { assert.ok(!file.endsWith('SKILL.md')); return native.readFile(file); },
  });
  for (const summary of (await catalog(guarded).list(root)).agents) {
    assert.equal('skills' in summary, false);
    assert.equal('skillProblems' in summary, false);
  }
});

test('absent skills yield empty details and unknown_skill on fetch', async t => {
  const root = await temporary(t);
  await pack(root);
  assert.deepEqual((await catalog().fetch(root, 'reviewer')).skills, []);
  assert.deepEqual((await catalog().fetch(root, 'reviewer')).skillProblems, []);
  await assert.rejects(catalog().fetchSkill(root, 'reviewer', 'missing'), failure('unknown_skill'));
});

const malformed: Array<[string, string | Uint8Array]> = [
  ['invalid_metadata', 'No frontmatter'],
  ['invalid_metadata', '---\nname: broken\ndescription: [\n---\nBody'],
  ['invalid_metadata', '---\nname: broken\nname: duplicate\ndescription: text\n---\nBody'],
  ['invalid_metadata', '---\nname: broken\ndescription: " "\n---\nBody'],
  ['invalid_metadata', '---\nname: Bad\ndescription: text\n---\nBody'],
  ['name_mismatch', '---\nname: another\ndescription: text\n---\nBody'],
  ['empty_instructions', '---\nname: broken\ndescription: text\n---\n \t'],
  ['invalid_encoding', new Uint8Array([0xff])],
  ['instructions_too_large', Buffer.alloc(262145, 0xff)],
];
for (const [reason, body] of malformed) {
  test(`malformed skill isolated: ${reason}`, async t => {
    const root = await temporary(t);
    const agent = await pack(root);
    await skill(agent, 'good');
    const broken = await skill(agent, 'broken');
    await fs.writeFile(path.join(broken, 'SKILL.md'), body);
    const details = await catalog().fetch(root, 'reviewer');
    assert.deepEqual(details.skills.map(item => item.name), ['good']);
    assert.equal(details.skillProblems[0].reason, `malformed_skill:${reason}`);
    await assert.rejects(catalog().fetchSkill(root, 'reviewer', 'broken'), failure('malformed_skill'));
  });
}

test('BOM, CRLF and additional YAML fields work; exact size boundary is accepted', async t => {
  const root = await temporary(t);
  const directory = await skill(await pack(root), 'sample');
  const header = '\ufeff---\r\nname: sample\r\ndescription: |\r\n  Multiline description\r\nmetadata:\r\n  nested: true\r\n---\r\n';
  const body = ' '.repeat(10) + 'é' + 'a'.repeat(262144 - Buffer.byteLength(header) - 12);
  await fs.writeFile(path.join(directory, 'SKILL.md'), header + body);
  const result = await catalog().fetchSkill(root, 'reviewer', 'sample');
  assert.equal(result.description, 'Multiline description\n');
  assert.equal(result.instructions, body);
});

test('invalid agent and skill names are rejected before filesystem access', async () => {
  const denied = override(new NodeFileSystem(), { realpath: async () => { assert.fail('disk accessed'); } });
  for (const [agent, name] of [['../bad', 'valid'], ['valid', '../bad'], ['valid', 'Bad']]) {
    await assert.rejects(catalog(denied).fetchSkill(undefined, agent, name), failure('invalid_name'));
  }
});

test('skills directory, skill directory and file links cannot escape the owning agent', async t => {
  for (const level of ['skills', 'skill', 'file']) {
    const root = await temporary(t);
    const agent = await pack(root);
    const directory = await skill(agent, 'sample');
    const external = path.join(root, 'external');
    await fs.mkdir(external);
    const native = new NodeFileSystem();
    const target = level === 'skills' ? path.join(agent, 'skills') : level === 'skill' ? directory : path.join(directory, 'SKILL.md');
    const fake = override(native, { realpath: async value => value === target ? external : native.realpath(value) });
    const service = catalog(fake);
    await assert.rejects(service.fetchSkill(root, 'reviewer', 'sample'), failure('path_escape'));
    assert.equal((await service.fetch(root, 'reviewer')).skillProblems[0].reason, 'path_escape');
  }
});

test('missing files and unreadable skill directories remain isolated; case collisions precede lookup', async t => {
  const root = await temporary(t);
  const agent = await pack(root);
  const directory = await skill(agent, 'sample');
  await fs.unlink(path.join(directory, 'SKILL.md'));
  await assert.rejects(catalog().fetchSkill(root, 'reviewer', 'sample'), failure('malformed_skill'));
  assert.equal((await catalog().fetch(root, 'reviewer')).skillProblems[0].reason, 'malformed_skill:unreadable');
  const native = new NodeFileSystem();
  const fake = override(native, { readdir: async value => value === path.dirname(directory) ? ['Sample', 'sample'].map(name =>
    ({ name, isDirectory: () => true, isSymbolicLink: () => false })) : native.readdir(value) });
  assert.deepEqual((await catalog(fake).fetch(root, 'reviewer')).skillProblems.map(item => item.reason), ['case_collision', 'case_collision']);
  await assert.rejects(catalog(fake).fetchSkill(root, 'reviewer', 'sample'), failure('case_collision'));
  const denied = override(native, { readdir: async value => { if (value === path.dirname(directory)) throw new Error('denied'); return native.readdir(value); } });
  assert.equal((await catalog(denied).fetch(root, 'reviewer')).skillProblems[0].reason, 'malformed_skill:unreadable');
});

test('skill tool has matching text/structured results and handles input failures', async t => {
  const root = await temporary(t);
  await skill(await pack(root), 'sample');
  const tool = new FetchSkillInstructionsTool(catalog(), new ToolResultFactory(logger));
  for (const input of [
    { projectRoot: root, agentName: 'reviewer', skillName: 'sample' },
    { projectRoot: root, agentName: 'reviewer', skillName: 'unknown' },
    {}, { agentName: 'reviewer', skillName: 'sample' },
    { projectRoot: root, agentName: 'reviewer', skillName: '../bad' },
    { projectRoot: root, agentName: 'reviewer', skillName: 'sample', extra: true },
  ]) {
    const result = await tool.execute(input);
    assert.deepEqual(JSON.parse(result.content[0].text), result.structuredContent);
    if ('isError' in result) assert.deepEqual(Object.keys(result.structuredContent).sort(), ['error', 'message']);
  }
  assert.equal((await tool.execute({})).structuredContent.error, 'invalid_name');
  assert.equal((await tool.execute({ agentName: 'reviewer', skillName: 'sample' })).structuredContent.error, 'invalid_project_root');
});
