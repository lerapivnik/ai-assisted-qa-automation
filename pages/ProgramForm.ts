import { type Locator } from '@playwright/test';

/** Shared fields on the New Program and Edit Program dialogs. */
export class ProgramForm {
  readonly root: Locator;
  readonly programName: Locator;
  readonly description: Locator;
  readonly showAiConfigButton: Locator;
  readonly totalProgramHours: Locator;
  readonly defaultSessionHours: Locator;
  readonly defaultExamHours: Locator;
  readonly targetAudience: Locator;
  readonly focusAreas: Locator;
  readonly syncAsyncRatio: Locator;
  readonly closeButton: Locator;
  readonly alerts: Locator;

  constructor(root: Locator) {
    this.root = root;
    this.programName = root.getByLabel('Program Name');
    this.description = root.getByLabel('Description');
    this.showAiConfigButton = root.getByRole('button', {
      name: 'Show AI Generation Config',
    });
    this.totalProgramHours = root.getByLabel('Total Program Hours');
    this.defaultSessionHours = root.getByLabel('Default Session Hours');
    this.defaultExamHours = root.getByLabel('Default Exam Hours');
    this.targetAudience = root.getByLabel('Target Audience');
    this.focusAreas = root.getByLabel('Focus Areas');
    this.syncAsyncRatio = root.getByText('Sync/Async Ratio: 70% sync / 30% async');
    // Icon-only Mantine close control has no accessible name, label, or test id.
    this.closeButton = root.getByRole('button', { name: '', exact: true });
    this.alerts = root.getByRole('alert');
  }

  async fill(name: string, description?: string): Promise<void> {
    await this.programName.fill(name);
    if (description) {
      await this.description.fill(description);
    }
  }

  /**
   * CSS selector for axe `.include()` — axe only accepts selectors, not Playwright locators.
   * Derived from the same dialog element Playwright resolves by role + name.
   */
  async a11yIncludeSelector(): Promise<string> {
    return this.root.evaluate((el) => {
      if (el.id) {
        return `#${CSS.escape(el.id)}`;
      }
      const role = el.getAttribute('role');
      const labelledBy = el.getAttribute('aria-labelledby');
      if (role && labelledBy) {
        return `[role="${role}"][aria-labelledby="${labelledBy}"]`;
      }
      const label = el.getAttribute('aria-label');
      if (role && label) {
        return `[role="${role}"][aria-label="${label}"]`;
      }
      throw new Error('Program dialog has no stable attributes for axe include');
    });
  }
}
