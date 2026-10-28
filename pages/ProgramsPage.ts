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
  readonly deleteActions: Locator;
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
    this.deleteActions = page.getByRole('button', { name: /^Delete / });
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

  /**
   * Tab from the matching Edit control until {@link programDeleteButton} receives focus.
   * Starts on the same row so the crowded shared-tenant list is not walked from the top.
   */
  async tabToDeleteButton(name: string, maxPresses = 10): Promise<void> {
    const deleteButton = this.programDeleteButton(name);
    await deleteButton.scrollIntoViewIfNeeded();
    await this.programEditButton(name).focus();
    for (let i = 0; i < maxPresses; i++) {
      const focused = await deleteButton.evaluate(
        (el) => el === document.activeElement,
      );
      if (focused) {
        return;
      }
      await this.page.keyboard.press('Tab');
    }
    const focusedAfterLastTab = await deleteButton.evaluate(
      (el) => el === document.activeElement,
    );
    if (focusedAfterLastTab) {
      return;
    }
    throw new Error(`Tab navigation did not focus Delete ${name}`);
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

  /**
   * CSS selector for axe `.include()` on the Delete ActionIcon.
   * Axe only accepts selectors, not Playwright locators. Derived from the
   * role-based {@link programDeleteButton} element.
   */
  async deleteButtonA11ySelector(name: string): Promise<string> {
    return this.programDeleteButton(name).evaluate((el, programName) => {
      if (el.id) {
        return `#${CSS.escape(el.id)}`;
      }
      const label = el.getAttribute('aria-label');
      if (label && el.tagName === 'BUTTON') {
        return `button[aria-label="${CSS.escape(label)}"]`;
      }
      const role = el.getAttribute('role');
      if (label && role) {
        return `[role="${role}"][aria-label="${CSS.escape(label)}"]`;
      }
      throw new Error(
        `Delete control for "${programName}" has no id or aria-label for axe include`,
      );
    }, name);
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
    return this.programParagraphs(name).nth(0);
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
