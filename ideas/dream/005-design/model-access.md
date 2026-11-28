# Design: Model access

**Layer:** 005, Technical design
**Status:** Draft

This file defines how a component uses a language model or an embedding model. Model access sits beneath every step, together with [storage](storage.md) and the [runtime host](runtime.md), and it holds no knowledge of any step.

---

## Model gateway

The model gateway is a Rust library that runs inside the service. Every use of a model in Archon goes through it, and no other code starts a model or a platform command line tool. Collect makes no model calls (COL-6, MOD-3).

| Kind of call | Provider | Where it runs |
|---|---|---|
| **Embedding** | Local ONNX models, run through the ONNX Runtime. | On the user's machine. |
| **Judgment** | The command line tools of the supported agent platforms, such as Claude Code and Codex, run on the user's own subscription. | On the platform's servers. |
| **Replay** | The same command line tools, with the agent's tools on, run inside a container for [measurement](measurement.md). | On the platform's servers, with the agent's actions confined to the container. |

Each provider sits behind one provider trait, so a provider can be added without any change to the components that call the gateway.

### Embedding models

Embedding models are ONNX files kept in the Archon data directory. Each embedding is labeled with the model's name and a hash of its file (STO-6). Embedding calls never leave the machine.

### Judgment through platform command line tools

The gateway runs a platform's command line tool in its non-interactive mode, with the model that the use names. Every judgment call has the following properties.

- It runs in a working directory of its own inside the Archon data directory, never in one of the user's projects.
- It runs with every tool that changes files or runs commands turned off, so a call reads only what the gateway gives it.
- It asks for a reply in a defined shape, and the gateway checks the reply against that shape. A reply that does not match is retried a set number of times and then recorded as a failed call.

A call through a platform tool is an agent session on that platform. Collect records it the same way as any other session (COL-3), and the working directory it ran in is a tag that the record's fact shows (COL-6). Every step can therefore tell Archon's own model calls apart from the user's agent work.

## Registry of uses

Every use of a model is declared in code before it can be called. A use has a name, its kind, its purpose, the reason that deterministic code, an ordinary algorithm, or a fuzzy method will not do the work (MOD-1), and the model it calls by default. The configuration file can name a different model for a use. A call that names no registered use is refused. The `archon models uses` command lists every registered use with its reason (MOD-2).

## Call records

Every call returns a call record with its result. The call record holds the use, the provider, the model as the provider reports it, the version of the platform tool, the version of the prompt, the parameters, the usage that the provider reports, and the number of secrets removed from the input. The component that made the call stores the call record with the result in its own namespace, so every inference made with a model carries what produced it (ANL-3).

## Secrets

Before any input is sent to a judgment provider or given as the request of a replay, the gateway scans it for keys, tokens, passwords, and other credentials with deterministic pattern and entropy rules. Each secret found is replaced with a placeholder that names its kind. The recorded content is unchanged, because the removal happens only in the input sent to the provider (principle 3). Embedding calls run on the user's machine and are not scanned.

## Limits

The configuration file sets limits on judgment calls: the number of calls and the usage that providers report, each over a period such as an hour or a day, for every use and for all uses together. Replays have limits of their own, set apart from the limits on judgment calls. The configuration also sets how many judgment calls and how many replay runs run at once. A job whose next call would pass a limit waits until the period allows it. Usage against each limit is kept in the runtime host's namespace.

---

## Technical requirements

**MDA-1. Only the gateway sends content off the machine.** This serves DAT-2.

- No component other than the gateway starts a platform command line tool or opens a network connection.
- Every embedding is computed on the user's machine.

**MDA-2. Every model call names a registered use.** This serves MOD-2.

- The gateway refuses every call that names no registered use.
- Every registered use states the reason a cheaper method will not do the work.
- One command lists every registered use with its reason.

**MDA-3. No input to a judgment provider contains a detected secret.** This serves DAT-2 and DAT-3.

- No input sent to a judgment provider contains a string that the secret rules detect.
- Removing secrets from an input changes no record.

**MDA-4. Every model result carries what produced it.** This serves ANL-3 and TRC-1.

- Every result from the gateway comes with a call record holding the use, provider, model, tool version, prompt version, parameters, and reported usage.
- Every inference that a model produced is stored with its call record.

**MDA-5. Archon's own model calls are identifiable in the record.** This serves COL-3 and COL-6.

- Every judgment call runs in the gateway's own working directory.
- Every session record of a judgment call carries that working directory as a tag the fact shows.
