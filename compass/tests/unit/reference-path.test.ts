import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import { resolveCompassReference } from '../../src/catalog/resolveCompassReference.ts';

const base = path.resolve('project', '.compass');
const home = path.resolve('user-home');
const shared = path.resolve('shared');

test('leading tilde expands to the user home with either separator', () => {
  for (const reference of ['~/.compass', '~\\.compass']) {
    assert.equal(resolveCompassReference(reference, base, {}, home), path.join(home, '.compass'));
  }
  assert.equal(resolveCompassReference('~', base, {}, home), home);
  assert.equal(resolveCompassReference('nested/~/.compass', base, {}, home), path.resolve(base, 'nested/~/.compass'));
  assert.equal(resolveCompassReference('~another/.compass', base, {}, home), path.resolve(base, '~another/.compass'));
});

test('Unix and Windows variable forms expand in absolute, relative and home paths', () => {
  const environment = { COMPASS_TEST_ROOT: shared, COMPASS_TEST_SUBDIR: 'team', COMPASS_TEST_RELATIVE: '../../shared' };
  for (const prefix of ['$COMPASS_TEST_ROOT', '${COMPASS_TEST_ROOT}', '%COMPASS_TEST_ROOT%']) {
    assert.equal(resolveCompassReference(`${prefix}/.compass`, base, environment, home), path.join(shared, '.compass'));
  }
  assert.equal(resolveCompassReference('~/${COMPASS_TEST_SUBDIR}/.compass', base, environment, home), path.join(home, 'team', '.compass'));
  assert.equal(resolveCompassReference('${COMPASS_TEST_RELATIVE}/$COMPASS_TEST_SUBDIR/.compass', base, environment, home),
    path.resolve(base, '../../shared/team/.compass'));
  assert.equal(resolveCompassReference('${COMPASS_TEST_ROOT}/%COMPASS_TEST_SUBDIR%/.compass', base, environment, home),
    path.join(shared, 'team', '.compass'));
});

test('unset and empty variables fail instead of resolving unintended paths', () => {
  for (const variable of ['$COMPASS_TEST_MISSING', '${COMPASS_TEST_MISSING}', '%COMPASS_TEST_MISSING%']) {
    assert.throws(() => resolveCompassReference(`${variable}/.compass`, base, {}, home), /unset or empty/);
    assert.throws(() => resolveCompassReference(`${variable}/.compass`, base, { COMPASS_TEST_MISSING: '' }, home), /unset or empty/);
  }
});

test('substitutions are single pass and never evaluate shell expressions', () => {
  const environment = { COMPASS_TEST_LITERAL: '$COMPASS_TEST_OTHER', COMPASS_TEST_OTHER: 'expanded' };
  assert.equal(resolveCompassReference('$COMPASS_TEST_LITERAL/.compass', base, environment, home),
    path.resolve(base, '$COMPASS_TEST_OTHER/.compass'));
  for (const reference of ['$(command)/.compass', '`command`/.compass', '../../shared/.compass', shared]) {
    assert.equal(resolveCompassReference(reference, base, {}, home), path.resolve(base, reference));
  }
});
