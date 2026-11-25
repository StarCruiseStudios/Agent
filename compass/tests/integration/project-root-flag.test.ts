import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import * as path from 'node:path';

const execute = promisify(execFile);
const packageRoot = fileURLToPath(new URL('../../', import.meta.url));
const fixtureRoot = fileURLToPath(new URL('../fixtures/project', import.meta.url));
const entry = path.join(packageRoot, 'dist/main.js');

async function build() {
  await execute(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'], { cwd: packageRoot });
}

async function serve(t: any, args: string[], cwd = packageRoot) {
  const child = spawn(process.execPath, [entry, ...args], { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
  t.after(() => { child.kill(); });
  const stderr = { text: '' };
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => { stderr.text += chunk; });
  const pending = new Map<number, (value: any) => void>();
  createInterface({ input: child.stdout }).on('line', line => {
    const message = JSON.parse(line);
    pending.get(message.id)?.(message);
  });
  let id = 0;
  const request = (method: string, params: unknown = {}) => new Promise<any>(resolve => {
    const requestId = ++id;
    pending.set(requestId, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: requestId, method, params }) + '\n');
  });
  await request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'compass-test', version: '1.0.0' } });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  const call = async (name: string, args: object) => (await request('tools/call', { name, arguments: args })).result;
  return { child, call, stderr };
}

for (const form of ['separate', 'equals', 'relative'] as const) {
  test(`--project-root (${form}) lets all tools run without projectRoot`, { timeout: 30000 }, async t => {
    await build();
    const args = form === 'separate' ? ['--project-root', fixtureRoot]
      : form === 'equals' ? [`--project-root=${fixtureRoot}`] : ['--project-root', 'project'];
    const cwd = form === 'relative' ? path.dirname(fixtureRoot) : packageRoot;
    const { child, call } = await serve(t, args, cwd);
    const list = await call('list_agents', {});
    assert.notEqual(list.isError, true);
    assert.ok(list.structuredContent.agents.length > 0);
    const name = list.structuredContent.agents[0].name;
    const fetched = await call('fetch_agent_instructions', { name });
    assert.notEqual(fetched.isError, true);
    assert.ok(fetched.structuredContent.instructions);
    const skills = fetched.structuredContent.skills;
    assert.ok(skills.length > 0, 'fixture agent has a skill');
    const skill = await call('fetch_skill_instructions', { agentName: name, skillName: skills[0].name });
    assert.notEqual(skill.isError, true);
    assert.ok(skill.structuredContent.instructions);
    const bad = await call('list_agents', { projectRoot: 'relative' });
    assert.equal(bad.structuredContent.error, 'invalid_project_root');
    const exit = once(child, 'exit');
    child.stdin.end();
    assert.deepEqual(await exit, [0, null]);
  });
}

test('invalid launch path fails fast on stderr with non-zero exit and empty stdout', { timeout: 30000 }, async () => {
  await build();
  await assert.rejects(execute(process.execPath, [entry, '--project-root', path.join(fixtureRoot, 'does-not-exist')], { cwd: packageRoot, timeout: 10000 }),
    (error: any) => {
      assert.equal(error.code, 1);
      assert.equal(error.stdout, '');
      assert.match(error.stderr, /--project-root/);
      return true;
    });
});

test('usage errors exit non-zero on stderr', { timeout: 30000 }, async () => {
  await build();
  for (const args of [['--bogus'], ['--project-root'], ['--project-root', 'a', '--project-root', 'b'],
    ['--log-level'], ['--log-level', 'verbose'], ['--log-level=trace'], ['--log-level', 'info', '--log-level=warn']]) {
    await assert.rejects(execute(process.execPath, [entry, ...args], { cwd: packageRoot, timeout: 10000 }), (error: any) => {
      assert.equal(error.code, 2);
      assert.equal(error.stdout, '');
      assert.match(error.stderr, /Usage: compass/);
      return true;
    });
  }
});

const levels = [
  ['debug', { debug: true, info: true, warn: true }],
  ['info', { debug: false, info: true, warn: true }],
  ['warn', { debug: false, info: false, warn: true }],
  ['error', { debug: false, info: false, warn: false }],
  [undefined, { debug: false, info: true, warn: true }],
] as const;
for (const [level, shown] of levels) {
  test(`--log-level ${level ?? '(default)'} filters stderr diagnostics`, { timeout: 30000 }, async t => {
    await build();
    const { child, call, stderr } = await serve(t, ['--project-root', fixtureRoot, ...(level ? ['--log-level', level] : [])]);
    await call('list_agents', {});
    await call('fetch_agent_instructions', { name: 'missing' });
    const exit = once(child, 'exit');
    child.stdin.end();
    await exit;
    assert.equal(/Resolved catalog/.test(stderr.text), shown.debug, 'debug');
    assert.equal(/Listed catalog/.test(stderr.text), shown.info, 'info');
    assert.equal(/Tool call rejected/.test(stderr.text), shown.warn, 'warn');
    assert.equal(/"logLevelName":"ERROR"/.test(stderr.text), false, 'caller errors never log at error level');
  });
}
