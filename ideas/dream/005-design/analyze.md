# Design: Analyze

**Layer:** 005, Technical design
**Status:** Draft

This file defines how [Analyze](../003-process/analyze.md) derives claims, finds and scores opportunities, investigates them, decides whether findings hold up and are worth proposing, forms questions, and drafts proposals. Analyze reads Link's and Collect's namespaces and keeps its own data in its own namespace through the [storage interface](storage.md), runs its jobs in the [runtime host](runtime.md), and makes every model call through the [model gateway](model-access.md).

---

## Parts of Analyze

| Part | Method | What it does |
|---|---|---|
| **Dependency index** | Deterministic | Records what every item rests on, and marks the items to check again when something beneath them changes. |
| **Rule-based facts** | Deterministic rules | Derives claims, tags, and authorship that fixed rules can settle. |
| **Source tracing** | Deterministic graph walk | Finds the source of each occurrence of a claim, and counts support and frequency. |
| **Opportunity detectors** | Deterministic queries and fuzzy search | Find opportunities, score them, and judge which are promising. |
| **Investigation** | Model judgment | Turns a promising opportunity into candidate findings with cited evidence. |
| **Sameness** | Embedding search, then model judgment | Judges whether two claims, findings, changes, or questions are the same. |
| **Holds-up check** | Deterministic | Applies the threshold that layer 004 gives for a finding that holds up. |
| **Questions** | Flagged by investigation, ranked deterministically | Forms, ranks, and withdraws questions. |
| **Worth proposing** | Deterministic gate, then model judgment | Judges whether a finding that holds up is worth proposing. |
| **Proposal drafting** | Model judgment, then deterministic checks | Drafts the changes of a proposal and checks them. |

Every use of a model in these parts is registered with the gateway with its reason (MDA-2), and every inference made with a model is stored with its call record (MDA-4).

Analyze knows which version of each output agents load from Collect's records of existing knowledge. In the records of managed files and of the published-outputs directory, each output is labeled with its output ID and version ID ([Exposure](exposure.md)), and every other piece of existing knowledge is known by its record. A current output, in this file, is one that those records show agents loading (SEP-4).

Sessions that carry the tag of the model gateway's working directory (MDA-5) or of a measurement run are Archon's own activity. Analyze never cites them as evidence and never counts them in support or frequency (MEA-2).

## Dependency index

For every claim, inference, finding, question, and change, the dependency index records the records, associations, and other items it rests on. When Collect or Link writes something new, the index marks the items that rest on what changed, and only those items are derived again (INC-3). A record flagged as outdated, an association revised, and new evidence for or against a claim each mark the findings that rest on them, and a marked finding is checked again from identified (ANL-8).

## Rule-based facts

Fixed rules derive what needs no model. Each result is an inference that names its rule (ANL-3).

- **Claims from structured events.** A rule turns structured events into claims, such as that a test command run in a repository at a commit exited with status 0. Which commands count as test commands is set by rules in the configuration.
- **Tags.** A rule assigns tags that need judgment where a fixed rule settles them, such as the language of a file from its extension.
- **Authorship.** A piece of existing knowledge is judged as written by an agent when a session event shows an agent wrote it, by the user when the repository's history shows a commit by the user, and as unknown otherwise.

## Source tracing

For each occurrence of a claim, source tracing follows Link's associations, such as **loaded knowledge**, **subagent of**, and **started from**, back to the point where the claim entered the record. Occurrences that reach the same starting point share a source (layer 002, source). Support counts the independent sources rooted in an observation or in user input, and frequency counts occurrences, distinct sessions, and distinct projects, each kept apart from the other (ANL-1).

## Opportunity detectors

A detector is a deterministic query or fuzzy search over the namespaces Analyze reads. The set of detectors is open. The detectors known so far find the following.

- Error lines that recur across sessions.
- Commands that agents find again in session after session.
- Likely user corrections, from cue words in user messages and similarity to known corrections.
- Existing knowledge that an observation contradicts.
- Claims about the same thing that conflict.
- Changes beneath a published output, such as an outdated record or a revised association.

Each opportunity receives a score from configurable weights on six factors: recurrence across distinct sessions, independence of sources, impact as the failures and corrections involved, recency, novelty as knowledge not already in a current output, and uncertainty. An opportunity whose score passes the configured threshold is judged promising, and the judgment is recorded with its score and the value of each factor as its reasons. The score and the judgment use no model (MOD-4).

## Investigation

