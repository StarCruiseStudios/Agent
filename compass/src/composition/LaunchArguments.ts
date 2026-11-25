/**
 * Raised for malformed launch arguments; the process reports it on stderr and exits non-zero.
 */
export class LaunchUsageError extends Error {
  static readonly usage = 'Usage: compass [--project-root <path> | --project-root=<path>]';
  constructor(message: string) { super(`${message}\n${LaunchUsageError.usage}`); }
}

/**
 * Parses the only supported launch input: an optional default project root.
 */
export class LaunchArguments {
  readonly projectRoot: string | undefined;
  private constructor(projectRoot: string | undefined) { this.projectRoot = projectRoot; }

  static parse(args: readonly string[]): LaunchArguments {
    let projectRoot: string | undefined;
    const assign = (value: string | undefined) => {
      if (projectRoot !== undefined) throw new LaunchUsageError('--project-root may be given only once.');
      if (value === undefined || value === '') throw new LaunchUsageError('--project-root requires a value.');
      projectRoot = value;
    };
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]!;
      if (arg === '--project-root') {
        const next = args[i + 1];
        if (next === undefined || next.startsWith('--')) throw new LaunchUsageError('--project-root requires a value.');
        assign(next);
        i++;
      } else if (arg.startsWith('--project-root=')) {
        assign(arg.slice('--project-root='.length));
      } else {
        throw new LaunchUsageError(`Unknown argument: ${arg}`);
      }
    }
    return new LaunchArguments(projectRoot);
  }
}
