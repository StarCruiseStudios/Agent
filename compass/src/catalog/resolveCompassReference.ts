import * as os from 'node:os';
import * as path from 'node:path';

/** Expands config references without evaluating shell expressions. */
export function resolveCompassReference(reference: string, base: string,
  environment: NodeJS.ProcessEnv = process.env, home: string = os.homedir()): string {
  const expanded = reference.replace(
    /\$\{([A-Za-z_][A-Za-z0-9_]*)\}|\$([A-Za-z_][A-Za-z0-9_]*)|%([A-Za-z_][A-Za-z0-9_]*)%/g,
    (_match, braced: string | undefined, plain: string | undefined, windows: string | undefined) => {
      const name = (braced ?? plain ?? windows)!;
      const value = environment[name];
      if (value === undefined || value === '') throw new Error(`Environment variable ${name} is unset or empty.`);
      return value;
    });
  if (expanded === '~') return path.resolve(home);
  if (/^~[/\\]/.test(expanded)) return path.resolve(path.join(home, expanded.slice(2)));
  if (!expanded.trim()) throw new Error('The expanded reference is empty.');
  return path.resolve(base, expanded);
}
