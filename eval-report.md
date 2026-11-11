# Suite reliability report

Generated: **2026-11-11T02:25:10Z** (UTC). Window: last **10** parseable `e2e.yml` runs (requested 10).

Cursor has **no built-in telemetry** for these metrics. Numbers below come from CI logs, PR history, and (for ask-vs-guess) session review.

## Flake rate

**1.2%** — 12 tests passed only on retry / 989 passed-or-flaky outcomes.

How measured: `gh run list --workflow=e2e.yml`, then `gh run view <id> --log`, counting Playwright’s `N flaky` (failed then passed on retry) against `flaky + passed` in each run’s summary.

What it tells us: Retries (`retries: CI ? 2 : 0`) are absorbing intermittent failures; a non-zero rate means green CI still hides race conditions.

- 2026-11-11 run [42941170370](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42941170370): **1** flaky / 107 passed — tests/ds256-create-program.spec.ts:56:9 › Create new academic program › authenticated admin › Create stays disabled when Description is filled and Program Name is empty
- 2026-11-11 run [42939499619](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42939499619): **0** flaky / 108 passed
- 2026-11-10 run [42742312543](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42742312543): **7** flaky / 100 passed — tests/ds259-delete-program.spec.ts:77:9 › DS-259 — Delete program with confirmation › authenticated admin › cancel program deletion; tests/ds295-new-semester-required-fields.spec.ts:59:9 › Validate New Semester required fields › authenticated admin › Create Semester stays disabled when only Semester Name is entered; tests/ds3-program-name-validation.spec.ts:27:9 › Program name validation and duplicate prevention › authenticated admin › TC-001: program name with special characters is accepted and saved…
- 2026-11-10 run [42735087329](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42735087329): **2** flaky / 102 passed — tests/ds2-edit-program.spec.ts:245:9 › Edit existing program details › authenticated admin › TC-014: optional AI fields accept input and save without blocking edit; tests/ds5-program-list-display.spec.ts:225:9 › Program list filtering and display › authenticated admin › TC-011: program list updates immediately after editing a program
- 2026-11-10 run [42733713172](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42733713172): **0** flaky / 104 passed
- 2026-11-10 run [42733677356](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42733677356): **0** flaky / 98 passed
- 2026-11-10 run [42733012448](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42733012448): **2** flaky / 90 passed — tests/ds1-create-program.spec.ts:209:9 › Create new academic program › authenticated admin › TC-010: program name with only whitespace is treated as empty; tests/ds1-create-program.spec.ts:368:9 › Create new academic program › authenticated admin › TC-019: closing the dialog with X does not add the program and keeps typed values
- 2026-11-10 run [42732508293](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42732508293): **0** flaky / 92 passed
- 2026-11-07 run [42409499687](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42409499687): **0** flaky / 88 passed
- 2026-11-07 run [42323593626](https://github.com/lerapivnik/ai-assisted-qa-automation/actions/runs/42323593626): **0** flaky / 88 passed

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

**1 asked / 2 guessed (1:2)**

How measured: Session review of agent transcripts / orchestration chat (Cursor exposes no ask/guess counters). Overrides via `.cursor/eval-ask-vs-guess.json` or `--asks` / `--guesses`. Source this run: `.cursor/eval-ask-vs-guess.json` — Rolling session review (orchestration/generation chats + this eval setup): 1 explicit ask (exploratory-charter skill location: project vs personal); 2 invented values (DS-296 field-preservation asserts later triaged as invented; smoke/sanity/regression tag map applied across the suite without confirming each classification). This eval-report session invented no product values (metrics measured from CI/PR/session evidence).

What it tells us: Whether the agent stops for missing values (locale, copy, credentials, AC gaps) or invents them into plans/specs.

## Top reliability risk

Retry-masked flakes are already hiding timing/shared-tenant races (Playwright `flaky` counts are non-zero on recent green jobs).

## Next action

Stabilize the top flaky specs (create/edit/list races): assert on list reload / response boundaries instead of short default timeouts; do not raise retries.

---

Regenerate with `npm run eval:report` (or `node scripts/write-eval-report.mjs`). Required after `.github/workflows/test-generation.yml` finishes and after any local agent/orchestrator session — see `.cursor/skills/eval-report/SKILL.md`.
