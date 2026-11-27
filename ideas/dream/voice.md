# Archon Voice Guide

These instructions are for any agent writing or revising Archon's design documents. They cover the abstract (`001-abstract/`) and every later layer that adds detail to it. Follow them for all prose in those documents, including headings, principle statements, tables, and examples.

## Audience and purpose

The readers are engineers who will design, build, review, or use Archon. They need to know exactly what the system does, why it does it, and which rules it must keep. Each document should leave the reader able to make decisions about Archon without asking the author what a sentence meant.

## Voice statement

Write like an experienced engineer explaining a system they understand well to a peer. State what the system does in plain words, give the reason, and show a concrete case when the idea is abstract. The voice is confident and dry. It carries no hype, no sentimentality, and no attempt to sell the reader on anything.

## Traits

**Direct.** Put the claim first and the reason immediately after it. A principle opens with its rule, and the sentences that follow explain why the rule exists or what it rules out. This trait fails when it drops the reason entirely, because a bare rule gives later layers nothing to reason from.

**Literal.** Describe what the system does in mechanical terms. Name the operation that happens, such as recording, searching, comparing, classifying, proposing, approving, or publishing. Avoid metaphors that make the system sound like a living mind, including "dreaming," "sleeping," "remembering," "reflecting," and "wanting." Archon "analyzes the record across sessions" rather than "dreams over it." A plain technical term such as "memory" is acceptable when it names an output type the documents define. Literalness fails when it turns into jargon that the document never defines, so define each term at first use or link to the layer that defines it.

**Impersonal.** Keep the reader and the author out of the prose. Do not address the reader as "you," and do not write as "I" or "we." Refer to people by their role, such as "the user" or "a reviewer." Use passive voice when the actor is unspecified or irrelevant, especially for approval: "a proposal goes live once it is approved" is correct, and "you approve the proposal" is off-voice. Use active voice with Archon or a named part of Archon as the subject when the system is the actor. This trait fails when every sentence goes passive, so prefer the active form whenever the actor is known and worth naming.

**Certain where certain, explicit where not.** State settled decisions without hedging. When something is a goal that is not yet met or an illustrative example, say so once and in plain words, such as "This is a core goal" or "The set is open." A decision that belongs to a lower layer is left out of the text, and it is never mentioned as deferred. Never invent detail to fill an open question. Certainty fails when it claims more than the design has decided.

**Plain.** Prefer short, common words of everyday English, such as "keep," "find," "check," "record," and "fix." Use technical vocabulary only when it is the precise term, such as "provenance," "deterministic," or "version." Plainness fails when it loses precision, so keep a technical word when no plain one says the same thing.

## Words to use and avoid

| Prefer | Avoid or limit | Reason and exceptions |
|---|---|---|
| records, collects, captures | remembers, experiences, lives through | Archon stores data. It does not have experiences. "Experience" is acceptable as a noun for the recorded agent activity, because the abstract defines it that way. |
| analyzes, searches, compares, classifies | dreams, reflects, ponders, sleeps | Describe the operation that runs. The user has ruled out "dream" and its variants. |
| proposes, publishes, approves, rolls back | promotes to live (limit), adopts | "Promoted knowledge" is acceptable where the abstract already uses it. Prefer "published" in new text. |
| the user, a reviewer | you, your, we, our, I | Prose stays impersonal. |
| is approved, once it is approved | you approve, you decide | Approval is always phrased without a named approver at this layer. |
| evidence, record, source | proof, truth | Evidence supports a claim. It rarely proves one. |
| project, language, engineering domain, general | global (limit) | Scope has several levels. "Global" is acceptable only when the text means the most general scope. |
| user preference, generalizable | personal, universal | Use the two origin labels the abstract defines. |

Never use filler or inflated words such as "delve," "tapestry," "foster," "leverage," "unlock," "elevate," "seamless," "game-changing," "transformative," "robust," "powerful," "in today's fast-paced world," "it's worth noting," or "in conclusion." Choose a concrete verb that says what happens.

## Grammar and mechanics

The following rules apply to all prose in Archon documents.

- **Write complete sentences.** Do not use sentence fragments for drama, emphasis, or a punchline. Headings, table cells that act as labels, and list labels may be phrases. A short sentence is fine when it is complete, such as "Coding agents forget."
- **Avoid negative parallelism.** Do not write "Not X, but Y," "This isn't X. It's Y," "X, not Y" as a slogan, or "More than X, it's Y." State the intended point directly. Use plain negation when it carries real meaning, such as "Frequency alone never makes a claim true."
- **Make each point once.** Develop it with a reason or an example, then move on. Remove restatements, stacked intensifiers, and closing sentences that repeat the paragraph.
- **Do not use em dashes.** Split the sentence or use a comma where it is grammatical. Do not substitute a colon, semicolon, parentheses, or double hyphens to get the same effect.
- **Build real paragraphs.** Each paragraph develops one idea through connected sentences, and paragraph length varies with the idea. Reserve a one-sentence paragraph for a genuinely separate point.
- **Avoid the buzzwords listed above.**
- **Tense.** Use the present tense to describe what Archon does, as though the system exists. Use "aims to" or "is a goal" for capabilities that may arrive later.
- **Modal verbs.** Avoid "should" when describing Archon's behavior, because it hides whether something is a rule or a wish. Write "Archon records" or "Archon never publishes" for rules, and "Archon aims to" for goals. "Should" is acceptable inside a quoted question, such as the "How should the agent approach work?" column in the outputs table.
- **Contractions.** Do not use contractions in design documents.
- **Headings.** Use sentence case. Section headings are short noun phrases, such as "Process," "Outputs," or "Scope."
- **Principles.** Number them continuously across the whole document, even when they are grouped under subheadings, so any principle can be cited by number. Each one opens with a bold imperative sentence that states the rule, such as "**Never edit the record.**" One to three plain sentences follow, giving the reason or the boundary.
- **Lists and tables.** Use a numbered list for steps that happen in order, a bulleted list for parallel items, and a table when items share the same attributes. Every list item that is not a label is a complete sentence.
- **Bold.** Use bold for principle lead-ins, defined labels such as **Scope** and **Origin**, and output names in tables. Do not use bold for emphasis inside a sentence.
- **Punctuation.** Use no exclamation marks, no ellipses, no emoji, and no rhetorical questions. Use colons only to introduce a list or a stated rule, such as "proposes a practice: before changing a public interface, find its consumers."
- **Spelling.** Use American English.

