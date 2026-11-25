import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { CompassError } from '../../src/catalog/CompassError.ts';
import { ListAgentsTool } from '../../src/tools/ListAgentsTool.ts';
import { FetchAgentInstructionsTool } from '../../src/tools/FetchAgentInstructionsTool.ts';
import { FetchSkillInstructionsTool } from '../../src/tools/FetchSkillInstructionsTool.ts';
import { FetchResourcePathTool } from '../../src/tools/FetchResourcePathTool.ts';
import { FetchScriptPathTool } from '../../src/tools/FetchScriptPathTool.ts';
import { ToolResultFactory } from '../../src/tools/ToolResultFactory.ts';
import { catalog, logger } from '../helpers.ts';

const root = fileURLToPath(new URL('../fixtures/project', import.meta.url));
const results = new ToolResultFactory(logger);
const tools = {
  list: new ListAgentsTool(catalog(), results),
  fetch: new FetchAgentInstructionsTool(catalog(), results),
  skill: new FetchSkillInstructionsTool(catalog(), results),
  resource: new FetchResourcePathTool(catalog(), results),
  script: new FetchScriptPathTool(catalog(), results),
};

/** Error results carry one JSON text item equal to structuredContent, with error and message first-class. */
function assertError(result: any, code: string) {
  assert.equal(result.isError, true);
  assert.equal(result.content.length, 1);
  assert.deepEqual(JSON.parse(result.content[0].text), result.structuredContent);
  assert.equal(result.structuredContent.error, code);
  assert.equal(typeof result.structuredContent.message, 'string');
}

test('list and path results are one JSON text item equal to structuredContent', async () => {
  for (const result of [await tools.list.execute({ projectRoot: root })] as any[]) {
    assert.equal('isError' in result, false);
    assert.equal(result.content.length, 1);
    assert.deepEqual(JSON.parse(result.content[0].text), result.structuredContent);
  }
});

test('agent and skill fetches return raw Markdown, then metadata JSON; structuredContent holds both', async () => {
  for (const result of [await tools.fetch.execute({ projectRoot: root, name: 'orchestrator' }),
    await tools.skill.execute({ projectRoot: root, agentName: 'orchestrator', skillName: 'dispatch' })] as any[]) {
    assert.equal('isError' in result, false);
    const { instructions, ...metadata } = result.structuredContent;
    assert.equal(typeof instructions, 'string');
    assert.deepEqual(result.content, [{ type: 'text', text: instructions }, { type: 'text', text: JSON.stringify(metadata) }]);
    assert.equal(result.content[0].text.includes('\\n'), false);
  }
});

const malformed: Array<[keyof typeof tools, unknown]> = [
  ['list', { projectRoot: root, surprise: true }],
  ['list', { projectRoot: 42 }],
  ['list', 'not an object'],
  ['fetch', {}],
  ['fetch', { projectRoot: root }],
  ['fetch', { projectRoot: root, name: 7 }],
  ['fetch', { projectRoot: root, name: 'orchestrator', surprise: true }],
  ['skill', {}],
  ['skill', { projectRoot: root, agentName: 'orchestrator' }],
  ['skill', { projectRoot: root, skillName: 'dispatch' }],
  ['skill', { projectRoot: root, agentName: 'orchestrator', skillName: 'dispatch', extra: true }],
  ['resource', { projectRoot: root, agentName: 'orchestrator' }],
  ['resource', { projectRoot: root, agentName: 'orchestrator', resourceName: 'r', extra: 1 }],
  ['script', { projectRoot: root, agentName: 'orchestrator' }],
  ['script', { projectRoot: root, agentName: 'orchestrator', scriptName: ['s'] }],
];
for (const [tool, input] of malformed) {
  test(`${tool} rejects ${JSON.stringify(input)} as invalid_input with issues`, async () => {
    const result: any = await tools[tool].execute(input);
    assertError(result, 'invalid_input');
    assert.ok(result.structuredContent.issues.length > 0);
    for (const issue of result.structuredContent.issues) {
      assert.equal(typeof issue.path, 'string');
      assert.equal(typeof issue.message, 'string');
    }
  });
}

