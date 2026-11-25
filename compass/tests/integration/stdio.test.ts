import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { readFile, symlink } from 'node:fs/promises';
import * as path from 'node:path';
import { temporary, references } from '../helpers.ts';

const execute = promisify(execFile);
const packageRoot = fileURLToPath(new URL('../../', import.meta.url));

for (const linked of [false, true]) {
test(`${linked ? 'linked CLI' : 'compiled entry'} serves five tools, keeps stdout pure and survives tool errors`, { timeout: 30000 }, async t => {
  await execute(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'], { cwd: packageRoot });
  const imported = await execute(process.execPath, ['--input-type=module', '-e', "await import('./dist/main.js')"],
    { cwd: packageRoot, timeout: 5000 });
  assert.equal(imported.stdout, '');
  assert.equal(imported.stderr, '');

  let entry = path.join(packageRoot, 'dist/main.js');
  if (linked) {
    const root = await temporary(t);
    const linkedPackage = path.join(root, 'compass');
    await symlink(packageRoot, linkedPackage, process.platform === 'win32' ? 'junction' : 'dir');
    const manifest = JSON.parse(await readFile(path.join(linkedPackage, 'package.json'), 'utf8'));
    entry = path.join(linkedPackage, manifest.bin.compass);
    assert.match(await readFile(entry, 'utf8'), /^#!\/usr\/bin\/env node\r?\n/);
    if (process.platform !== 'win32') {
      const linkedBin = path.join(root, 'compass-bin');
      await symlink(entry, linkedBin);
      entry = linkedBin;
    }
  }
  const child = spawn(process.execPath, [entry, '--log-level', 'debug'], { cwd: packageRoot, stdio: ['pipe', 'pipe', 'pipe'] });
  t.after(() => { child.kill(); });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => { stderr += chunk; });
  const pending = new Map<number, { resolve(value: any): void; reject(error: Error): void }>();
  const messages: any[] = [];
  let framingError: unknown;
  const lines = createInterface({ input: child.stdout });
  lines.on('line', line => {
    try {
      const message = JSON.parse(line);
      assert.equal(message.jsonrpc, '2.0');
      messages.push(message);
      if (typeof message.id === 'number') {
        pending.get(message.id)?.resolve(message);
        pending.delete(message.id);
      }
    } catch (error) {
      framingError = error;
      for (const waiter of pending.values()) waiter.reject(new Error(`Invalid stdout: ${line}`));
    }
  });
  child.on('error', error => { for (const waiter of pending.values()) waiter.reject(error); });
  child.on('exit', code => { for (const waiter of pending.values()) waiter.reject(new Error(`Server exited ${code}: ${stderr}`)); });
  let id = 0;
  const request = (method: string, params: unknown = {}): Promise<any> => new Promise((resolve, reject) => {
    const requestId = ++id;
    pending.set(requestId, { resolve, reject });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: requestId, method, params }) + '\n');
  });
  const init = await request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'compass-test', version: '1.0.0' } });
  assert.deepEqual(init.result.serverInfo, { name: 'compass', version: '0.2.0' });
  assert.match(init.result.instructions, /list_agents[\s\S]*fetch_agent_instructions[\s\S]*fetch_skill_instructions[\s\S]*fetch_resource_path/);
  assert.ok(init.result.capabilities.tools);
  assert.equal(init.result.capabilities.resources, undefined);
  assert.equal(init.result.capabilities.prompts, undefined);
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  const discovered = await request('tools/list');
  assert.deepEqual(discovered.result.tools.map((tool: any) => tool.name).sort(), ['fetch_agent_instructions', 'fetch_resource_path', 'fetch_script_path', 'fetch_skill_instructions', 'list_agents']);
  for (const tool of discovered.result.tools) {
    assert.deepEqual(tool.annotations, { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
    assert.equal(tool.inputSchema.additionalProperties, false);
    assert.equal(tool.outputSchema.type, 'object');
  }
  const required = Object.fromEntries(discovered.result.tools.map((tool: any) => [tool.name, tool.inputSchema.required ?? []]));
  assert.deepEqual(required, { list_agents: [], fetch_agent_instructions: ['name'], fetch_skill_instructions: ['agentName', 'skillName'],
    fetch_resource_path: ['agentName', 'resourceName'], fetch_script_path: ['agentName', 'scriptName'] });
  const fixtureRoot = fileURLToPath(new URL('../fixtures/project', import.meta.url));
  const root = await temporary(t);
  await references(root, [path.join(fixtureRoot, '.compass')]);
  const call = async (name: string, args: object) => {
    const response = await request('tools/call', { name, arguments: args });
    assert.equal(response.error, undefined);
    const document = !response.result.isError && (name === 'fetch_agent_instructions' || name === 'fetch_skill_instructions');
    if (document) {
      const { instructions, ...metadata } = response.result.structuredContent;
      assert.deepEqual(response.result.content.map((item: any) => item.type), ['text', 'text']);
      assert.equal(response.result.content[0].text, instructions);
      assert.deepEqual(JSON.parse(response.result.content[1].text), metadata);
    } else {
      assert.equal(response.result.content.length, 1);
      assert.deepEqual(JSON.parse(response.result.content[0].text), response.result.structuredContent);
    }
    return response.result;
  };
  const missing = await call('list_agents', {});
  assert.equal(missing.isError, true);
  assert.equal(missing.structuredContent.error, 'invalid_project_root');
  const missingFetchRoot = await call('fetch_agent_instructions', { name: 'orchestrator' });
  assert.equal(missingFetchRoot.structuredContent.error, 'invalid_project_root');
  const list = await call('list_agents', { projectRoot: root });
  assert.equal('skills' in list.structuredContent.agents[0], false);
  const fetched = await call('fetch_agent_instructions', { projectRoot: root, name: list.structuredContent.agents[0].name });
  assert.equal(fetched.structuredContent.modelHint, 'grok');
  assert.ok(fetched.structuredContent.agentPath);
  assert.match(fetched.structuredContent.instructions, /Dispatch independent/);
  assert.deepEqual(fetched.structuredContent.skills, [{ name: 'dispatch', description: 'Dispatch independent tasks.' }]);
  assert.deepEqual(fetched.structuredContent.skillProblems, []);
  const skill = await call('fetch_skill_instructions', { projectRoot: root, agentName: 'orchestrator', skillName: 'dispatch' });
  assert.match(skill.structuredContent.instructions, /Assign independent tasks/);
  assert.equal(skill.structuredContent.compassPath, fetched.structuredContent.compassPath);
  const badSkill = await call('fetch_skill_instructions', { projectRoot: root, agentName: 'orchestrator', skillName: 'unknown' });
  assert.equal(badSkill.isError, true);
  assert.equal(badSkill.structuredContent.error, 'unknown_skill');
  const invalid = await call('fetch_agent_instructions', { projectRoot: root, name: '../escape' });
  assert.equal(invalid.isError, true);
  assert.equal(invalid.structuredContent.error, 'invalid_name');
  assert.equal((await call('list_agents', { projectRoot: root })).structuredContent.agents.length, 1);
  for (const [tool, args] of [['list_agents', { projectRoot: root, extra: 1 }], ['fetch_agent_instructions', { projectRoot: root }],
    ['fetch_skill_instructions', { projectRoot: root, agentName: 'orchestrator', skillName: 7 }],
    ['fetch_resource_path', { projectRoot: root, agentName: 'orchestrator' }], ['fetch_script_path', { projectRoot: 42, agentName: 'a', scriptName: 'b' }]] as const) {
    const rejected = await call(tool, args);
    assert.equal(rejected.isError, true, tool);
    assert.equal(rejected.structuredContent.error, 'invalid_input', tool);
    assert.ok(rejected.structuredContent.issues.length > 0, tool);
  }
  const misspelled = await call('fetch_agent_instructions', { projectRoot: root, name: 'orchestrater' });
  assert.equal(misspelled.structuredContent.error, 'unknown_agent');
  assert.deepEqual(misspelled.structuredContent.suggestions, ['orchestrator']);
  assert.equal('catalogProblems' in fetched.structuredContent, false);
  assert.equal('catalogProblems' in skill.structuredContent, false);
  const exit = once(child, 'exit');
  child.stdin.end();
  assert.deepEqual(await exit, [0, null]);
  assert.equal(framingError, undefined);
  assert.ok(messages.length >= 8);
  assert.match(stderr, /Resolved catalog/);
  assert.match(stderr, /Listed catalog/);
  assert.match(stderr, /Fetching pack/);
  assert.match(stderr, /invalid_project_root/);
  assert.equal(stderr.includes('Dispatch independent work and report the results.'), false);
  assert.equal(stderr.includes('Assign independent tasks'), false);
});
}
