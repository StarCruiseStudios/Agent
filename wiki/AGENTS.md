---
type: Guide
title: Wiki Writing Guide
description: Prose standards and voice rules for the technical text in this wiki.
---

# Wiki Writing Guide

## Scope

Use this guide when you write or revise technical documentation for a global audience of developers and administrators. Typical outputs include concept pages, how-to steps, tutorials, feature descriptions, reference text, interface text, and page descriptions. The guide applies to prose written for readers who need to complete a task or understand a subject. Rules marked as proposed defaults fill gaps where the voice is otherwise unspecified. Situations and examples are original and illustrative.

## Required prose standards

Apply these six requirements to every piece you write with this guide. They hold in every situation, and reference material never creates an exception.

1. Write complete sentences in prose. Avoid fragments used for drama, punchlines, or emphasis. Headings, table cells, and short labels may remain phrases.
2. Avoid negative parallelism such as "Not X, but Y," "This isn't about X. It's about Y," and "More than X, it's Y." State the point directly. Use factual negation only when accuracy requires it, for example "The API does not support batch deletes."
3. Avoid repeated emphasis. Make each point once, then support it with an explanation or example. Remove restatements, stacked intensifiers, and closing sentences that repeat the paragraph.
4. Do not use em dashes. Restructure the sentence, split it in two, or use a comma. Do not substitute a colon, semicolon, parentheses, or double hyphens to imitate the dash.
5. Do not present connected prose as a run of one-sentence paragraphs. Build each paragraph around one coherent idea and vary paragraph length. Use an isolated short paragraph only for a notice or a genuinely separate point.
6. Avoid AI buzzwords and stock phrases used as filler, such as "delve," "tapestry," "foster," "leverage," "unlock," "elevate," "seamless," "game-changing," "transformative," "in today's fast-paced world," "it's worth noting," and "in conclusion." Keep a term when its literal or technical meaning is required.

Preserve quotations, product names, and technical terms exactly. Off-voice examples may demonstrate prohibited patterns when they are labeled as off-voice.

## No self-referential language or meta-text

The content must never talk about itself, its own structure, its authoring, or the process that produced it. Write the subject matter directly, and let the headings and links carry navigation.

- Do not refer to the page, section, document, guide, or article as an object. Avoid "This page explains," "In this section," "This guide covers," "The following table shows," "as described above," "as mentioned earlier," "see below," and "in this document."
- Do not announce what you are about to say or summarize what you just said. Avoid "Let's take a look at," "Here is an overview of," "To summarize," and "In short."
- Do not address or describe the writing process or the writer. Avoid "I," "we," "as an AI," "I hope this helps," drafting notes, revision remarks, placeholders such as "TODO," and commentary about assumptions or sources.
- Do not comment on the style, tone, or wording of the text, for example "in plain language" or "simply put."
- Introduce lists and tables with a sentence that states the content itself, such as "The service supports three authentication methods:" instead of "The following list describes the authentication methods."
- Refer to other pages by their subject, using meaningful link text such as "the authentication reference," instead of directions such as "the page linked above."

Source notes, open questions, and assumptions belong outside the published content, in the message that delivers it.

## Voice statement

The speaker is a knowledgeable colleague who respects the reader's time. The writer already knows the product, states what the reader can do with it, and explains the steps without condescension. The reader is a busy technical person, often reading in a second language, who wants to finish a task correctly the first time. Every sentence earns its place by helping that person act or understand.

## Core traits

**Plain.** Write so the reader understands and can act on the text at first reading. Use simple sentences that carry one idea each. Prefer familiar words over obscure ones, and use a long word only when the meaning requires it. This trait becomes counterproductive when simplification removes a precise technical term the reader needs. Keep the term and define it.

**Customer-first.** Start from what the reader wants to accomplish, then give the action. Describe features in terms of the reader's objective instead of the company's business goals. Say "you" for the reader. This trait becomes counterproductive when it turns into marketing claims. Do not list performance statistics in feature descriptions, and define any metric you do provide.

**Confident.** State instructions and facts directly so the reader has no reason to doubt them. Guide from expertise without talking down: explain why a step matters, and skip remarks like "simply" or "obviously." Acknowledge real uncertainty or limits plainly. This trait becomes counterproductive when confidence turns into guarantees the product cannot back up.

**Solutions-oriented.** Anticipate the problem the reader is likely to have and put the answer where they will meet it. Lead with the outcome the reader wants. This trait becomes counterproductive when the text speculates about problems the reader is unlikely to have.

**Inclusive and accessible.** Write for readers with disabilities, for translators, and for readers from any culture. This trait shapes word choice, link text, headings, and alt text, and it never yields to brevity.

## Tone settings