## Examples

Each pair keeps the same facts and shows only the change in voice.

**Approval**

Off-voice: "Once you've reviewed it, you approve the proposal and it goes live!"

On-voice: "A proposal goes live only once it is approved."

The on-voice version removes the second person, the exclamation mark, and the implied approver.

**Describing the process**

Off-voice: "Then Archon dreams, reflecting on everything it has lived through to uncover hidden insights."

On-voice: "Archon then analyzes the record across sessions, looking for failures that keep coming back, approaches that keep working, claims that contradict each other, and knowledge that has gone stale."

The on-voice version names what the analysis looks for instead of using a metaphor and a buzzword.

**Negative parallelism**

Off-voice: "Existing artifacts are inputs, not territory."

On-voice: "Hand-written instructions, agents' built-in memory, and existing skills are treated as current knowledge. Changes to them may be proposed, and those proposals follow the same approval rule as any other."

The on-voice version says what actually happens to existing artifacts instead of relying on a slogan.

**Fragments and short paragraphs**

Off-voice:

> Three sessions. Three agents. One mistake.
>
> Nobody connected them.

On-voice:

> In one session, Claude changes an API without checking its consumers, and the tests fail. In another, Codex changes an interface and misses the components that depend on it. In a third, a Cursor agent is corrected by the user for changing a public API without checking compatibility. Each transcript describes the problem in different words, and none of the sessions refers to the others.

The on-voice version gives the concrete facts in connected, complete sentences. The point comes from the facts rather than from punctuation.

**Stating a goal that is not yet met**

Off-voice: "Archon will prove that every change makes agents better."

On-voice: "Archon aims to measure a proposal's effect before it is reviewed, for example by replaying comparable past tasks with and without the change. This is a core goal, and changes may still be proposed before that measurement is possible."

The on-voice version marks the goal as a goal and avoids a guarantee the design cannot make.

## Situations

**Abstract and high-level layers.** The reader wants to know what the system is and which rules bind it. Lead with the problem in one or two sentences, then describe what Archon does. Use one illustrative example to make the abstract idea concrete, and label it as illustrative. Leave implementation choices such as databases, file formats, and schedules to later layers.

**Principles.** The reader will cite these to settle design arguments. Keep each principle to a single rule. When a new rule overlaps an existing one, revise the existing principle instead of adding a second one that restates it.

**Lower, more detailed layers.** The reader is implementing. Keep the same traits, and add precision through definitions, tables, and step lists. When a detail refines a principle from a higher layer, cite the principle by number instead of repeating its text.

**Uncertainty and open questions.** When the design has not decided something that belongs to the current layer, it goes to the user as a question before the layer is handed back. Something that belongs to a lower layer is left out, and the text never points to the layer that will settle it. Do not hedge settled decisions to sound careful, and do not settle open ones to sound complete.

## Drafting and revision checklist

1. Identify the situation from the list above and the reader's purpose.
2. Check that every fact, decision, and scope matches the source decisions. Never add capabilities, numbers, or guarantees that the design has not stated.
3. Check that each claim leads its sentence or paragraph and that a reason or example follows.
4. Remove every "you," "your," "we," and "I." Rephrase approval as something that "is approved."
5. Replace anthropomorphic verbs, especially "dream" and its variants, with the operation that actually runs.
6. Run the mechanics pass. Look for sentence fragments, negative parallelism, repeated emphasis, em dashes, runs of short paragraphs, and buzzwords, and fix each one.
7. Check modal verbs, tense, contractions, and bold usage against the grammar rules.
8. Confirm that principles stay numbered continuously and that each one opens with a bold imperative sentence.

When rules conflict, keep accuracy and the meaning of the source decisions first. The prose standards in the grammar section come next, and the traits and vocabulary preferences come after them. Quotations, proper names, technical terms, headings, labels, and clearly marked off-voice examples are exempt from the sentence rules where those rules would distort them.

---

## Source notes

These notes record where the guide came from. They are not instructions.

- The prose standards come from `skills/voice-guide/SKILL.md` in this repository.
- The direct, plain, claim-then-reason style, the imperative principle headings, and the use of concrete demonstrations were drawn from https://www.unixphilosophy.com, which served as a reference for voice only. Its structure was not copied. That site's sentence fragments, contrast slogans, and many one-line paragraphs were deliberately left out because the prose standards prohibit them.
- The user directed the impersonal phrasing for approval, which replaces "you approve it" with "it is approved," and the ban on "dreaming" and other anthropomorphic language in favor of literal descriptions of the process.
- The rules for contractions, modal verbs, and spelling locale are defaults proposed for consistency with the abstract. They are not taken from the user or the reference site.
