import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { ListAgentsTool } from '../../src/tools/ListAgentsTool.ts';
import { FetchAgentInstructionsTool } from '../../src/tools/FetchAgentInstructionsTool.ts';
import { ToolResultFactory } from '../../src/tools/ToolResultFactory.ts';
import { catalog, logger } from '../helpers.ts';

test('tool results have identical structured JSON and one text item on success and failure', async () => {
  const root = fileURLToPath(new URL('../fixtures/project', import.meta.url));
  const results = new ToolResultFactory(logger);
  const list = new ListAgentsTool(catalog(), results);
  const fetch = new FetchAgentInstructionsTool(catalog(), results);
  for (const result of [await list.execute({ projectRoot: root }), await fetch.execute({ projectRoot: root, name: 'orchestrator' }),
    await list.execute({}), await fetch.execute({ name: 'orchestrator' }),
    await fetch.execute({ projectRoot: root, name: '..' }), await fetch.execute({ projectRoot: root, name: 'unknown' })]) {
    assert.equal(result.content.length, 1);
    assert.equal(result.content[0].type, 'text');
    assert.deepEqual(JSON.parse(result.content[0].text), result.structuredContent);
    if ('isError' in result) {
      assert.equal(result.isError, true);
      assert.deepEqual(Object.keys(result.structuredContent).sort(), ['error', 'message']);
    }
  }
  assert.equal(JSON.parse((await list.execute({})).content[0].text).error, 'invalid_project_root');
  assert.equal(JSON.parse((await fetch.execute({ name: 'orchestrator' })).content[0].text).error, 'invalid_project_root');
  assert.equal(JSON.parse((await fetch.execute({})).content[0].text).error, 'invalid_name');
  assert.ok('isError' in await list.execute({ projectRoot: root, surprise: true }));
  assert.ok('isError' in await fetch.execute({ projectRoot: root, name: 'orchestrator', surprise: true }));
});

test('unexpected filesystem errors are contained and logged without exposing internals', () => {
  const codes: unknown[] = [];
  const results = new ToolResultFactory({ ...logger, error(_message, fields) { codes.push(fields?.code); } });
  const result = results.failure(new Error('private contents'));
  assert.equal(result.isError, true);
  assert.deepEqual(codes, ['malformed_pack']);
  assert.equal(result.content[0].text.includes('private contents'), false);
});
