#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { CompassProcess } from './composition/CompassProcess.ts';

/**
 * Import-safe application entry that delegates process setup to CompassProcess.
 */
export class CompassMain {
  private readonly process: CompassProcess;
  constructor(process: CompassProcess) { this.process = process; }
  start(): ReturnType<CompassProcess['start']> { return this.process.start(); }
}

if (process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url) {
  new CompassMain(new CompassProcess()).start();
}
