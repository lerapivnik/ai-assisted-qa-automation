#!/usr/bin/env node
'use strict';

/**
 * afterFileEdit guard for constitution WON'T rules.
 * hooks.json matcher is "Write" (tool type). Path scope (tests/**, pages/**)
 * is enforced here from file_path on stdin.
 */

const fs = require('fs');
const { spawnSync } = require('child_process');

const EXPECT_TOKEN = 'expect(';
const SCOPED_PATH = /(?:^|[/\\])(?:tests|pages)[/\\]/;

const INTRODUCED_CHECKS = [
  {
    id: 'waitForTimeout',
    reason: 'page.waitForTimeout (hard-coded sleep)',
    pattern: /\.waitForTimeout\s*\(/,
  },
  {
    id: 'xpath',
    reason: 'XPath locator',
    pattern: /\.locator\s*\(\s*(['"`])\s*(?:\/\/|xpath\s*=)/i,
  },
  {
    id: 'any',
    reason: 'the any type',
    pattern: /(?:\bas\s+any\b|:\s*any\b|<any>)/,
  },
  {
    id: 'hardcoded-credential',
    reason: 'hardcoded credential',
    pattern:
      /(?:password|passwd|pwd|secret|token|api[_-]?key|bearer)\s*[:=]\s*(['"`])(?!process\.env)[^'"`\n]+\1/i,
  },
  {
    id: 'describe-tag',
    reason: 'tag on test.describe()',
    pattern:
      /test\.describe(?:\.\w+)?\s*\(\s*(?:`[^`]*`|'[^']*'|"[^"]*")\s*,\s*\{[\s\S]*?\btag\s*:/,
  },
];

function finish(exitCode, message) {
  const payload =
    exitCode === 0
      ? { permission: 'allow', agent_message: message }
      : {
          permission: 'deny',
          user_message: message,
          agent_message: message,
        };
  fs.writeSync(1, JSON.stringify(payload) + '\n');
  if (message) fs.writeSync(2, message + '\n');
  process.exit(exitCode);
}

function toPosix(filePath) {
  return String(filePath).replace(/\\/g, '/');
}

function countExpectCalls(source) {
  let count = 0;
  let index = 0;
  while (index < source.length) {
    const found = source.indexOf(EXPECT_TOKEN, index);
    if (found === -1) break;
    count += 1;
    index = found + EXPECT_TOKEN.length;
  }
  return count;
}

function countCommentedExpectCalls(source) {
  let commented = 0;
  let inLine = false;
  let inBlock = false;
  let quote = null;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (inLine) {
      if (ch === '\n') inLine = false;
      else if (source.startsWith(EXPECT_TOKEN, i)) {
        commented += 1;
        i += EXPECT_TOKEN.length - 1;
      }
      continue;
    }

    if (inBlock) {
      if (ch === '*' && next === '/') {
        inBlock = false;
        i += 1;
        continue;
      }
      if (source.startsWith(EXPECT_TOKEN, i)) {
        commented += 1;
        i += EXPECT_TOKEN.length - 1;
      }
      continue;
    }

    if (quote) {
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }

    if (ch === '/' && next === '/') {
      inLine = true;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlock = true;
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
    }
  }

  return commented;
}

function countPattern(source, pattern) {
  const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
  const matches = source.match(new RegExp(pattern.source, flags));
  return matches ? matches.length : 0;
}

function introducedViolations(before, after) {
  const found = [];
  for (const check of INTRODUCED_CHECKS) {
    const beforeCount = countPattern(before, check.pattern);
    const afterCount = countPattern(after, check.pattern);
    if (afterCount > beforeCount) {
      found.push(check.reason + ' (+' + (afterCount - beforeCount) + ')');
    }
  }
  return found;
}

function weakeningReason(before, after) {
  const beforeCount = countExpectCalls(before);
  const afterCount = countExpectCalls(after);
  if (afterCount < beforeCount) {
    return (
      'removed/weakened expect( (count ' + beforeCount + ' -> ' + afterCount + ')'
    );
  }

  const beforeCommented = countCommentedExpectCalls(before);
  const afterCommented = countCommentedExpectCalls(after);
  if (afterCommented > beforeCommented) {
    return (
      'removed/weakened expect( (commented ' +
      beforeCommented +
      ' -> ' +
      afterCommented +
      ')'
    );
  }

  return null;
}

function gitHeadSource(filePath) {
  const cwd = toPosix(process.cwd()).replace(/\/+$/, '');
  let relative = toPosix(filePath);
  if (relative.toLowerCase().startsWith(cwd.toLowerCase() + '/')) {
    relative = relative.slice(cwd.length + 1);
  }
  const shown = spawnSync('git', ['show', 'HEAD:' + relative], {
    encoding: 'utf8',
    cwd: process.cwd(),
  });
  if (shown.status !== 0) return null;
  return shown.stdout;
}

function reverseEdits(after, edits) {
  let before = after;
  for (let i = edits.length - 1; i >= 0; i -= 1) {
    const inserted = edits[i].new_string ?? '';
    const removed = edits[i].old_string ?? '';
    if (!inserted) return null;
    const first = before.indexOf(inserted);
    if (first === -1 || first !== before.lastIndexOf(inserted)) return null;
    before = before.slice(0, first) + removed + before.slice(first + inserted.length);
  }
  return before;
}

function sourcesFromEdit(filePath, edits) {
  const hunkBefore = edits.map((edit) => edit.old_string ?? '').join('\n');
  const hunkAfter = edits.map((edit) => edit.new_string ?? '').join('\n');

  let after = null;
  try {
    after = fs.readFileSync(filePath, 'utf8');
  } catch {
    after = null;
  }

  if (after != null) {
    const before = reverseEdits(after, edits);
    if (before != null) return { before, after, via: 'file' };
  }

  return { before: hunkBefore, after: hunkAfter, via: 'edits' };
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  raw += chunk;
});
process.stdin.on('end', () => {
  let input;
  try {
    input = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    finish(2, 'guard-constitution-wont BLOCK: hook input was not valid JSON');
  }

  const filePath = input.file_path || input.filePath || input.path || '';
  if (!filePath) {
    finish(2, 'guard-constitution-wont BLOCK: stdin JSON had no file_path');
  }

  const display = toPosix(filePath);
  if (!SCOPED_PATH.test(filePath)) {
    finish(0, 'guard-constitution-wont ALLOW ' + display + ': outside tests/** and pages/**');
  }

  const edits = Array.isArray(input.edits) ? input.edits : [];
  let before;
  let after;
  let via;

  if (edits.length > 0) {
    ({ before, after, via } = sourcesFromEdit(filePath, edits));
  } else {
    try {
      after = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      finish(
        2,
        'guard-constitution-wont BLOCK ' +
          display +
          ': could not read the edited file (' +
          error.message +
          ')'
      );
    }
    before = gitHeadSource(filePath);
    via = 'git';
    if (before == null) {
      finish(
        0,
        'guard-constitution-wont ALLOW ' + display + ': no prior revision to compare'
      );
    }
  }

  const introduced = introducedViolations(before, after);
  if (introduced.length > 0) {
    finish(
      2,
      'guard-constitution-wont BLOCK ' +
        display +
        ': ' +
        introduced.join('; ') +
        ' [' +
        via +
        ']'
    );
  }

  const weakened = weakeningReason(before, after);
  if (weakened) {
    finish(2, 'guard-constitution-wont BLOCK ' + display + ': ' + weakened + ' [' + via + ']');
  }

  finish(
    0,
    'guard-constitution-wont ALLOW ' +
      display +
      ': no WON\'T violations [' +
      via +
      ']'
  );
});
