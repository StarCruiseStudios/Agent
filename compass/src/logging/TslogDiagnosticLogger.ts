import { Logger } from 'tslog';
import type { DiagnosticLogger } from './DiagnosticLogger.ts';

const minLevels = { debug: 2, info: 3, warn: 4, error: 5 } as const;

/**
 * Routes tslog diagnostics exclusively to stderr, as one JSON object per line.
 */
export class TslogDiagnosticLogger implements DiagnosticLogger {
  private readonly logger: Logger<unknown>;

  constructor(logger: Logger<unknown>) { this.logger = logger; }

  /**
   * Creates a stderr logger that drops entries below `level`.
   */
  static create(level: keyof typeof minLevels = 'info'): TslogDiagnosticLogger {
    const logger = new Logger<unknown>({ type: 'hidden', minLevel: minLevels[level] });
    logger.attachTransport((entry) => { process.stderr.write(`${JSON.stringify(entry)}\n`); });
    return new TslogDiagnosticLogger(logger);
  }

  debug(message: string, fields?: Record<string, unknown>) { this.logger.debug(message, fields); }
  info(message: string, fields?: Record<string, unknown>) { this.logger.info(message, fields); }
  warn(message: string, fields?: Record<string, unknown>) { this.logger.warn(message, fields); }
  error(message: string, fields?: Record<string, unknown>) { this.logger.error(message, fields); }
}
