# Requirements: Model use

**Layer:** 004, Requirements
**Status:** Draft

These requirements set how each step chooses its methods, as principle 17 requires.

---

**MOD-1. Each step uses the cheapest method that does the work.** This follows from principle 17.

- Deterministic code and ordinary algorithms are used wherever they do the work.
- Fuzzy methods, such as keyword matching or a semantic index, are used ahead of model judgment wherever they do the work at lower cost.
- Model judgment is used only where neither of the above will do.
- Any step may use any of these methods, subject to MOD-2 through MOD-4.

**MOD-2. Every use of model judgment is identified and justified.** This follows from principle 17.

- Every place where a step uses model judgment is listed, with the reason that a cheaper method will not do the work.

**MOD-3. A method never takes a step beyond its own definition.** Layer 003 defines what each step never does, and that holds whatever method the step uses.

- Whatever method Collect uses, its records contain only what the facts show (COL-6).
- Whatever method Link uses, every association it holds passes LNK-1.

**MOD-4. Expensive reasoning goes only to opportunities judged promising.** This follows from principle 17.

- Every opportunity that receives model judgment in Analyze has a recorded judgment that it is promising, with its reasons.
- The judgment that an opportunity is promising uses only deterministic code, ordinary algorithms, or fuzzy methods, and never model judgment (principle 17).
