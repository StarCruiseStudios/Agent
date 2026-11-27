# Requirements: Measurement

**Layer:** 004, Requirements
**Status:** Draft

These requirements keep it possible to measure a proposal's effect, which principle 16 sets as a core goal. They hold whether or not a measurement is made for any particular proposal.

---

**MEA-1. Every session record lets Archon recover how the session started and how it ended.** This follows from principle 16, which gives replaying comparable past tasks as an example of measurement.

- For each recorded session that ran in a code base that Collect records, the code base state the session started from can be recovered from the record.
- For each recorded session that a user's request started, the record identifies that request.
- For each recorded session whose platform kept an outcome, the record identifies that outcome.

**MEA-2. A measurement travels with the proposal it concerns.** Layer 003 states that a proposal can carry a measurement of its effect.

- A measurement is linked to each change it concerns and to the records it was made from.
- A measurement adds no support to any claim (layer 002, measurement).
- A measurement can be seen when the changes it concerns are decided on (APR-3).
