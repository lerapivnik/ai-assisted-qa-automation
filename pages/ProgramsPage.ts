import { type Locator, type Page } from '@playwright/test';
import { NewProgramModal } from './NewProgramModal';

export class ProgramsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly newProgramButton: Locator;
  readonly newProgramModal: NewProgramModal;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Programs' });
    this.newProgramButton = page.getByRole('button', { name: '+ New Program' });
    this.newProgramModal = new NewProgramModal(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/programs');
  }

  async openNewProgramForm(): Promise<void> {
    await this.newProgramButton.click();
  }

  /** Tab from document until {@link newProgramButton} receives focus. */
  async tabToNewProgramButton(maxPresses = 40): Promise<void> {
    for (let i = 0; i < maxPresses; i++) {
      const focused = await this.newProgramButton.evaluate(
        (el) => el === document.activeElement,
      );
      if (focused) {
        return;
      }
      await this.page.keyboard.press('Tab');
    }
    throw new Error('Tab navigation did not focus + New Program');
  }

  async createProgram(name: string, description?: string): Promise<void> {
    await this.newProgramModal.submit(name, description);
  }

  programEditButton(name: string): Locator {
    return this.page.getByRole('button', { name: `Edit ${name}` });
  }

  programRow(name: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.programEditButton(name),
    });
  }

  programNameInList(name: string): Locator {
    return this.programRow(name).getByText(name, { exact: true });
  }

  programDescriptionInList(name: string, description: string): Locator {
    return this.programRow(name).getByText(description);
  }
}
