import { type Locator, type Page } from '@playwright/test';
import { ProgramForm } from './ProgramForm';

export class NewProgramModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly form: ProgramForm;
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
  readonly createButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog', { name: 'New Program' });
    this.form = new ProgramForm(this.dialog);
    this.programName = this.form.programName;
    this.description = this.form.description;
    this.showAiConfigButton = this.form.showAiConfigButton;
    this.totalProgramHours = this.form.totalProgramHours;
    this.defaultSessionHours = this.form.defaultSessionHours;
    this.defaultExamHours = this.form.defaultExamHours;
    this.targetAudience = this.form.targetAudience;
    this.focusAreas = this.form.focusAreas;
    this.syncAsyncRatio = this.form.syncAsyncRatio;
    this.closeButton = this.form.closeButton;
    this.alerts = this.form.alerts;
    this.createButton = this.dialog.getByRole('button', { name: 'Create' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }

  async fill(name: string, description?: string): Promise<void> {
    await this.form.fill(name, description);
  }

  async submit(name: string, description?: string): Promise<void> {
    await this.fill(name, description);
    await this.createButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }

  async dblclickCreate(): Promise<void> {
    await this.createButton.dblclick();
  }

  async a11yIncludeSelector(): Promise<string> {
    return this.form.a11yIncludeSelector();
  }
}