Warmth is low to moderate: courteous and helpful, without chattiness. Formality is moderate: professional, with no slang or cultural references. Directness is high. Humor is absent from instructional text. Enthusiasm is restrained, and exclamation marks are unnecessary. Empathy shows up as helpful anticipation of problems instead of emotional language. Technical depth follows the reader: start with the basics, explain why before how, and add advanced detail progressively.

## Words to use and words to avoid

| Prefer | Avoid or limit | Reason and exceptions |
| --- | --- | --- |
| Submit a `GET` request | Do a `GET` | Names the action precisely. |
| Default settings | Out-of-the-box settings | Idiom that translates poorly. |
| On-premises | On-prem | Abbreviations reduce clarity. Spell out unless the reader needs the short form to match the interface. |
| Make sure that no deployments conflict with one another | Perform an execution of the process steps with a core focus of ensuring that the deployments do not conflict | One idea, short words, active verb. |
| Block | Blacklist | Descriptive term; avoids color-based good and bad associations. Also avoid whitelist, and master and slave. |
| On-path attack, with "they" for the attacker | Man-in-the-middle, "he" for a hypothetical attacker | Avoid gendered terms when no specific person is meant. |
| Validate, smoke test | Sanity check | Avoid metaphors that reference mental health. Also avoid "crazy" and "insane" as descriptors. |
| By using | Using (as a bare participle) | Prevents dangling modifiers. |
| Do not, cannot, is not | Contractions such as don't, can't, isn't | Contractions are specific to English and hard to translate. |
| The same term every time | Synonyms for variety | Consistent terminology removes ambiguity. Do not call one thing a "rule" in one paragraph and a "policy" in the next. |

Define every acronym and unfamiliar term on first use, for example "Web Content Accessibility Guidelines (WCAG)." If a good explanation already exists, link to it. If the page introduces the term, define it there. Consider a glossary for terms readers may not know. Use jargon only when the reader needs the term to finish the task, and match the explanation to the audience's level of knowledge.

Avoid cultural references, idioms, and metaphors. A message that is unclear in English will be unclear in every translation. Use short, familiar words because they are easier to scan and easier for non-native readers.

## Grammar, punctuation, and mechanics

**Sentence length.** Aim for about 8 to 12 words per sentence, and give each sentence one idea. Treat this as a strong tendency, and let clarity win when a longer sentence is needed for a precise technical statement. Do not chop a sentence into fragments to hit the range.

**Paragraphs.** Keep paragraphs short, and satisfy required standard 5 by making each one develop one idea across several connected sentences, and use lists for parallel items. Put the most important message first in every paragraph and section.

**Voice and tense.** Use active voice whenever possible, because it puts the focus on the actor and the solution. Use present tense. Avoid past tense where it would make content feel outdated, and apply future tense only to actions that have not yet happened. Refer to current customers and current behavior in the present tense. Choose clarity over brevity if the two conflict.

**Point of view.** Address the reader as "you." Use the product or system name instead of "we" when describing behavior. Use "they" for a hypothetical person. (Proposed default: avoid first person in reference text.)

**Contractions.** Do not use contractions. This is a firm rule because the content is meant for translation.

**Gerunds and participles.** Place them so the implied subject is correct. Write "When you use a load balancer" instead of "When using a load balancer." Write "Test the certificate by using a browser" instead of "using a browser." Start titles of tutorials and process topics with a gerund only when the meaning is unambiguous. Prefer "Options for editing" over "Editing options," "Billing for services" over "Billing services," and "Changing a password" over "Changing passwords."

**Lists and tables.** Use lists for sequences and parallel items, and tables for comparisons. Introduce each list with a complete sentence.

**Headings and links.** Use headings to convey meaning and structure. Give each page an informative, unique title. Write link text that makes sense out of context, such as "Plain Language Guide Series," never "click here."

**Images and media.** Write meaningful alt text. Provide transcripts and captions for multimedia. Use images or symbols when a written description would be unintuitive.

**Primary answer placement.** Always place the primary answer or core instruction in the main content flow. Use tabs only for platform-specific variations (for example Dashboard, API, and Terraform) after you state the general concept. Use collapsible Details sections for supplementary information only.

**Page descriptions.** Write one or two self-contained sentences. Name the product or feature, state what the page helps the reader do or understand, and make the text work as a standalone snippet. Do not open with "This page describes," "Learn more about," or "This document explains."

**Other mechanics.** Use American English spelling (proposed default). Avoid emoji, exclamation marks, and ellipses in documentation text. Avoid rhetorical questions. Use commas, periods, and colons for their ordinary functions, and remember that required standard 4 forbids em dashes.

## Examples

**Active voice and customer focus.**

Off-voice: "Latency is automatically reduced by the Load Balancing feature, and visitors are directed to infrastructure closest to them."

On-voice: "Load Balancing automatically reduces latency by directing visitors to the closest infrastructure."

Operative rules: active voice, one idea, and focus on the solution to the reader's problem.

**Jargon and long phrasing.**

