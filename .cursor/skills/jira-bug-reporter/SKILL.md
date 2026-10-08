---
name: jira-bug-reporter
description: Analyzes Playwright test failures, identifies root cause, and creates detailed Jira bug tickets. Use when a test fails and needs investigation and bug reporting.
---

# Jira Bug Reporter

Turn a Playwright failure into a Jira **Bug** linked to the original story ticket. Do not file a product bug when the failure is a bad test, flake, missing env, or infra.

## Steps

1. Collect the failure: terminal output, HTML report, and artifacts under `test-results/`
2. Identify the original ticket from the spec name (`tests/ds1-*.spec.ts` → `DS-1`), feature tags (`@DS-1`), `features/<KEY>.feature` header, or the user
3. Read the failed spec, matching `.feature`, and the original Jira ticket (expected behavior)
4. Classify root cause: **product bug** vs **test defect** vs **environment**
5. If product bug: gather screenshots, create a Bug, attach evidence, link it to the original ticket
6. Return the new Bug key and URL. If not a product bug, explain why and do not create a ticket

## Classify the failure

| Kind | Signals | Action |
|------|---------|--------|
| Product bug | UI/API disagrees with ticket ACs or the test's expected result | Create Bug |
| Test defect | Wrong locator, stale assertion, invented behavior, timing without product error | Fix the test; no Bug |
| Environment | Missing `.env`, login failure, app down, wrong `DIDAXIS_URL` | Report blocker; no Bug |

Search for duplicates first (`issuetype = Bug AND issue in linkedIssues("DS-1")` plus a summary keyword search). Reuse an existing Bug unless this is a distinct failure.

## Original ticket

- Specs: `tests/dsN-*.spec.ts` map to `DS-N`
- Features: `features/DS-N.feature` (header includes the Jira URL)
- Project key is the ticket prefix (this repo: `DS`)
- Same `cloudId` / project as the original ticket

## Evidence

Look in `test-results/` for `*.png`, `*.webm`, and `trace.zip`. `playwright.config.js` does not capture screenshots by default.

If no screenshot exists, re-run only the failed test:

```bash
npx playwright test <spec-path> -g "<test title>" --project=chromium --screenshot=only-on-failure --trace=on
```

Attach every relevant screenshot (and video/trace if small enough to be useful). Never paste credentials from `.env` into Jira.

## Jira lookup and create

1. If `cloudId` is unknown, call `getAccessibleAtlassianResources` once and reuse it
2. `getJiraIssue` on the original key with `view: full` (or `evidence`)
3. `createJiraIssue` with `issueType: Bug`, `projectKey` from the original ticket, summary as the **title**
4. Link the Bug to the original ticket
5. Upload screenshots onto the new Bug

### Title

`[<original-key>] <short observed failure>`

Example: `[DS-1] Create stays enabled when Program Name is empty`

### Description template

Use markdown (`createJiraIssue` converts it to ADF). Fill every section from the failure and the original ACs — no placeholders.

```markdown
## Steps to reproduce
1. ...
2. ...

## Expected results
...

## Actual results
...

## Source
- Failed test: `tests/<file>.spec.ts` (test: "<title>", line <n>)
- Feature: `features/<KEY>.feature` (scenario: "<name>")
- Root cause: <one sentence>
```

Prefer numbered user-facing steps (login → navigate → action). Expected = ticket AC / test assertion. Actual = Playwright error plus what the UI did. Retry from `repairHint` if create fails.

### Link to original ticket

After create, call `discover` if needed, then `executeWrite`:

- `name`: `createJiraIssueLink`
- `linkType`: `Relates` (confirm with `listJiraIssueLinkTypes` if the name is rejected)
- `inwardIssue`: new Bug key
- `outwardIssue`: original ticket key

### Attach screenshots

For each local evidence file, `executeWrite` `uploadAttachmentToJiraIssue` in two phases:

1. `filePath` + `issueIdOrKey` (new Bug) → run the returned `uploadCommand` in the shell → get `fileId`
2. Call again with that `fileId` + `issueIdOrKey` to attach it to the Bug

Do not skip attachments when screenshot files exist. If upload fails, put the local paths in the Bug description and tell the user.

## Output

Reply with:

- New Bug key and URL
- Linked original ticket
- Classification (product bug) and one-line root cause
- What evidence was attached
