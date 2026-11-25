import * as path from 'node:path';

/**
 * Lexical containment checks over already-resolved real paths. `path.relative` is used instead of
 * string prefixes so Windows drive letters and separators compare correctly.
 */
export class PathContainment {
  /**
   * Returns whether `child` is strictly inside `parent` (at any depth).
   */
  static within(parent: string, child: string): boolean {
    const relative = path.relative(parent, child);
    return !!relative && !path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`);
  }

  /**
   * Returns whether `child` is a direct child of `parent`.
   */
  static immediateChild(parent: string, child: string): boolean {
    return PathContainment.within(parent, child) && !path.relative(parent, child).includes(path.sep);
  }
}