Only promising opportunities are investigated (MOD-4). Investigation gathers the evidence of an opportunity, such as event spans, associations, and existing knowledge, gives each piece an ID, and sends it to the model. The model returns candidate findings, and each one states its claim, its kind, the evidence it cites, and the evidence against it. Each citation names one of the IDs that investigation supplied, and a candidate that cites an ID it was not given is discarded.

Investigation is also where claims are extracted from what agents and the user stated, for the records that the opportunity involves. Claims are extracted from all existing knowledge and all user input, whether or not an opportunity involves them.

## Sameness

Sameness covers claims, findings, changes, and questions (ANL-3, ANL-7, QST-3). Embeddings from the gateway find candidates. Two items that match exactly after a fixed normalization are the same without a model call, and the model judges the remaining close candidates. A finding judged the same as an earlier one adds its evidence to the earlier finding, and no second finding is created (ANL-7).

## Holds-up check

The holds-up check applies the meaning of **holds up** from layer 004 to the recorded support and contradictions of a finding. A finding holds up when at least one independent source rooted in an observation or in user input supports it, and no evidence contradicts it in the same period. The check uses no model.

## Questions

Investigation flags a question when the evidence of a finding is ambiguous or conflicts and nothing recorded settles it. The question cites that evidence (QST-1), and the finding waits on it (ANL-4). A question judged the same as an open, answered, or withdrawn question is not formed again (QST-3). Open questions are ranked by the number of findings that wait on each one (QST-4). An answer reaches Analyze as a user-input record that names the question it answers. The answer joins the evidence, and every finding that waits on the question is checked again from identified (ANL-4, QST-5). When later evidence settles a question before it is answered, the question is withdrawn with that evidence (QST-5).

## Worth proposing

A deterministic gate comes first. A finding passes it only when it holds up, waits on no open question, and is not already stated by a current output. The model then judges whether a finding that passed the gate is worth proposing, and the judgment is recorded with its reasons (ANL-2).

## Proposal drafting

The model drafts each change of a proposal from the findings it rests on. A draft states the change's kind as an addition, revision, or retirement, the output's kind as a memory, a practice, or a skill (OUT-1), its content, and its proposed scopes with the origin and evidence of each (ANL-5). A revision or a retirement also names its base: the record of the output's version that it was drafted against. A finding that both describes how a project works and prescribes how agents work becomes separate changes (OUT-2).

Deterministic checks follow every draft, and a draft that fails any of them is not proposed.

- **Secrets.** The content is scanned with the gateway's secret rules, and a draft that contains a secret is blocked (DAT-3).
- **Rejected changes.** A change judged the same as a rejected one must cite evidence from a record that Collect wrote after the rejection was recorded (ANL-6). Decisions reach Analyze as user-input records that Collect writes (COL-7).
- **Citations.** Every piece of evidence that the change cites resolves to a record, an association, or a finding.

## What starts Analyze's work

| Job | Trigger | Parts |
|---|---|---|
| **Cheap work** | New writes in Collect's or Link's namespace. | Dependency index, rule-based facts, source tracing, opportunity detectors, and the holds-up check. |
| **Model work** | A schedule, within the gateway's limits. | Investigation, sameness, worth proposing, and proposal drafting. |
| **Requested run** | The `archon analyze` command. | Model work, run at once within the gateway's limits. |

---

## Technical requirements

**AZD-1. Only promising opportunities receive model judgment, and no model judges what is promising.** This serves MOD-4.

- Every investigation rests on an opportunity with a recorded promising judgment, its score, and the value of each factor.
- The score and the promising judgment are computed without a model call.

**AZD-2. Every citation in a finding resolves to evidence that investigation supplied.** This serves TRC-1 and ANL-2.

- No finding cites an ID that investigation did not supply for it.
- Every citation in a finding resolves to a record, an event span, an association, or another finding.

**AZD-3. Support and frequency are computed without a model.** This serves ANL-1 and MOD-1.

- Support and frequency of every claim follow from source tracing over recorded associations.
- In the layer 001 scenario about an assumption repeated from one source, source tracing reaches the one instruction file from all five sessions.

**AZD-4. Whether a finding holds up is decided by a fixed check.** This serves ANL-2.

- The same recorded support and contradictions always give the same result.
- The check makes no model call.

**AZD-5. New input repeats only the work that rests on it.** This serves INC-2 and INC-3.

- An item whose records, associations, and evidence are unchanged is not derived again.
- Every item that rests on an outdated record or a revised association is marked to be checked again.

**AZD-6. No proposed change contains a secret.** This serves DAT-3.

- Every drafted change is scanned with the secret rules before it is proposed.
- No change that the scan flags is proposed.
