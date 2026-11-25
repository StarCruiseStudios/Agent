import * as path from 'node:path';
import type { FileSystem } from '../filesystem/FileSystem.ts';
import { AgentMetadata } from './AgentMetadata.ts';
import type { AgentSummary } from './AgentSummary.ts';
import { CompassError } from './CompassError.ts';

/**
 * Parses exactly agent.json and instructions.md in the prescribed failure order.
 *
 * `parseSummary` is the cheap form used by listing and by skill/resource/script lookups: it validates
 * `agent.json` and checks that `instructions.md` exists and is within the size limit, without reading
 * the body. `parse` also reads and validates the body.
 */
export class AgentPackParser {
  /**
   * Maximum `instructions.md` size in bytes.
   */
  static readonly maxInstructionBytes = 262144;

  private readonly fs: FileSystem;
  constructor(fs: FileSystem) { this.fs = fs; }

  private fail(token: string): never {
    throw new CompassError('malformed_pack', `The pack is malformed: ${token}.`, { reason: token });
  }

  /**
   * Classifies a failed access: an absent entry is `missing`, anything else (including a dangling
   * link, whose entry still exists) is `unreadable`.
   */
  private async missingOrUnreadable(error: unknown, file: string, missing: string): Promise<never> {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      try {
        const entries = await this.fs.readdir(path.dirname(file));
        if (!entries.some(entry => entry.name === path.basename(file))) this.fail(missing);
      } catch (directoryError) {
        if (directoryError instanceof CompassError) throw directoryError;
      }
    }
    return this.fail('unreadable');
  }

  private async read(file: string, missing: string): Promise<Uint8Array> {
    try { return await this.fs.readFile(file); }
    catch (error) { return this.missingOrUnreadable(error, file, missing); }
  }

  private decode(bytes: Uint8Array): string {
    try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { return this.fail('invalid_encoding'); }
  }

  private async metadata(agentPath: string, name: string): Promise<AgentSummary> {
    const metadataText = this.decode(await this.read(path.join(agentPath, 'agent.json'), 'missing_metadata'));
    let json: unknown;
    try { json = JSON.parse(metadataText); } catch { this.fail('invalid_metadata'); }
    const metadata = AgentMetadata.safeParse(json);
    if (!metadata.success) this.fail('invalid_metadata');
    if (metadata.data.name !== name) this.fail('name_mismatch');
    return metadata.data;
  }

  /**
   * Validates metadata plus the presence and size of `instructions.md`, without reading the body.
   */
  async parseSummary(agentPath: string, name: string): Promise<{ summary: AgentSummary }> {
    const summary = await this.metadata(agentPath, name);
    const file = path.join(agentPath, 'instructions.md');
    let stats: Awaited<ReturnType<FileSystem['stat']>>;
    try { stats = await this.fs.stat(file); }
    catch (error) { return this.missingOrUnreadable(error, file, 'missing_instructions'); }
    if (stats.isDirectory()) this.fail('unreadable');
    if (stats.size > AgentPackParser.maxInstructionBytes) this.fail('instructions_too_large');
    return { summary };
  }

  /**
   * Validates the whole pack and returns its decoded instruction body.
   */
  async parse(agentPath: string, name: string): Promise<{ summary: AgentSummary; instructions: string }> {
    const summary = await this.metadata(agentPath, name);
    const bytes = await this.read(path.join(agentPath, 'instructions.md'), 'missing_instructions');
    if (bytes.byteLength > AgentPackParser.maxInstructionBytes) this.fail('instructions_too_large');
    const instructions = this.decode(bytes);
    if (!instructions.trim()) this.fail('empty_instructions');
    return { summary, instructions };
  }
}
