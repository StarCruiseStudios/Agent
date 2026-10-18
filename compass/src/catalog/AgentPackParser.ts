import * as path from 'node:path';
import type { FileSystem } from '../filesystem/FileSystem.ts';
import { AgentMetadata } from './AgentMetadata.ts';
import type { AgentSummary } from './AgentSummary.ts';
import { CompassError } from './CompassError.ts';

/**
 * Parses exactly agent.json and instructions.md in the prescribed failure order.
 */
export class AgentPackParser {
  private readonly fs: FileSystem;
  constructor(fs: FileSystem) { this.fs = fs; }

  private fail(token: string): never {
    throw new CompassError('malformed_pack', `The pack is malformed: ${token}.`);
  }

  private async read(file: string, missing: string): Promise<Uint8Array> {
    try { return await this.fs.readFile(file); }
    catch (error) {
      // lstat is deliberately unnecessary: a dangling file symlink is unreadable,
      // whereas an absent required file is missing. readdir preserves that distinction.
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        try {
          const entries = await this.fs.readdir(path.dirname(file));
          if (!entries.some(entry => entry.name === path.basename(file))) this.fail(missing);
        } catch (directoryError) {
          if (directoryError instanceof CompassError) throw directoryError;
        }
      }
      this.fail('unreadable');
    }
  }

  private decode(bytes: Uint8Array): string {
    try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { return this.fail('invalid_encoding'); }
  }

  async parse(agentPath: string, name: string): Promise<{ summary: AgentSummary; instructions: string }> {
    const metadataText = this.decode(await this.read(path.join(agentPath, 'agent.json'), 'missing_metadata'));
    let json: unknown;
    try { json = JSON.parse(metadataText); } catch { this.fail('invalid_metadata'); }
    const metadata = AgentMetadata.safeParse(json);
    if (!metadata.success) this.fail('invalid_metadata');
    if (metadata.data.name !== name) this.fail('name_mismatch');
    const bytes = await this.read(path.join(agentPath, 'instructions.md'), 'missing_instructions');
    if (bytes.byteLength > 262144) this.fail('instructions_too_large');
    const instructions = this.decode(bytes);
    if (!instructions.trim()) this.fail('empty_instructions');
    return { summary: metadata.data, instructions };
  }
}
