# Progress file schema

On the staged route, the plan stage writes the exact initial contents of this file into `05-plan.md`. Direct plans have no progress file. The first implementation step creates the file as `progress.yaml` in the plan folder, and the `track-progress` skill keeps it current. Creating the file is not itself a phase or step inside the YAML, and the file is not listed under `files`.

Initially every status flag is `false`, `plan.status` is `not-started`, and `plan.current` is null.

```yaml
plan:
  name: <short plan name>
  summary: <one or two sentences>
  status: not-started          # not-started | in-progress | blocked | complete
  updated: <ISO-8601 date-time of last update, set at creation>
  plan_dir: .plans/<###>-<slug>   # folder holding the planning artifacts
  instruction_sets: []         # resolved planning instruction sets, in order
  current:                     # where to resume; null while not-started
    phase: null                # phase id
    step: null                 # step id
  notes: []                    # resume hints, blockers, deviations (append-only strings)

phases:
  - id: p1                     # unique, stable, never renumbered
    title: <phase title>
    implemented: false         # true when all steps are implemented
    verified: false            # true when all acceptance criteria are met and validations passed
    steps:
      - id: p1.s1              # unique, stable
        description: <one concrete, independently checkable action>
        implemented: false
    acceptance_criteria:
      - id: p1.ac1
        description: <observable condition that must hold>
        met: false
    validations:
      - id: p1.v1
        description: <how it is checked>
        command: "<shell command, or 'manual: ...' if not automatable>"
        passed: false

files:                         # every file the plan touches, across all phases
  - path: <repo-relative path>
    change: create             # create | modify | delete
    phase: p1                  # phase that owns the change
    implemented: false
    verified: false
```

## Rules

- Ids are permanent. During implementation steps are appended or marked `obsolete: true`, never renumbered or deleted.
- Steps are small enough to complete and record in one go.
- Every phase has at least one acceptance criterion and one validation. Prefer runnable `command` values over `manual:`.
- `files` lists every file to be created, modified, or deleted, including new ones, but not the planning artifacts or `progress.yaml` itself.
- Instruction sets may add fields (for example `owner` on a phase or `commit` on a step). They may not remove or rename the fields above.

## Example

```yaml
plan:
  name: Add retry to HTTP client
  summary: Add configurable retry with exponential backoff to the HTTP client.
  status: not-started
  updated: 2026-10-24T09:00:00Z
  plan_dir: .plans/007-http-client-retry
  instruction_sets: [default]
  current: { phase: null, step: null }
  notes: []
phases:
  - id: p1
    title: Retry policy
    implemented: false
    verified: false
    steps:
      - { id: p1.s1, description: "Add RetryPolicy type with maxAttempts and backoff", implemented: false }
      - { id: p1.s2, description: "Wrap HttpClient.send in the retry loop", implemented: false }
      - { id: p1.s3, description: "Add unit tests for retry and give-up paths", implemented: false }
    acceptance_criteria:
      - { id: p1.ac1, description: "Failed requests retry up to maxAttempts with increasing delay", met: false }
      - { id: p1.ac2, description: "Non-retryable status codes fail immediately", met: false }
    validations:
      - { id: p1.v1, description: "Unit tests pass", command: "npm test", passed: false }
      - { id: p1.v2, description: "Lint passes", command: "npm run lint", passed: false }
files:
  - { path: src/http/retry.ts, change: create, phase: p1, implemented: false, verified: false }
  - { path: src/http/client.ts, change: modify, phase: p1, implemented: false, verified: false }
  - { path: test/http/retry.test.ts, change: create, phase: p1, implemented: false, verified: false }
```
