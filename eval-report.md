# Suite reliability report

Generated: **2026-11-13T14:03:48Z** (UTC). Window: last **10** parseable `e2e.yml` runs (requested 10).

Cursor has **no built-in telemetry** for these metrics. Numbers below come from CI logs, PR history, and (for ask-vs-guess) session review.

## Flake rate

**1.5%** — 10 tests passed only on retry / 688 passed-or-flaky outcomes.

How measured: `gh run list --workflow=e2e.yml`, then `gh run view <id> --log`, counting Playwright’s `N flaky` (failed then passed on retry) against `flaky + passed` in each run’s summary.

What it tells us: Retries (`retries: CI ? 2 : 0`) are absorbing intermittent failures; a non-zero rate means green CI still hides race conditions.

- 2026-11-11 run [42950772576](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42950772576): **0** flaky / 43 passed
- 2026-11-11 run [42950061954](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42950061954): **0** flaky / 24 passed
- 2026-11-11 run [42949122785](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42949122785): **0** flaky / 36 passed
- 2026-11-11 run [42946961750](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42946961750): **0** flaky / 14 passed
- 2026-11-11 run [42946955356](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42946955356): **0** flaky / 36 passed
- 2026-11-11 run [42946572767](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42946572767): **0** flaky / 108 passed
- 2026-11-11 run [42941170370](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42941170370): **1** flaky / 107 passed — tests/ds256-create-program.spec.ts:56:9 › Create new academic program › authenticated admin › Create stays disabled when Description is filled and Program Name is empty
- 2026-11-11 run [42939499619](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42939499619): **0** flaky / 108 passed
- 2026-11-10 run [42742312543](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42742312543): **7** flaky / 100 passed — tests/ds259-delete-program.spec.ts:77:9 › DS-259 — Delete program with confirmation › authenticated admin › cancel program deletion; tests/ds295-new-semester-required-fields.spec.ts:59:9 › Validate New Semester required fields › authenticated admin › Create Semester stays disabled when only Semester Name is entered; tests/ds3-program-name-validation.spec.ts:27:9 › Program name validation and duplicate prevention › authenticated admin › TC-001: program name with special characters is accepted and saved…
- 2026-11-10 run [42735087329](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42735087329): **2** flaky / 102 passed — tests/ds2-edit-program.spec.ts:245:9 › Edit existing program details › authenticated admin › TC-014: optional AI fields accept input and save without blocking edit; tests/ds5-program-list-display.spec.ts:225:9 › Program list filtering and display › authenticated admin › TC-011: program list updates immediately after editing a program

## Heal success rate

**100.0%** — 1/1 drift heals cleaned (POM-only, merged/open heal PR without `tests/` edits).

**Masked regressions: 0** (must be **0** — any heal PR that touches `tests/` counts).

How measured: PR history (`heal/*` branches / `Heal:` titles); `gh api .../pulls/<n>/files` to verify POM-only diffs and zero `tests/` paths.

What it tells us: Whether locator drift is repaired without weakening assertions; a non-zero masked count means the heal path lied about “assertions unchanged.”

- [#7](https://github.com/lerapivnik/ai-assisted-qa-automation/pull/7) Heal: ProgramsPage programColumnHeader drift (run 42273030185) — healed cleanly (POM-only=true, touched tests/=false, state=MERGED)

## Generation-gate pass rate

**0.0%** — 0/1 `tests-generated` PRs green + AC-mapped + not env-blocked on **first** PR CI run.

How measured: PRs with label `tests-generated`; first `pull_request` `E2E Tests` workflow run for that branch; title/body must reference `DS-*`; bodies that admit skipped live recon / unset env fail the gate.

What it tells us: Whether the generation loop ships reviewable, AC-faithful specs that pass without a follow-up fix commit.

- [#8](https://github.com/lerapivnik/ai-assisted-qa-automation/pull/8) DS-295: Validate New Semester required fields — gate FAIL (first CI=failure; maps-to-AC=true; env-blocked=false)

## Ask-vs-guess

**1 asked / 0 guessed (1:0)**

How measured: Session review of agent transcripts / orchestration chat (Cursor exposes no ask/guess counters). Overrides via `.cursor/eval-ask-vs-guess.json` or `--asks` / `--guesses`. Source this run: `.cursor/eval-ask-vs-guess.json` — test-generation 2026-11-13: 1 ask — working Atlassian auth or In Progress ticket keys (ATLASSIAN_API_TOKEN 401 for legion.jira@proton.me @ legionqaschool.atlassian.net; ATLASSIAN_PASSWORD empty; Atlassian MCP needsAuth and interactive mcp_auth unavailable). 0 invented ticket keys, ACs, or product copy.

What it tells us: Whether the agent stops for missing values (locale, copy, credentials, AC gaps) or invents them into plans/specs.

## Top reliability risk

Retry-masked flakes are already hiding timing/shared-tenant races (Playwright `flaky` counts are non-zero on recent green jobs).

## Next action

Stabilize the top flaky specs (create/edit/list races): assert on list reload / response boundaries instead of short default timeouts; do not raise retries.

---

Regenerate with `npm run eval:report` (or `node scripts/write-eval-report.mjs`). Required after `.github/workflows/test-generation.yml` finishes and after any local agent/orchestrator session — see `.cursor/skills/eval-report/SKILL.md`.
