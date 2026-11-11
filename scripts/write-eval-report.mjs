#!/usr/bin/env node
/**
 * Regenerates eval-report.md from CI logs + PR history (+ optional ask/guess overrides).
 * Cursor has no built-in telemetry for these metrics — this script is the measurement path.
 *
 * Usage:
 *   node scripts/write-eval-report.mjs
 *   node scripts/write-eval-report.mjs --asks 1 --guesses 2
 *   node scripts/write-eval-report.mjs --window 10
 *
 * Env:
 *   EVAL_ASKS / EVAL_GUESSES — same as --asks / --guesses
 *   EVAL_WINDOW — same as --window (default 10)
 *   EVAL_ASK_GUESS_FILE — path to JSON { asks, guesses, notes } (default .cursor/eval-ask-vs-guess.json)
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'eval-report.md');
const ASK_GUESS_DEFAULT = path.join(ROOT, '.cursor', 'eval-ask-vs-guess.json');

function parseArgs(argv) {
  const out = {
    window: Number(process.env.EVAL_WINDOW || 10),
    asks: process.env.EVAL_ASKS !== undefined ? Number(process.env.EVAL_ASKS) : undefined,
    guesses: process.env.EVAL_GUESSES !== undefined ? Number(process.env.EVAL_GUESSES) : undefined,
    askGuessFile: process.env.EVAL_ASK_GUESS_FILE || ASK_GUESS_DEFAULT,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--window') out.window = Number(argv[++i]);
    else if (a === '--asks') out.asks = Number(argv[++i]);
    else if (a === '--guesses') out.guesses = Number(argv[++i]);
    else if (a === '--ask-guess-file') out.askGuessFile = argv[++i];
  }
  return out;
}

function ghJson(args) {
  const raw = execFileSync('gh', args, {
    encoding: 'utf8',
    cwd: ROOT,
    maxBuffer: 32 * 1024 * 1024,
  });
  return JSON.parse(raw);
}

function ghText(args) {
  try {
    return execFileSync('gh', args, {
      encoding: 'utf8',
      cwd: ROOT,
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (err) {
    return err.stdout?.toString?.() || '';
  }
}

function parsePlaywrightSummary(log) {
  // gh run view --log prefixes each line with job/step/timestamp; match the summary tokens anywhere.
  const flakyMatch = [...log.matchAll(/(?:^|\s)(\d+)\s+flaky\b/gm)];
  const passedMatch = [...log.matchAll(/(?:^|\s)(\d+)\s+passed(?:\s+\(|\b)/gm)];
  const failedMatch = [...log.matchAll(/(?:^|\s)(\d+)\s+failed\b/gm)];
  const flaky = flakyMatch.length ? Number(flakyMatch[flakyMatch.length - 1][1]) : 0;
  const passed = passedMatch.length ? Number(passedMatch[passedMatch.length - 1][1]) : 0;
  const failed = failedMatch.length ? Number(failedMatch[failedMatch.length - 1][1]) : 0;
  const flakyTests = [];
  const flakyBlock = log.match(/(?:^|\s)(\d+)\s+flaky\b([\s\S]*?)(?:(?:^|\s)\d+\s+skipped\b|(?:^|\s)\d+\s+passed(?:\s+\(|\b))/m);
  if (flakyBlock) {
    for (const m of flakyBlock[2].matchAll(/\[chromium\][^\n]+/g)) {
      flakyTests.push(m[0].trim());
    }
  }
  return { flaky, passed, failed, flakyTests, parseable: passed > 0 || flaky > 0 || failed > 0 };
}

function measureFlake(window) {
  const runs = ghJson([
    'run',
    'list',
    '--workflow=e2e.yml',
    '--limit',
    String(Math.max(window * 2, 20)),
    '--json',
    'databaseId,conclusion,status,displayTitle,createdAt,event,url',
  ]);
  const completed = runs.filter((r) => r.status === 'completed' && r.conclusion !== 'cancelled');
  const sampled = [];
  for (const run of completed) {
    if (sampled.length >= window) break;
    const log = ghText(['run', 'view', String(run.databaseId), '--log']);
    const summary = parsePlaywrightSummary(log);
    if (!summary.parseable) continue;
    sampled.push({ ...run, ...summary });
  }
  const flakySum = sampled.reduce((a, r) => a + r.flaky, 0);
  const denom = sampled.reduce((a, r) => a + r.flaky + r.passed, 0);
  const rate = denom === 0 ? null : flakySum / denom;
  return { sampled, flakySum, denom, rate };
}

function isHealPr(pr) {
  return (
    /^heal\//i.test(pr.headRefName || '') ||
    /^Heal:/i.test(pr.title || '') ||
    (pr.labels || []).some((l) => /heal/i.test(l.name || ''))
  );
}

function isGeneratedPr(pr) {
  if (isHealPr(pr)) return false;
  const labeled = (pr.labels || []).some((l) => l.name === 'tests-generated');
  const branch = /^(test|cursor)\//i.test(pr.headRefName || '');
  const title = /^DS-\d+/i.test(pr.title || '');
  return labeled || (branch && title);
}

function firstPrChecksGreen(prNumber) {
  // Use chronological check-suite / workflow runs on the PR.
  const runs = ghJson([
    'run',
    'list',
    '--limit',
    '30',
    '--json',
    'databaseId,conclusion,status,event,createdAt,displayTitle,url,headBranch',
  ]);
  // Prefer pull_request runs whose title/branch match — fall back to gh pr checks chronology via API.
  const pr = ghJson(['pr', 'view', String(prNumber), '--json', 'commits,statusCheckRollup,headRefName,title,url,labels,createdAt']);
  const prRuns = ghJson([
    'api',
    `repos/{owner}/{repo}/actions/runs?event=pull_request&per_page=30`,
  ]);
  const branch = pr.headRefName;
  const matching = (prRuns.workflow_runs || [])
    .filter((r) => r.head_branch === branch && r.name === 'E2E Tests')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  if (matching.length === 0) {
    return { hasCi: false, firstGreen: null, firstConclusion: null, firstUrl: null, pr };
  }
  const first = matching[0];
  return {
    hasCi: true,
    firstGreen: first.conclusion === 'success',
    firstConclusion: first.conclusion,
    firstUrl: first.html_url,
    pr,
  };
}

function measureHeal() {
  const prs = ghJson([
    'pr',
    'list',
    '--state',
    'all',
    '--limit',
    '50',
    '--json',
    'number,title,labels,createdAt,mergedAt,state,url,headRefName,files',
  ]);
  // files may not be in list — fetch heal PRs individually
  const healPrs = prs.filter(isHealPr);
  let healedClean = 0;
  let masked = 0;
  const details = [];
  for (const pr of healPrs) {
    const files = ghJson(['api', `repos/{owner}/{repo}/pulls/${pr.number}/files`]);
    const paths = files.map((f) => f.filename);
    const onlyPom = paths.length > 0 && paths.every((p) => p.startsWith('pages/'));
    const touchedTests = paths.some((p) => p.startsWith('tests/'));
    // Masked regression: heal PR changed assertions / tests/. Must stay 0.
    if (touchedTests) masked += 1;
    const clean = onlyPom && !touchedTests && (pr.state === 'MERGED' || pr.mergedAt);
    if (clean) healedClean += 1;
    details.push({
      number: pr.number,
      title: pr.title,
      url: pr.url,
      onlyPom,
      touchedTests,
      state: pr.state,
      clean,
    });
  }
  const total = healPrs.length;
  return {
    healedClean,
    total,
    rate: total === 0 ? null : healedClean / total,
    masked,
    details,
  };
}

function measureGenerationGate() {
  const prs = ghJson([
    'pr',
    'list',
    '--state',
    'all',
    '--limit',
    '50',
    '--json',
    'number,title,labels,createdAt,mergedAt,state,url,headRefName,body',
  ]);
  const labeled = prs.filter((pr) => (pr.labels || []).some((l) => l.name === 'tests-generated'));
  const results = [];
  for (const pr of labeled) {
    const ci = firstPrChecksGreen(pr.number);
    // Conforming + maps-to-AC: PR body/title references a DS-* ticket and is not an env-blocked stub.
    const mapsToAc = /DS-\d+/i.test(pr.title) || /DS-\d+/i.test(pr.body || '');
    const envBlocked = /DIDAXIS_URL is unset|Live UI recon was skipped|environment/i.test(pr.body || '');
    const pass = Boolean(ci.hasCi && ci.firstGreen && mapsToAc && !envBlocked);
    results.push({
      number: pr.number,
      title: pr.title,
      url: pr.url,
      hasCi: ci.hasCi,
      firstGreen: ci.firstGreen,
      firstConclusion: ci.firstConclusion,
      mapsToAc,
      envBlocked,
      pass,
    });
  }
  const passCount = results.filter((r) => r.pass).length;
  const total = results.length;
  return {
    passCount,
    total,
    rate: total === 0 ? null : passCount / total,
    results,
  };
}

function loadAskGuess(args) {
  let asks = args.asks;
  let guesses = args.guesses;
  let notes = '';
  let source = 'cli/env';
  if ((asks === undefined || guesses === undefined) && fs.existsSync(args.askGuessFile)) {
    const j = JSON.parse(fs.readFileSync(args.askGuessFile, 'utf8'));
    if (asks === undefined) asks = Number(j.asks);
    if (guesses === undefined) guesses = Number(j.guesses);
    notes = j.notes || '';
    source = path.relative(ROOT, args.askGuessFile).replace(/\\/g, '/');
  }
  if (asks === undefined || guesses === undefined || Number.isNaN(asks) || Number.isNaN(guesses)) {
    return {
      asks: null,
      guesses: null,
      notes:
        notes ||
        'Not measured this run — set .cursor/eval-ask-vs-guess.json or pass --asks/--guesses after session review.',
      source: 'unmeasured',
      ratio: null,
    };
  }
  return {
    asks,
    guesses,
    notes,
    source,
    ratio: guesses === 0 ? (asks === 0 ? 'n/a' : `${asks}:0`) : `${asks}:${guesses}`,
  };
}

function pct(rate) {
  if (rate === null || rate === undefined || Number.isNaN(rate)) return 'n/a';
  return `${(rate * 100).toFixed(1)}%`;
}

function frac(n, d) {
  if (d === 0) return '0/0';
  return `${n}/${d}`;
}

function writeReport({ window, flake, heal, gate, askGuess, generatedAt }) {
  const flakeLines = flake.sampled
    .map(
      (r) =>
        `- ${r.createdAt.slice(0, 10)} run [${r.databaseId}](${r.url}): **${r.flaky}** flaky / ${r.passed} passed` +
        (r.flakyTests.length
          ? ` — ${r.flakyTests
              .slice(0, 3)
              .map((t) => t.replace(/^\[chromium\]\s*›\s*/, ''))
              .join('; ')}${r.flakyTests.length > 3 ? '…' : ''}`
          : ''),
    )
    .join('\n');

  const healLines = heal.details.length
    ? heal.details
        .map(
          (d) =>
            `- [#${d.number}](${d.url}) ${d.title} — ${d.clean ? 'healed cleanly' : 'not clean'} (POM-only=${d.onlyPom}, touched tests/=${d.touchedTests}, state=${d.state})`,
        )
        .join('\n')
    : '- No heal PRs found.';

  const gateLines = gate.results.length
    ? gate.results
        .map(
          (r) =>
            `- [#${r.number}](${r.url}) ${r.title} — gate ${r.pass ? 'PASS' : 'FAIL'} (first CI=${r.hasCi ? r.firstConclusion : 'none'}; maps-to-AC=${r.mapsToAc}; env-blocked=${r.envBlocked})`,
        )
        .join('\n')
    : '- No `tests-generated` PRs found.';

  const topRisk =
    flake.rate !== null && flake.rate > 0.01
      ? 'Retry-masked flakes are already hiding timing/shared-tenant races (Playwright `flaky` counts are non-zero on recent green jobs).'
      : gate.rate === 0
        ? 'Generation gate is failing: labeled generated PRs are not green+conforming+AC-mapped on the first CI run.'
        : heal.masked > 0
          ? 'Heal path changed tests/ — masked-regression count is non-zero.'
          : 'Insufficient labeled generation volume to trust the generation gate; keep measuring every run.';

  const nextAction =
    flake.rate !== null && flake.rate > 0.01
      ? 'Stabilize the top flaky specs (create/edit/list races): assert on list reload / response boundaries instead of short default timeouts; do not raise retries.'
      : gate.total === 0
        ? 'Unblock `test-generation.yml` Jira "In Progress" intake so labeled PRs exist to score.'
        : 'Re-run `node scripts/write-eval-report.mjs` after the next generation or orchestration session and keep masked regressions at 0.';

  const askNumber =
    askGuess.asks === null
      ? 'unmeasured'
      : `${askGuess.asks} asked / ${askGuess.guesses} guessed (${askGuess.ratio})`;

  const md = `# Suite reliability report

Generated: **${generatedAt}** (UTC). Window: last **${flake.sampled.length}** parseable \`e2e.yml\` runs (requested ${window}).

Cursor has **no built-in telemetry** for these metrics. Numbers below come from CI logs, PR history, and (for ask-vs-guess) session review.

## Flake rate

**${pct(flake.rate)}** — ${flake.flakySum} tests passed only on retry / ${flake.denom} passed-or-flaky outcomes.

How measured: \`gh run list --workflow=e2e.yml\`, then \`gh run view <id> --log\`, counting Playwright’s \`N flaky\` (failed then passed on retry) against \`flaky + passed\` in each run’s summary.

What it tells us: Retries (${'`'}retries: CI ? 2 : 0${'`'}) are absorbing intermittent failures; a non-zero rate means green CI still hides race conditions.

${flakeLines || '- No parseable runs in window.'}

## Heal success rate

**${pct(heal.rate)}** — ${frac(heal.healedClean, heal.total)} drift heals cleaned (POM-only, merged/open heal PR without \`tests/\` edits).

**Masked regressions: ${heal.masked}** (must be **0** — any heal PR that touches \`tests/\` counts).

How measured: PR history (\`heal/*\` branches / \`Heal:\` titles); \`gh api .../pulls/<n>/files\` to verify POM-only diffs and zero \`tests/\` paths.

What it tells us: Whether locator drift is repaired without weakening assertions; a non-zero masked count means the heal path lied about “assertions unchanged.”

${healLines}

## Generation-gate pass rate

**${pct(gate.rate)}** — ${frac(gate.passCount, gate.total)} \`tests-generated\` PRs green + AC-mapped + not env-blocked on **first** PR CI run.

How measured: PRs with label \`tests-generated\`; first \`pull_request\` \`E2E Tests\` workflow run for that branch; title/body must reference \`DS-*\`; bodies that admit skipped live recon / unset env fail the gate.

What it tells us: Whether the generation loop ships reviewable, AC-faithful specs that pass without a follow-up fix commit.

${gateLines}

## Ask-vs-guess

**${askNumber}**

How measured: Session review of agent transcripts / orchestration chat (Cursor exposes no ask/guess counters). Overrides via \`.cursor/eval-ask-vs-guess.json\` or \`--asks\` / \`--guesses\`. Source this run: \`${askGuess.source}\`${askGuess.notes ? ` — ${askGuess.notes.replace(/\.\s*$/, '')}` : ''}.

What it tells us: Whether the agent stops for missing values (locale, copy, credentials, AC gaps) or invents them into plans/specs.

## Top reliability risk

${topRisk}

## Next action

${nextAction}

---

Regenerate with \`npm run eval:report\` (or \`node scripts/write-eval-report.mjs\`). Required after \`.github/workflows/test-generation.yml\` finishes and after any local agent/orchestrator session — see \`.cursor/skills/eval-report/SKILL.md\`.
`;

  fs.writeFileSync(OUT, md, 'utf8');
  return OUT;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const generatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const flake = measureFlake(args.window);
  const heal = measureHeal();
  const gate = measureGenerationGate();
  const askGuess = loadAskGuess(args);
  const out = writeReport({ window: args.window, flake, heal, gate, askGuess, generatedAt });
  process.stdout.write(
    JSON.stringify(
      {
        out: path.relative(ROOT, out).replace(/\\/g, '/'),
        flakeRate: flake.rate,
        flakySum: flake.flakySum,
        heal: `${heal.healedClean}/${heal.total}`,
        maskedRegressions: heal.masked,
        generationGate: `${gate.passCount}/${gate.total}`,
        askGuess: { asks: askGuess.asks, guesses: askGuess.guesses },
      },
      null,
      2,
    ) + '\n',
  );
}

main();
