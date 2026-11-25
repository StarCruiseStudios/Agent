import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import { LaunchArguments, LaunchUsageError } from '../../src/composition/LaunchArguments.ts';
import { ProjectRootResolver } from '../../src/catalog/ProjectRootResolver.ts';
import { NodeFileSystem } from '../../src/filesystem/NodeFileSystem.ts';
import { temporary } from '../helpers.ts';

const fs = new NodeFileSystem();

test('parses absent flag, separate value and = form', () => {
  assert.equal(LaunchArguments.parse([]).projectRoot, undefined);
  assert.equal(LaunchArguments.parse(['--project-root', 'kotlin']).projectRoot, 'kotlin');
  assert.equal(LaunchArguments.parse(['--project-root=/a/b']).projectRoot, '/a/b');
  assert.equal(LaunchArguments.parse(['--project-root=a=b']).projectRoot, 'a=b');
});

test('rejects missing value, repeated flag and unknown arguments', () => {
  for (const args of [['--project-root'], ['--project-root='], ['--project-root', '--other'],
    ['--project-root', 'a', '--project-root', 'b'], ['--project-root=a', '--project-root=b'],
    ['--project-root', 'a', '--project-root=b'], ['--bogus'], ['positional'], ['--project-root', 'a', 'extra']]) {
    assert.throws(() => LaunchArguments.parse(args), LaunchUsageError, JSON.stringify(args));
  }
});

test('explicit root wins over the launch default', async t => {
  const explicit = await temporary(t);
  const fallback = await temporary(t);
  const resolver = new ProjectRootResolver(fs, fallback);
  assert.equal(await resolver.resolve(explicit), explicit);
});

test('default is used when projectRoot is omitted', async t => {
  const fallback = await temporary(t);
  assert.equal(await new ProjectRootResolver(fs, fallback).resolve(undefined), fallback);
});

test('an invalid explicit root does not fall back to the default', async t => {
  const resolver = new ProjectRootResolver(fs, await temporary(t));
  for (const bad of ['relative/path', '', 42, null]) {
    await assert.rejects(resolver.resolve(bad), { code: 'invalid_project_root' });
  }
});

test('both absent is invalid_project_root', async () => {
  await assert.rejects(new ProjectRootResolver(fs).resolve(undefined), { code: 'invalid_project_root' });
});

test('relative launch value resolves against the given cwd', async t => {
  const base = await temporary(t);
  const { mkdir } = await import('node:fs/promises');
  await mkdir(path.join(base, 'kotlin'));
  const resolver = new ProjectRootResolver(fs);
  assert.equal(await resolver.resolveLaunchRoot('kotlin', base), path.join(base, 'kotlin'));
  assert.equal(await resolver.resolveLaunchRoot(path.join(base, 'kotlin'), '/unrelated'), path.join(base, 'kotlin'));
  await assert.rejects(resolver.resolveLaunchRoot('missing', base), { code: 'invalid_project_root' });
});
