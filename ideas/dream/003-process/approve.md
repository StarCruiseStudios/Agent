# Step: Approve

**Layer:** 003, Process
**Status:** Proposed

Approve is the only path by which anything reaches agents. It covers the decision on each [change](../002-concepts/change.md) and its publication. How a published output reaches agents afterward is described in [exposure](exposure.md).

## Decisions

Each change in a proposal is decided on its own, and the decision is one of the following.

- **Approved.** Approving a change that adds or revises an output also sets its applied [scopes](../002-concepts/scope.md), so approval is the point at which an output is applied to a scope. The content and scopes of a change can be edited as part of approving it. Each edit is kept as user input, linked to the change, and joins the evidence.
- **Rejected.** A rejection is recorded with its reasons (principle 10).
- **Deferred.** A deferred change stays undecided until it is brought back to review.

## Publication

Publishing an approved change to an output makes it the output's current [version](../002-concepts/version.md), or withdraws the output when the change retires it. Publishing an approved publication to a project places the output's content into the project. The published outputs, with their applied scopes and origins, form one shared set of knowledge for every supported agent (principle 18).

## Properties

- Nothing is published or written into a project unless it is approved (principle 12).
- Once a change is proposed, its content is altered only by an edit made while deciding on it, and that edit is recorded as user input.
