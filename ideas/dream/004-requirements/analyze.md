# Requirements: Analyze

**Layer:** 004, Requirements
**Status:** Draft

These requirements apply to [Analyze](../003-process/analyze.md), the step that derives claims and findings and turns findings into proposals.

---

**ANL-1. Frequency and support are counted separately for every claim.** This follows from principle 5 and from the definitions of frequency and support in layer 002.

- Each claim carries a count of occurrences, distinct sessions, and distinct projects.
- Each claim carries a count of independent sources, and occurrences that share a source add nothing to it.
- In the layer 001 scenario about an assumption repeated from one source, the claim has a frequency of five sessions and a support of one source.

**ANL-2. A finding becomes a proposal only when it holds up and is judged worth proposing.** Layer 003 sets this rule, and the overview gives both terms their meaning.

- Every proposal rests on at least one finding that holds up.
- No proposal rests on a finding that does not hold up, such as one whose only sources are agent statements or one that evidence contradicts in the same period.
- Every proposal rests on a finding with a recorded judgment that it is worth proposing, and the judgment carries its reasons.

**ANL-3. Every judgment is a recorded inference that can be revised.** Layer 002 treats sameness of claims, findings, changes, and tags, tags that need judgment, and who wrote a piece of existing knowledge as inferences, and the overview adds the judgments that something is promising or worth proposing.

- Each such judgment carries its evidence or reasons.
- Revising a judgment keeps the earlier one in the history (principle 10) and changes no record.

**ANL-4. A finding that depends on an open question is never proposed.** Layer 003 sets this rule.

- While a question is open, no proposal rests on a finding that waits on it.
- Once the question is answered or withdrawn, the finding is checked again from identified (layer 003, finding lifecycle).

**ANL-5. Every proposed scope carries an origin and evidence.** This follows from principles 2 and 9.

- Each change that adds or revises an output proposes at least one scope.
- Each proposed scope carries an origin and the evidence that the knowledge applies there.

**ANL-6. A rejected change is proposed again only on new evidence.** Layer 003 sets this rule.

- A change judged the same as a rejected one cites at least one piece of evidence that Archon did not hold when the change was rejected.

**ANL-7. A finding that a later run identifies again is updated, and never duplicated.** Layer 003 sets this rule.

- When a run identifies a finding judged the same as an earlier one, the new evidence is linked to the earlier finding and no second finding is created.

**ANL-8. Published knowledge is checked again when what it rests on changes.** This follows from principle 15.

- When a record beneath a published change is flagged as outdated, an association beneath it is revised, or new evidence bears on its finding, the finding is checked again.
- When that finding no longer holds, or holds differently, a revision or retirement of the output is proposed, and the proposal links the change in the evidence.
- In the layer 001 scenario about stale knowledge, the proposal cites both the outdated record of the old build setup and the new record.

**ANL-9. Analyze never publishes, never changes an output, and never writes a record.** Layer 003 sets these limits.

- Analyze writes no record, changes no record's metadata, and changes no output or version.
- A record changes after Analyze asks for a check only through the check that Collect makes (COL-5).

**ANL-10. Every claim carries two dates.** Layer 002 gives every claim the date it was recorded and the period in which it held.

- Each claim carries the date it was recorded and the period in which it held.
- A claim that held for a period and then stopped is told apart from a claim that never held.
- Every finding of stale knowledge cites the period in which its claim held and the evidence that it stopped holding.
