import { CompassError } from '../catalog/CompassError.ts';
import type { DiagnosticLogger } from '../logging/DiagnosticLogger.ts';

/**
 * Builds matching structured and textual JSON results and contains handler errors.
 */
export class ToolResultFactory {
  private readonly logger: DiagnosticLogger;
  constructor(logger: DiagnosticLogger) { this.logger = logger; }

  success(value: object) {
    const payload = { ...value };
    return { content: [{ type: 'text' as const, text: JSON.stringify(payload) }], structuredContent: payload };
  }

  failure(error: unknown) {
    const failure = error instanceof CompassError ? error :
      new CompassError('malformed_pack', 'The catalog is malformed: unreadable.');
    this.logger.error('Tool failed', { code: failure.code });
    return { ...this.success({ error: failure.code, message: failure.message }), isError: true as const };
  }
}
