---
name: self-heal
description: >
  Heals one drifted Playwright locator in its page object and opens a pull
  request. Always apply when the user says "the build is red because a
  locator broke", "fix the drifted selector", "the test broke after a UI
  change", or "heal the suite". Use it ONLY after triage classifies the red
  run as a test issue (drift), never for a real app bug.
---

# Self-heal

One repair per run. Every heal becomes a PR. A human approves the merge.

Do not edit application source. Do not edit `playwright.config.ts`. Do not change a spec assertion to make the run green.

## Steps

1. Require triage's drift classification, else stop and route to bug-reporter.

   Read the triage handoff or the PR diagnosis from `.cursor/skills/ci-failure-triage/SKILL.md`. **Drift** means classification **test issue** and the root cause is a locator that no longer matches (element not found, timeout resolving a locator, or a strict-mode violation on that locator).

   No diagnosis yet: stop. Do not patch. Run triage first.

   Anything else — real app bug, environment, stale assertion, invented copy, timing flake with no locator change — stop and route to bug-reporter (`.cursor/skills/jira-bug-reporter/SKILL.md`). Do not edit the POM or the spec.

2. From the trace, find the failing locator and its POM.

   Use the trace triage already cited (`trace: 'on-first-retry'`; `trace.zip` inside the `playwright-report` artifact, or `gh run download <run-id> --name playwright-report`). Name the failing spec, the locator string in the error, and the `readonly` field on the page object in `pages/` that owns it. Specs must not contain inline locators; if the failure is an inline locator, stop — that is not this repair.

   One repair per run: the first failing locator in that trace. Leave every other locator for a later run.

3. Re-discover the element via the Agent-Browser a11y tree by its role + current accessible name.

   Open the page with `browser_navigate` (`DIDAXIS_URL` plus the path the spec uses), then `browser_snapshot` on the `plugin-playwright-playwright` server. That snapshot is the Agent-Browser a11y tree. Find the control by its role and the accessible name the tree shows now. Do not choose the locator from a screenshot, from CSS, or from a name the tree did not show. Do not create, edit, or delete persisted data.

4. Patch the locator in the POM, minimal role-based diff, never the spec's assertions.

   Change only that one `readonly` locator in `pages/`. Follow `.cursor/skills/pom-conventions/SKILL.md`: `getByRole` with the role and accessible name from the tree, then `getByLabel` / `getByPlaceholder`, then `getByText`, then `getByTestId` with a comment on why the higher options failed. Disambiguate with `.filter({ hasText })`, not `.first()`. No CSS or XPath.

   Do not edit `tests/`. Do not add, remove, or reword an `expect`. Do not touch waits, tags, or other locators.

5. Re-run and prove green WITH assertions unchanged (green via a weakened assertion is a bug, escalate).

   ```bash
   git diff -- tests/
   npx playwright test <failing-spec>
   ```

   `git diff -- tests/` must be empty. Re-run that spec once. Quote the passing result.

   If the spec is green only because an assertion was weakened, removed, or changed to check less: revert, stop, and escalate to bug-reporter. That green run is a bug.

   If the spec is still red after this one repair, stop. Do not try a second locator or a second re-run of the same spec.

6. Report the old->new locator diff + the green run.

   Then open the PR. Commit only the POM file. Push and `gh pr create`. Do not merge.

## Report

```markdown
## Heal

**Classification:** test issue (drift)
**Spec:** `<tests/file.spec.ts>` — `<title>`
**POM:** `pages/<File>.ts` — `<field>`

### Locator
- Old: `<previous locator>`
- New: `<role + accessible name from the a11y tree>`

### Green run
`<npx playwright test …>` — `<pass count>`
Assertions unchanged: `git diff -- tests/` empty.

**PR:** <url>
```
