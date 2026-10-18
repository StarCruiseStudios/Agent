import { Logger } from 'tslog';
import type { DiagnosticLogger } from './DiagnosticLogger.ts';

/**
 * Routes tslog diagnostics exclusively to stderr.
 */
export class TslogDiagnosticLogger implements DiagnosticLogger {
  private readonly logger: Logger<unknown>;

  constructor(logger: Logger<unknown>) { this.logger = logger; }

  static create(): TslogDiagnosticLogger {
    const logger = new Logger<unknown>({ type: 'hidden' });
    logger.attachTransport((entry) => { process.stderr.write(`${JSON.stringify(entry)}\n`); });
    return new TslogDiagnosticLogger(logger);
  }

  debug(message: string, fields?: Record<string, unknown>) { this.logger.debug(message, fields); }
  info(message: string, fields?: Record<string, unknown>) { this.logger.info(message, fields); }
  warn(message: string, fields?: Record<string, unknown>) { this.logger.warn(message, fields); }
  error(message: string, fields?: Record<string, unknown>) { this.logger.error(message, fields); }
}
