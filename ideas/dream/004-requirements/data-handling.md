# Requirements: Data handling

**Layer:** 004, Requirements
**Status:** Draft

These requirements cover where Archon keeps the data it records and derives, and how sensitive content in that data is treated. Layer 001 has Archon record what agents do, and it builds Archon first for one developer working locally across their own projects.

---

**DAT-1. The record, internal knowledge, and outputs are kept on the user's machine.** Archon records what agents do (layer 001, abstract), and this requirement fixes where that data is kept for the setting that layer 001 describes.

- Every record, all internal knowledge, and every version of every output are stored on the user's machine.
- With no network connection, all of them remain complete and readable.

**DAT-2. Recorded content leaves the machine only as input to a model.** This bounds DAT-1. A step may use a model that runs elsewhere, and MOD-1 through MOD-4 set when a step uses one.

- No recorded content is sent off the machine except as input to a model that a step uses.

**DAT-3. No proposed change contains a secret found in the record.** The record keeps facts exactly as captured (principle 3), so a secret that an agent session or a code base contains stays in the record, and nothing derived from it reaches agents.

- No change offered for a decision contains a key, token, password, or other credential that appears in the record.
- No version of any output contains such a secret.
