---
name: ci-failure-triage
description: When a CI run is red, pull the run's logs and the playwright-report artifact via gh CLI, read the Playwright error and trace, cross-reference the spec, POM, and app source in the repo, classify real app bug vs test issue, and post a structured diagnosis to the PR. Use whenever a build fails — even if triage isn't asked for.
---

# CI Failure Triage

Apply on any red CI / failed build / failed E2E run — even if the user does not ask for triage.

## Steps

1. Pull the failed run's logs + playwright-report artifact (GitHub MCP / gh CLI).
2. Read the Playwright error: failing test, expected vs received, trace path.
3. Cross-reference: the spec, the POM, and the Didaxis source in the repo if exist.
4. Classify: real app bug (route to a Jira bug via bug-reporter) vs test issue (propose a patch for human review).
5. Report: post root cause, affected file, expected/actual, suggested fix, and evidence (trace/screenshot + run id) as a PR comment.

## Rules

- Never merge a fix automatically — propose, a human approves.
- For a real defect, reuse the bug-reporter skill and link the story.
- The diagnosis must name the source location and cause, not just the symptom.

## Pull the run

Prefer `gh`. Use GitHub MCP tools if they are available and equivalent.

Workflow: `.github/workflows/e2e.yml` (name: `E2E Tests`). Artifact: `playwright-report`.

```bash
gh pr view --json number,url,headRefOid,statusCheckRollup
gh run list --workflow=e2e.yml --limit 10
gh run view <run-id> --log-failed
gh run download <run-id> --name playwright-report --dir playwright-report-ci
```

If the user pasted a run or Actions URL, extract the run id from it. Do not re-run the suite to triage.

## Read the Playwright error

From `--log-failed` and the downloaded report:

- Failing spec + title + project (usually `chromium`)
- Expected vs received / timeout / locator / assertion
- Trace / screenshot paths inside the report (this repo uses `trace: 'on-first-retry'`; screenshots are not on by default)

Open `playwright-report-ci/index.html` (or `data/` payloads) and any embedded `trace.zip`. Quote the assertion and the first app-relevant frame, not only `Error: expect(...)`.

## Cross-reference

| Layer | Where |
|-------|--------|
| Spec | `tests/<file>.spec.ts` (ticket specs: `tests/dsN-*.spec.ts` → `DS-N`) |
| Feature | `features/DS-N.feature` |
| POM | `pages/` — tests must not use inline locators |
| Helpers | `tests/helpers/`, `fixtures/` |
| Didaxis app | Only if present in this workspace or a path the user attached |

Read the failing assertion, the POM method it called, and (if present) the Didaxis handler/component for that UI. Name the file and symbol that caused the mismatch.

## Classify

| Kind | Signals | Action |
|------|---------|--------|
| Real app bug | UI/API disagrees with ticket ACs or the spec's expected result | Follow `.cursor/skills/jira-bug-reporter/SKILL.md`; link the story; put the Bug key in the PR comment |
| Test issue | Wrong locator, stale assertion, invented behavior, missing POM, flake/timing with no product error | Propose a patch for human review — do not commit, push, or merge |
| Environment | Missing secrets, login failure, app down, wrong `DIDAXIS_URL` | Report as a blocker; no Bug; no test patch |

## Report (PR comment)

```bash
gh pr comment <n> --body-file - <<'EOF'
## CI failure diagnosis

**Run:** <run-id> — <run URL>
**Classification:** real app bug | test issue | environment

### Root cause
<source file + symbol + why it failed — not only the symptom>

### Affected file
`<path>` (`<symbol>`, around line <n>)

### Expected vs actual
- Expected: ...
- Actual: ...

### Suggested fix
...

### Evidence
- Failed test: `tests/<file>.spec.ts` ("<title>")
- Trace / screenshot: <path or "not in artifact">
- Run id: <run-id>
- Story / Bug: <DS-N> / <bug key if filed>
EOF
```

Also summarize the same diagnosis in chat. Never `gh pr merge` or land a fix as part of triage.
