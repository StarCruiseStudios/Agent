import type { CallToolResult } from '@modelcontextprotocol/server';
import { CompassError } from '../catalog/CompassError.ts';
import type { DiagnosticLogger } from '../logging/DiagnosticLogger.ts';

/**
 * Builds tool results and contains handler errors.
 *
 * - `success`: one text item holding the JSON of `structuredContent`.
 * - `document`: the Markdown body as its own unescaped text item, then the remaining fields as JSON;
 *   `structuredContent` still holds every field so structured-only hosts lose nothing.
 * - `failure`: `{ error, message, ...details }` in both forms, with `isError: true`.
 */
export class ToolResultFactory {
  private readonly logger: DiagnosticLogger;
  constructor(logger: DiagnosticLogger) { this.logger = logger; }

  success(value: object): CallToolResult & { structuredContent: Record<string, unknown> } {
    const payload = { ...value } as Record<string, unknown>;
    return { content: [{ type: 'text', text: JSON.stringify(payload) }], structuredContent: payload };
  }

  document(value: { instructions: string }): CallToolResult & { structuredContent: Record<string, unknown> } {
    const { instructions, ...metadata } = value;
    return {
      content: [{ type: 'text', text: instructions }, { type: 'text', text: JSON.stringify(metadata) }],
      structuredContent: { ...value },
    };
  }

  failure(error: unknown): CallToolResult & { structuredContent: Record<string, unknown>; isError: true } {
    let failure: CompassError;
    if (error instanceof CompassError) {
      failure = error;
      this.logger.warn('Tool call rejected', { code: failure.code, reason: failure.reason });
    } else {
      failure = new CompassError('internal_error', 'Compass failed unexpectedly; see the server diagnostics.');
      this.logger.error('Tool failed unexpectedly', {
        code: failure.code,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
    return { ...this.success({ error: failure.code, message: failure.message, ...failure.details }), isError: true };
  }
}
