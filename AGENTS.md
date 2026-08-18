# Agent Working Agreement

## Default Mode: Planning

- When the user asks for planning, architecture, debugging strategy, or code understanding, do not create, edit, delete, rename, or format files.
- Read and inspect files as needed, then explain findings in clear steps.
- Think with the user by stating assumptions, tradeoffs, risks, and alternative approaches.
- End planning responses with a numbered, step-by-step implementation plan. Each step should be small enough to implement, explain, and validate independently.
- For a multi-step implementation, create or update `PLAN.md` only after the user explicitly approves implementation. Treat `PLAN.md` as the durable source of truth for the plan across chats and context compaction.
- Wait for an explicit instruction such as "implement", "edit", "apply this", or "make the change" before modifying files.

## Persistent Implementation Plan

- For multi-step work, keep `PLAN.md` in the repository root.
- Include:
  - the numbered implementation steps with completion checkboxes,
  - the goal and completion criteria for each step,
  - important decisions, assumptions, and constraints,
  - the current project state,
  - validation performed and its result,
  - the next unfinished step.
- Update `PLAN.md` after completing and validating each step.
- If `PLAN.md` already exists, read it and inspect the relevant code before proposing or implementing more work. Do not rely on the plan file alone when the code may have changed.
- Do not silently change the agreed plan. Explain any needed change and wait for approval when it materially changes scope, architecture, dependencies, or later steps.

## Editing Mode

- Implement exactly one approved plan step at a time.
- Approval to implement the project or plan does not imply approval to execute every step continuously.
- Before editing each step, explain:
  - which file will change,
  - what the code currently does,
  - what change will be made,
  - why that change is needed.
- Keep the pre-edit explanation concise; give the detailed teaching explanation after the code is working.
- Complete the current step fully, including relevant validation, but do not begin the next plan step.
- Keep edits small and focused.
- Do not refactor unrelated code.
- Do not create new files unless they are necessary and explained first.

## Clean Code and File Structure

- Write code that is easy for a newer developer to read, trace, test, and safely change later.
- Prefer clear names, straightforward control flow, and small focused functions over clever or overly compact code.
- Keep each file responsible for one cohesive area of behavior. A file can contain closely related helpers, types, and components, but it should not become a catch-all for unrelated UI, state management, API calls, data shaping, and business rules.
- Treat file length as a design signal, not a hard rule. When a file grows large enough that it is hard to scan, or when it contains clear distinct responsibilities, explain the split and move those responsibilities into separate files.
- Split code when there is a natural boundary, such as:
  - separate UI components,
  - route-planning logic,
  - bus simulation state,
  - request-management rules,
  - driver-device display logic,
  - API/client code,
  - shared types, constants, fixtures, or test helpers.
- Do not split code just to make files tiny. Keep code together when the pieces are simple, tightly coupled, and easier to understand in one place.
- When splitting files, use names that describe the responsibility of the file, not vague names like `utils`, `helpers`, or `misc` unless that pattern already exists and is clearly appropriate.
- Prefer modules with small public surfaces. Export only what other files actually need.
- Avoid duplication. If the same logic appears in multiple places, consider extracting a shared function, component, hook, or module, but only when the shared abstraction has a clear name and purpose.
- Keep data, presentation, and side effects reasonably separated. For example, UI components should not also contain unrelated route-planning algorithms or hardware-message protocol details when those can live in focused modules.
- Keep comments useful and rare. Use comments to explain why something is done or to clarify non-obvious behavior; do not use comments to restate what clear code already says.
- When a change makes an existing file too broad, include the cleanup needed for that change in the same step if it is small and directly related. If the cleanup is larger, call it out and propose a separate plan step.

## Git Branch Workflow

- Create a new Git branch before changing code for each approved plan step.
- A plan step should normally be independently reviewable and mergeable. If several very small steps form one inseparable feature, use one feature branch only when the user explicitly approves grouping them.
- Before creating the branch:
  - inspect the current branch and working-tree status,
  - identify the intended base branch,
  - make sure unrelated uncommitted changes will not be carried into the new branch.
- If the working tree contains unrelated or ambiguous changes, do not stash, discard, commit, or move them automatically. Explain the situation and ask the user how to proceed.
- Create the step branch from the agreed base branch, normally the latest completed and accepted project state. Do not assume that `main` is always the correct base.
- Use a short descriptive branch name such as `step-02-route-selection` or `feature-pickup-request`. Avoid vague names such as `changes` or `work`.
- Record the branch name and base branch in `PLAN.md` for the current step.
- Keep all implementation and fixes for that step on its branch. Do not mix another plan step or unrelated cleanup into it.
- At handoff, report the active branch and recommend whether it is ready to commit and merge.
- Do not commit, merge, rebase, push, delete branches, or switch away from a branch containing unfinished work unless the user explicitly asks.
- Before starting the next step, confirm that the previous step has been accepted and that its branch has been committed and merged, or ask the user which branch the next step should use as its base.

## Step Completion and Handoff

After each implementation step:

1. Run the relevant tests, type checks, linting, build, or a focused manual check that is available for the change.
2. Review the diff for unintended or unrelated changes.
3. Update `PLAN.md` with the completed step, decisions, validation result, current state, and next step.
4. Explain:
   - what changed and why,
   - how the implementation works,
   - the important code paths, functions, data structures, and control flow,
   - every file created or changed,
   - what validation ran and whether it passed,
   - any limitations, risks, or unresolved questions.
5. Show or quote the most important code excerpts when that helps understanding. Reference file paths and symbols so the full code is easy to locate; do not merely restate the diff line by line.
6. Propose a concise Git commit message, but do not commit unless the user explicitly asks.
7. Report the active branch, its base branch, and whether it appears ready to commit and merge.
8. State the next planned step and stop. Wait for explicit approval such as "implement Step 2" before modifying code for it.

If validation fails, stay within the current step while diagnosing and fixing failures caused by that step. Report unrelated pre-existing failures separately and do not expand scope without approval.

## Teaching Style

- Explain code in beginner-friendly steps without skipping important details.
- Define unfamiliar terms when they first appear.
- Prefer concrete examples from the actual codebase.
- When there are multiple valid approaches, compare them briefly.
- Explain enough of the actual code for the user to understand and maintain it; do not provide only a high-level summary.
- Distinguish existing code, newly added code, and generated or third-party code.

# Project Overview

This project is a demo integration concept for the Moovit app. The demo should show how a rider can request that a bus stop for them at a pickup station.

The experience should look and feel similar to Moovit. It should simulate real buses, real stops, and route planning. Route planning may use an API from Moovit, Google, or another transit route-planning provider, depending on availability, cost, licensing, and technical fit.

