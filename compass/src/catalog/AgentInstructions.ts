import type { AgentSummary } from './AgentSummary.ts';
import type { SkillSummary, SkillProblem } from './SkillCatalog.ts';
import type { CatalogProblem } from './CatalogProblem.ts';

/**
 * A fetched pack, including its complete Markdown body and resolved paths.
 */
export interface AgentInstructions extends AgentSummary {
  skills: SkillSummary[];
  skillProblems: SkillProblem[];
  catalogProblems: CatalogProblem[];
  /**
   * Canonical absolute project root.
   */
  projectRoot: string;
  /**
   * Canonical catalog containing this agent, including referenced catalogs.
   */
  compassPath: string;
  /**
   * Real absolute directory path of the pack.
   */
  agentPath: string;
  /**
   * Decoded instruction body, with only a leading BOM removed.
   */
  instructions: string;
}