test('an absent arguments object is treated as empty input', async () => {
  assertError(await tools.list.execute(undefined), 'invalid_project_root');
  assertError(await tools.fetch.execute(undefined), 'invalid_input');
});

test('schema-valid input reaches the catalog and keeps catalog error codes', async () => {
  assertError(await tools.list.execute({}), 'invalid_project_root');
  assertError(await tools.fetch.execute({ name: 'orchestrator' }), 'invalid_project_root');
  assertError(await tools.fetch.execute({ projectRoot: 'relative', name: 'orchestrator' }), 'invalid_project_root');
  assertError(await tools.fetch.execute({ projectRoot: root, name: '..' }), 'invalid_name');
  assertError(await tools.fetch.execute({ projectRoot: root, name: 'unknown' }), 'unknown_agent');
  assertError(await tools.skill.execute({ projectRoot: root, agentName: 'orchestrator', skillName: 'unknown' }), 'unknown_skill');
  assertError(await tools.resource.execute({ projectRoot: root, agentName: 'orchestrator', resourceName: 'x.md' }), 'unknown_resource');
  assertError(await tools.script.execute({ projectRoot: root, agentName: 'orchestrator', scriptName: 'x.ps1' }), 'unknown_script');
});

test('every tool advertises its strict JSON Schema but defers validation to the handler', async () => {
  for (const tool of Object.values(tools)) {
    const schema = tool.advertisedSchema()['~standard'];
    const advertised = schema.jsonSchema.input({ target: 'draft-2020-12' });
    assert.deepEqual(advertised, tool.input['~standard'].jsonSchema.input({ target: 'draft-2020-12' }));
    assert.equal(advertised.additionalProperties, false);
    for (const value of [{ surprise: true }, 42, null, 'text']) {
      const outcome = await schema.validate(value);
      assert.deepEqual(outcome, { value });
    }
  }
});

test('error details are returned beside error and message', () => {
  const result = results.failure(new CompassError('unknown_agent', 'No agent.', { details: { name: 'x', suggestions: ['y'] } }));
  assert.deepEqual(result.structuredContent, { error: 'unknown_agent', message: 'No agent.', name: 'x', suggestions: ['y'] });
  assert.deepEqual(JSON.parse(result.content[0].text as string), result.structuredContent);
});

test('caller and catalog errors log at warn; unexpected errors are internal_error, logged with a stack and not exposed', () => {
  const entries: Array<[string, Record<string, unknown> | undefined]> = [];
  const recording = new ToolResultFactory({ ...logger,
    warn(_message, fields) { entries.push(['warn', fields]); },
    error(_message, fields) { entries.push(['error', fields]); } });
  for (const code of ['invalid_input', 'unknown_agent', 'malformed_pack', 'catalog_unreadable'] as const) {
    recording.failure(new CompassError(code, 'message'));
  }
  assert.deepEqual(entries.map(([level, fields]) => [level, fields?.code]),
    [['warn', 'invalid_input'], ['warn', 'unknown_agent'], ['warn', 'malformed_pack'], ['warn', 'catalog_unreadable']]);
  entries.length = 0;
  for (const thrown of [new Error('private contents'), 'private string']) {
    const result = recording.failure(thrown);
    assert.equal(result.isError, true);
    assert.equal(result.structuredContent.error, 'internal_error');
    assert.equal(JSON.stringify(result).includes('private'), false);
  }
  assert.deepEqual(entries.map(([level, fields]) => [level, fields?.code]), [['error', 'internal_error'], ['error', 'internal_error']]);
  assert.match(String(entries[0]![1]?.stack), /private contents/);
  assert.equal(entries[1]![1]?.error, 'private string');
});
