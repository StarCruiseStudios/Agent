/**
 * Raised for malformed launch arguments; the process reports it on stderr and exits non-zero.
 */
export class LaunchUsageError extends Error {
  static readonly usage = 'Usage: compass [--project-root <path>] [--log-level <debug|info|warn|error>]';
  constructor(message: string) { super(`${message}\n${LaunchUsageError.usage}`); }
}

const flags = ['--project-root', '--log-level'] as const;
const levels = ['debug', 'info', 'warn', 'error'] as const;

/**
 * Parses launch input: an optional default project root and an optional diagnostic log level.
 * Each flag accepts `--flag value` or `--flag=value` and may be given once.
 */
export class LaunchArguments {
  /**
   * Raw `--project-root` value, resolved against the cwd by the caller.
   */
  readonly projectRoot: string | undefined;

  /**
   * Minimum diagnostic level written to stderr; `info` by default.
   */
  readonly logLevel: typeof levels[number];

  private constructor(projectRoot: string | undefined, logLevel: typeof levels[number]) {
    this.projectRoot = projectRoot;
    this.logLevel = logLevel;
  }

  static parse(args: readonly string[]): LaunchArguments {
    const values = new Map<typeof flags[number], string>();
    const assign = (flag: typeof flags[number], value: string | undefined) => {
      if (values.has(flag)) throw new LaunchUsageError(`${flag} may be given only once.`);
      if (value === undefined || value === '') throw new LaunchUsageError(`${flag} requires a value.`);
      values.set(flag, value);
    };
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]!;
      const flag = flags.find(candidate => arg === candidate || arg.startsWith(`${candidate}=`));
      if (!flag) throw new LaunchUsageError(`Unknown argument: ${arg}`);
      if (arg === flag) {
        const next = args[i + 1];
        if (next === undefined || next.startsWith('--')) throw new LaunchUsageError(`${flag} requires a value.`);
        assign(flag, next);
        i++;
      } else {
        assign(flag, arg.slice(flag.length + 1));
      }
    }
    const level = values.get('--log-level') ?? 'info';
    if (!(levels as readonly string[]).includes(level)) {
      throw new LaunchUsageError(`--log-level must be one of ${levels.join(', ')}.`);
    }
    return new LaunchArguments(values.get('--project-root'), level as typeof levels[number]);
  }
}
