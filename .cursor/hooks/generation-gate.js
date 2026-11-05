#!/usr/bin/env node
'use strict';

const fs = require('fs');

// afterFileEdit matchers are compared to the tool name "Write", so the
// tests/** scope is applied here from the edited file path.
const TESTS_SPEC = /(?:^|\/)tests\/.+\.(?:spec|test)\.[cm]?[jt]sx?$/i;

function respond(exitCode, message) {
  const permission = exitCode === 0 ? 'allow' : 'deny';
  const payload = {
    permission,
    user_message: message,
    agent_message: message,
  };
  fs.writeSync(1, JSON.stringify(payload) + '\n');
  if (message) fs.writeSync(2, message + '\n');
  process.exit(exitCode);
}

function isSpecUnderTests(filePath) {
  return TESTS_SPEC.test(String(filePath).replace(/\\/g, '/'));
}

function locatorArguments(source) {
  const args = [];
  const token = 'page.locator(';
  let from = 0;
  while (from < source.length) {
    const start = source.indexOf(token, from);
    if (start === -1) break;
    let i = start + token.length;
    while (i < source.length && /\s/.test(source[i])) i += 1;
    const quote = source[i];
    if (quote !== "'" && quote !== '"' && quote !== '`') {
      from = start + token.length;
      continue;
    }
    i += 1;
    let arg = '';
    let closed = false;
    while (i < source.length) {
      const ch = source[i];
      if (ch === '\\') {
        arg += source[i + 1] ?? '';
        i += 2;
        continue;
      }
      if (ch === quote) {
        closed = true;
        i += 1;
        break;
      }
      arg += ch;
      i += 1;
    }
    if (closed) args.push(arg);
    from = Math.max(i, start + token.length);
  }
  return args;
}

function violations(source) {
  const found = [];
  if (!source.includes('expect(')) {
    found.push('spec contains no expect( (a test that asserts nothing)');
  }
  for (const arg of locatorArguments(source)) {
    if (arg.includes('.') || arg.includes('#') || arg.includes('//')) {
      found.push('CSS or XPath locator page.locator(' + JSON.stringify(arg) + ')');
    }
  }
  return found;
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  raw += chunk;
});
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    respond(2, 'generation-gate BLOCK: hook input was not valid JSON');
  }

  const filePath = input.file_path || input.filePath || '';
  if (!filePath || !isSpecUnderTests(filePath)) {
    respond(0, '');
  }

  let source;
  try {
    source = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    respond(
      2,
      'generation-gate BLOCK ' + filePath + ': could not read the edited spec (' + error.message + ')'
    );
  }

  const found = violations(source);
  const display = filePath.replace(/\\/g, '/');
  if (found.length > 0) {
    respond(2, 'generation-gate BLOCK ' + display + ': ' + found.join('; '));
  }

  respond(0, 'generation-gate ALLOW ' + display);
});
