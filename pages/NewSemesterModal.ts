import { type Locator, type Page } from '@playwright/test';

export class NewSemesterModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly semesterName: Locator;
  readonly startDate: Locator;
  readonly endDate: Locator;
  readonly createButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog', { name: 'New Semester' });
    this.semesterName = this.dialog.getByLabel('Semester Name');
    this.startDate = this.dialog.getByLabel('Start Date');
    this.endDate = this.dialog.getByLabel('End Date');
    this.createButton = this.dialog.getByRole('button', {
      name: 'Create Semester',
      exact: true,
    });
  }

  async fillName(name: string): Promise<void> {
    await this.semesterName.fill(name);
  }

  async fillStartDate(value: string): Promise<void> {
    await this.startDate.fill(value);
  }

  async fillEndDate(value: string): Promise<void> {
    await this.endDate.fill(value);
  }

  async fill(name: string, startDate: string, endDate: string): Promise<void> {
    await this.fillName(name);
    await this.fillStartDate(startDate);
    await this.fillEndDate(endDate);
  }

  async clickCreate(): Promise<void> {
    await this.createButton.click();
  }
}
