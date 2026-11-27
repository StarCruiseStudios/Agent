# Scenario: Conflicting evidence becomes a question

**Layer:** 001, Abstract
**Status:** Proposed

This scenario is illustrative. It shows principles 7 and 10 at work.

---

In one session, the user tells an agent to always add tests before changing code in a project. In a later session in the same project, the user tells another agent to skip tests for a quick prototype. The two statements cannot both be a rule for that project, and nothing in the record shows which one the user means to hold.

Archon does not choose between them. It forms a question for the user that cites both sessions and asks whether the second statement was an exception or a change of rule (principle 7). Until the question is answered, no practice about testing in that project is proposed from this evidence. The user answers that prototypes are an exception, and the answer joins the evidence. The contradiction and its resolution both stay in the history (principle 10).
