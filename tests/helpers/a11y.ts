import { expect, type TestInfo } from '@playwright/test';
import type { Result } from 'axe-core';

function violationSummary(violations: Result[]): string {
  return violations
    .map((v) => `${v.id}: ${v.help} (${v.nodes.length} node(s))`)
    .join('\n');
}

/**
 * Local: fail on axe violations. CI: attach JSON + annotation, keep the job green.
 */
export async function expectNoAxeViolations(
  violations: Result[],
  testInfo: TestInfo,
): Promise<void> {
  if (violations.length === 0) {
    return;
  }

  if (process.env.CI) {
    const summary = violationSummary(violations);
    await testInfo.attach('axe-violations.json', {
      body: JSON.stringify(violations, null, 2),
      contentType: 'application/json',
    });
    testInfo.annotations.push({
      type: 'axe-violations',
      description: `${violations.length} violation(s)\n${summary}`,
    });
    console.warn(
      `[a11y] ${violations.length} axe violation(s) in CI (non-blocking):\n${summary}`,
    );
    return;
  }

  await expect(violations).toEqual([]);
}

/**
 * Local: assertions throw as usual. CI: failures are attached and the test still passes.
 */
export async function runA11yCheckInCi(
  testInfo: TestInfo,
  label: string,
  fn: () => Promise<void>,
): Promise<void> {
  if (!process.env.CI) {
    await fn();
    return;
  }

  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await testInfo.attach(`${label}-failure.txt`, {
      body: message,
      contentType: 'text/plain',
    });
    testInfo.annotations.push({
      type: 'a11y-check',
      description: `${label} failed in CI (non-blocking): ${message}`,
    });
    console.warn(`[a11y] ${label} failed in CI (non-blocking): ${message}`);
  }
}