Off-voice: "Utilize the out-of-the-box configuration to commence the deployment."

On-voice: "Use the default settings to start the deployment."

Operative rules: short familiar words and no idioms.

**Dangling modifier and contractions.**

Off-voice: "Using a browser, you can test the certificate, and it's easy to confirm the result."

On-voice: "Test the certificate by using a browser. The browser displays the certificate details when the connection succeeds."

Operative rules: a clear subject for the modifying phrase, no contractions, and no unsupported claims about ease. (Illustrative scenario.)

**Connected paragraph, concept introduction.**

Off-voice (labeled): "Our game-changing caching layer seamlessly elevates your performance. It's fast. It's reliable. It's built for scale."

On-voice: "Caching stores a copy of your content on servers close to your visitors. When a visitor requests a cached file, the nearest server responds without contacting your origin server. This reduces load on your origin and shortens the wait for the visitor." (Illustrative; adjust to the real behavior of the product being described.)

Operative rules: explain why before how, define the concept, avoid buzzwords, avoid fragments, and describe the benefit without statistics.

**Page description.**

Off-voice: "This page describes how to configure rate limiting rules."

On-voice: "Create rate limiting rules to control how many requests a visitor can send to your application in a given period."

Operative rules: name the feature, state what the reader can do, open with the action, and do not refer to the page itself.

**Meta-text.**

Off-voice: "In this section, we will look at how caching works. As mentioned above, the following table summarizes the cache settings."

On-voice: "Caching stores copies of responses so repeated requests return faster. Three settings control how long a copy stays valid:" (followed by the table or list of settings)

Operative rules: state the subject directly, and introduce the table with the content it holds.

## Situations and tone adaptation

**Step-by-step instructions.** The reader is mid-task and wants to proceed without error. Keep confidence, plainness, and present tense constant. Use imperative sentences, one action per step, and state the expected result after steps whose outcome the reader should verify. Example: "Select **Save**. The rule appears in the list with the status Active."

**Concept explanation.** The reader is learning and needs context. Start with the basic idea, define terms, explain why before how, and add detail progressively. Add a short real-life use case that serves a clear purpose. Example: "A load balancer distributes incoming requests across several servers. If one server fails, the load balancer sends traffic to the remaining servers, so visitors keep reaching your site."

**Troubleshooting and error text.** The reader is frustrated and wants the fix. Keep the tone calm and neutral, and avoid blame or exclamation. State what happened, then the cause if known, then the action. Example: "The request failed because the API token does not have permission to edit DNS records. Create a token with the DNS Edit permission and try again."

**Limitations and bad news.** The reader needs accurate information to plan. Stay confident and factual, with no apology language that blames the reader and no softening that hides the limit. State the limit, its scope, and any available alternative. Example: "Free plans support up to five rules. To add more rules, upgrade to a paid plan."

**Uncertainty or unsupported behavior.** Say what is known and what is not. Example: "The documentation does not specify the behavior when two rules match the same request. Test your configuration before you deploy it."

**Feature or product description.** The reader is evaluating or orienting. Lead with what the reader can accomplish, keep the claims verifiable, and omit performance statistics unless they are defined and relevant to the reader's decision. Example: "Use serverless functions to run code close to your visitors without managing servers."

**Sensitive or inclusive topics.** When a topic involves security incidents, accessibility, or people, remove gendered, racist, and ableist terms, and use descriptive, neutral language. Example: "An attacker places themselves between a visitor and a website."

## Applying the guide

1. Identify the situation, the reader's goal, and the action the text must support. Put the primary answer first.
2. Preserve meaning and factual accuracy. Do not add product capabilities, statistics, or promises that the source material does not support.
3. Draft in plain, active, present-tense sentences, one idea per sentence, with "you" for the reader.
4. Check vocabulary: define acronyms and terms on first use, use the same term for the same thing, replace jargon, idioms, and cultural references, and remove racist, gendered, and ableist wording.
5. Check mechanics: no contractions, correct gerunds and participles, meaningful link text and headings, alt text for images, and tabs or collapsed sections used only for variations and supplements.
6. Run the required prose pass. Look for sentence fragments, negative parallelism, repeated emphasis, em dashes, strings of one-sentence paragraphs, and AI buzzwords. Also look for self-referential language and meta-text, such as references to "this page," "above," or "below," announcements of what comes next, and drafting notes. Rewrite each occurrence.
7. Read the text as a non-native reader would, and shorten any sentence that carries more than one idea.

If rules conflict, apply this order: factual accuracy and the requested meaning first, then the required prose standards, then clarity for the reader and translator, and then the remaining voice preferences. The 8 to 12 word guideline, the paragraph length guideline, and the other tendencies yield to clarity and to the required prose standards. The no-contractions rule and the inclusive-language rules are firm. Quotations, names, technical terms, headings, labels, and labeled off-voice examples keep their exceptions.
