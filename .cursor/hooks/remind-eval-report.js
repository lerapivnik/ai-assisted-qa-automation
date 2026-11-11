#!/usr/bin/env node
'use strict';

/**
 * stop hook: after an agent turn ends, nudge a follow-up to regenerate eval-report.md
 * when the session looked like orchestration / generation / heal / triage work.
 * Fail-open: never block the stop.
 */

const fs = require('fs');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function main() {
  let payload = {};
  try {
    const raw = readStdin();
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = {};
  }

  const status = String(payload.status || payload.reason || '');
  // Only follow up on a completed agent stop, not aborts, when loop budget remains.
  if (/abort|error|reject/i.test(status)) {
    process.stdout.write('{}\n');
    return;
  }

  const transcript = [
    payload.last_assistant_message,
    payload.summary,
    payload.status_message,
    JSON.stringify(payload).slice(0, 4000),
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase();

  const orchestrationSignals =
    /test-writer|triage|bug-reporter|self-heal|jira-ticket-to-gherkin|eval-report|orchestrat|tests-generated|npx playwright test|heal on red|generation-gate|ds-\d+/i.test(
      transcript,
    );

  if (!orchestrationSignals) {
    process.stdout.write('{}\n');
    return;
  }

  const alreadyDone =
    /eval-report\.md/.test(transcript) &&
    (/npm run eval:report|write-eval-report|eval:report/.test(transcript) ||
      /regenerat(?:e|ed) eval-report/.test(transcript));

  if (alreadyDone) {
    process.stdout.write('{}\n');
    return;
  }

  process.stdout.write(
    JSON.stringify({
      followup_message:
        'Regenerate the suite reliability report now: apply .cursor/skills/eval-report/SKILL.md — update .cursor/eval-ask-vs-guess.json for this session’s asks vs guesses, then run npm run eval:report and leave eval-report.md current. Do not commit unless asked.',
    }) + '\n',
  );
}

main();
