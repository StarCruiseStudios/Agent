import { z } from 'zod';
import { AgentName } from './AgentName.ts';

/**
 * Strict human-authored metadata contract; strings retain their original text.
 */
export const AgentMetadata = z.strictObject({
  /**
   * Case-sensitive pack directory name.
   */
  name: z.string().min(1).max(AgentName.maxLength).regex(AgentName.pattern),
  /**
   * What the instruction pack does.
   */
  description: z.string().min(1).max(500).refine(value => value.trim().length > 0),
  /**
   * Situations in which a picker should choose the pack.
   */
  whenToUse: z.string().min(1).max(500).refine(value => value.trim().length > 0),
  /**
   * Unique host tool hints; omitted tools become an empty list.
   */
  tools: z.array(z.string().min(1).max(64)).max(32)
    .refine(values => new Set(values).size === values.length).default([]),
  /**
   * Free-form model selection hint for the spawning host (1 to 500 characters).
   */
  modelHint: z.string().min(1).max(500).refine(value => value.trim().length > 0),
});
