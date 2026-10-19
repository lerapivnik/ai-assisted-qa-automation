import { type Locator, type Page } from '@playwright/test';

export class NewProgramModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly programName: Locator;
  readonly description: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog', { name: 'New Program' });
    this.programName = this.dialog.getByLabel('Program Name');
    this.description = this.dialog.getByLabel('Description');
    this.createButton = this.dialog.getByRole('button', { name: 'Create' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }

  async fill(name: string, description?: string): Promise<void> {
    await this.programName.fill(name);
    if (description) {
      await this.description.fill(description);
    }
  }

  async submit(name: string, description?: string): Promise<void> {
    await this.fill(name, description);
    await this.createButton.click();
  }

  /**
   * CSS selector for axe `.include()` — axe only accepts selectors, not Playwright locators.
   * Derived from the same {@link dialog} element Playwright resolves by role + name.
   */
  async a11yIncludeSelector(): Promise<string> {
    return this.dialog.evaluate((el) => {
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
      throw new Error('New Program dialog has no stable attributes for axe include');
    });
  }
}
