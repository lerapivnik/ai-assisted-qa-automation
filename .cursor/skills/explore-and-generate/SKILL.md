---
name: explore-and-generate
description: >
  Finds untested user flows by mapping tests/ against a live crawl and
  emitting one Gherkin plan for the highest-value gap. Always apply when
  the user says "find what we're not testing", "explore <page> for
  untested flows", or "expand coverage", or asks which flows lack tests
  and names no ticket. Do NOT use it when a ticket already exists (that's
  jira-ticket-analyzer; this is for when there's no ticket).
---

# Explore and generate

Read-only exploration. Do not edit application source, specs, page objects, fixtures, or config. Do not implement the plan. Return the Gherkin for **test-writer**; a human reviews it before any Playwright code is written.

Do not use this skill when a ticket already exists (that's jira-ticket-analyzer; this is for when there's no ticket).

## Steps

1. Map covered flows by reading `tests/`. List each user flow a spec already asserts, from the test title and its `expect`s. Ignore `tests/_gate-probe/`.

2. Crawl the target via the Playwright MCP and read the a11y tree, not pixels. Open the page with `browser_navigate` (`DIDAXIS_URL` plus the path), then `browser_snapshot` on the `plugin-playwright-playwright` server. Follow controls the tree exposes (dialogs, menus, in-page navigation) and snapshot again. Do not use screenshots to decide what the UI supports. Do not create, edit, or delete persisted data.

3. Enumerate real user flows the UI supports. A flow is a path a user can finish from roles, names, and states in the accessibility tree. Skip anything the tree did not show.

4. Diff to find the coverage gap. A flow is uncovered when no spec asserts its outcome. Keep the gap as a short list.

5. Pick the highest-value uncovered flow with a reason, one per run. Prefer a primary-path flow, a flow that can fail without a visible error, or a flow with no nearby spec. One sentence on why. Do not pick a second flow in the same run.

6. Output a Gherkin test plan (positive path + one edge case, every Then assertable) for the test-writer to implement.

## Plan

```gherkin
Feature: <uncovered flow>

  # Why this flow
  # <one sentence>

  # Positive path
  Scenario: ...
    Given ...
    When ...
    Then <observable outcome>

  # Edge case
  Scenario: ...
    Given ...
    When ...
    Then <observable outcome>
```

Every `Then` names a visible outcome from the accessibility tree (role, name, state, or exact text). Do not write a `Then` that only restates the action. Do not invent copy the crawl did not show. Return the plan in the response. Do not write a spec.
