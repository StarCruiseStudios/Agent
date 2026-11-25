/**
 * Case-folding comparisons and bounded "did you mean" suggestions for catalog names.
 */
export class NameMatching {
  /**
   * The case-folded identity used for collision checks.
   */
  static fold(name: string): string { return name.toLowerCase(); }

  /**
   * Returns whether more than one candidate case-folds to the same value as `name`.
   */
  static collides(name: string, candidates: readonly string[]): boolean {
    const folded = NameMatching.fold(name);
    return candidates.filter(candidate => NameMatching.fold(candidate) === folded).length > 1;
  }

  /**
   * Groups names by case-folded identity, preserving the order in which each group first appears.
   */
  static groups(names: readonly string[]): string[][] {
    const groups = new Map<string, string[]>();
    for (const name of names) {
      const key = NameMatching.fold(name);
      const group = groups.get(key);
      if (group) group.push(name); else groups.set(key, [name]);
    }
    return [...groups.values()];
  }

  /**
   * Returns up to `limit` candidates close to `name`, nearest first. Suggestions are bounded so that a
   * failed lookup never discloses a whole directory listing.
   */
  static suggest(name: string, candidates: readonly string[], limit = 3): string[] {
    const target = NameMatching.fold(name);
    const threshold = Math.max(2, Math.floor(target.length / 3));
    return [...new Set(candidates)]
      .filter(candidate => candidate !== name)
      .map(candidate => {
        const folded = NameMatching.fold(candidate);
        const related = target.length >= 3 && (folded.includes(target) || target.includes(folded));
        return { candidate, distance: NameMatching.distance(target, folded), related };
      })
      .filter(item => item.distance <= threshold || item.related)
      .sort((a, b) => a.distance - b.distance || (a.candidate < b.candidate ? -1 : a.candidate > b.candidate ? 1 : 0))
      .slice(0, limit)
      .map(item => item.candidate);
  }

  private static distance(a: string, b: string): number {
    let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i++) {
      const current = [i];
      for (let j = 1; j <= b.length; j++) {
        current[j] = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      previous = current;
    }
    return previous[b.length]!;
  }
}
