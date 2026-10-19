import { type Locator, type Page } from '@playwright/test';
import { EditProgramModal } from './EditProgramModal';
import { NewProgramModal } from './NewProgramModal';

export class ProgramsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly newProgramButton: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  readonly programColumnHeader: Locator;
  readonly alerts: Locator;
  readonly failureMessage: Locator;
  readonly searchPlaceholder: Locator;
  readonly searchTextbox: Locator;
  readonly filterButton: Locator;
  readonly newProgramModal: NewProgramModal;
  readonly editProgramModal: EditProgramModal;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Programs' });
    this.newProgramButton = page.getByRole('button', { name: '+ New Program' });
    this.table = page.getByRole('table');
    this.rows = page.getByRole('row');
    this.programColumnHeader = page.getByRole('columnheader', { name: 'Program' });
    this.alerts = page.getByRole('alert');
    this.failureMessage = page.getByText(/conflict|already|error|failed/i);
    this.searchPlaceholder = page.getByPlaceholder(/search/i);
    this.searchTextbox = page.getByRole('textbox', { name: /search/i });
    this.filterButton = page.getByRole('button', { name: /filter/i });
    this.newProgramModal = new NewProgramModal(page);
    this.editProgramModal = new EditProgramModal(page);
  }

  async goto(options?: { waitForList?: boolean }): Promise<void> {
    if (options?.waitForList) {
      const programsLoaded = this.page.waitForResponse(
        (response) =>
          response.url().includes('/api/programs') &&
          response.request().method() === 'GET' &&
          response.ok(),
        { timeout: 90_000 },
      );
      await this.page.goto('/programs');
      await programsLoaded;
      return;
    }
    await this.page.goto('/programs');
  }

  async reloadList(): Promise<void> {
    const programsLoaded = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/programs') &&
        response.request().method() === 'GET' &&
        response.ok(),
      { timeout: 90_000 },
    );
    await this.page.reload();
    await programsLoaded;
  }

  async openNewProgramForm(): Promise<void> {
    await this.newProgramButton.click();
  }

  async openEditForm(name: string): Promise<void> {
    await this.programEditButton(name).click();
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

  async clickDelete(name: string): Promise<void> {
    const button = this.programDeleteButton(name);
    await button.scrollIntoViewIfNeeded();
    await button.click();
  }

  async dblclickDelete(name: string): Promise<void> {
    const button = this.programDeleteButton(name);
    await button.scrollIntoViewIfNeeded();
    await button.dblclick();
  }

  programEditButton(name: string): Locator {
    return this.page.getByRole('button', { name: `Edit ${name}`, exact: true });
  }

  programDeleteButton(name: string): Locator {
    return this.page.getByRole('button', { name: `Delete ${name}`, exact: true });
  }

  programRow(name: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.programEditButton(name),
    });
  }

  programRowsMatching(editNamePattern: RegExp): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByRole('button', { name: editNamePattern }),
    });
  }

  programEditButtonsMatching(pattern: RegExp): Locator {
    return this.page.getByRole('button', { name: pattern });
  }

  programNameInList(name: string): Locator {
    return this.programRow(name).getByText(name, { exact: true });
  }

  programDescriptionInList(name: string, description: string): Locator {
    return this.programRow(name).getByText(description);
  }

  programParagraphs(name: string): Locator {
    return this.programRow(name).getByRole('paragraph');
  }

  async listedProgramNames(editNamePattern: RegExp): Promise<string[]> {
    const rows = this.programRowsMatching(editNamePattern);
    const count = await rows.count();
    const names: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const nameLine = await rows.nth(i).getByRole('paragraph').nth(0).innerText();
      names.push(nameLine.trim());
    }
    return names;
  }
}
