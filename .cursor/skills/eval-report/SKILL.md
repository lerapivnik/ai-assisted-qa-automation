---
name: eval-report
description: >
  Regenerates eval-report.md (flake rate, heal success, generation-gate,
  ask-vs-guess). Always apply after test-generation.yml finishes, after any
  agent or orchestrator run (local or CI), or when the user asks for a
  reliability / eval report.
---

# Eval report

Rewrite `eval-report.md` every time the generation workflow finishes or any agent/orchestrator session ends. Cursor has no built-in telemetry for these metrics — measure from CI logs, PR history, and this session’s ask/guess count.

## When

- `.github/workflows/test-generation.yml` completed (CI step or local follow-up)
- After triggering test-writer, triage, bug-reporter, self-heal, or the QA orchestrator — even locally
- On request for a reliability / eval / flake report

## Steps

1. Update ask-vs-guess for **this** session before regenerating CI-backed numbers.

   Count times the agent **asked** the human for a missing value (locale, timezone, copy, credentials, AC gap, skill scope) versus **invented/guessed** a value into a plan, spec, or tag.

   Write `.cursor/eval-ask-vs-guess.json`:

   ```json
   {
     "asks": 0,
     "guesses": 0,
     "notes": "one-line evidence"
   }
   ```

   If this session had neither, keep the previous file and say so in `notes`. Do not invent ask/guess counts.

2. Regenerate the report from evidence:

   ```bash
   npm run eval:report
   ```

   Same as `node scripts/write-eval-report.mjs`. Needs `gh` auth. Optional: `--window N`, `--asks N`, `--guesses N`.

3. Skim `eval-report.md`: flake rate, heal success + **masked regressions (must be 0)**, generation-gate, ask-vs-guess, top risk, next action.

4. Do not weaken tests to improve numbers. Do not raise Playwright retries. Commit `eval-report.md` only when the human asks.

## Output contract

Each metric section must include: the number, how it was measured, one line on what it tells us. End with top reliability risk and next action. The script enforces that shape.
