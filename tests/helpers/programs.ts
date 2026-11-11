import {
  expect,
  isProgramCreateResponse,
  trackCreateFromResponse,
} from '../../fixtures/cleanup.fixture';
import { ProgramsPage } from '../../pages/ProgramsPage';

export function uniqueName(base: string): string {
  // Parallel workers can share the same millisecond; add entropy for strict-mode-safe rows.
  return `${base} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function nameOfLength(length: number): string {
  const suffix = ` ${Date.now()}`;
  return `${'A'.repeat(length - suffix.length)}${suffix}`;
}

/** Assert the new program row after create on the shared-tenant list. */
export async function expectProgramListed(
  programsPage: ProgramsPage,
  name: string,
): Promise<void> {
  await expect(programsPage.programNameInList(name)).toBeVisible({
    timeout: 30_000,
  });
}

export async function createTrackedProgram(
  programsPage: ProgramsPage,
  trackProgram: (uuid: string) => void,
  name: string,
  description?: string,
): Promise<void> {
  const modal = programsPage.newProgramModal;
  await programsPage.openNewProgramForm();
  const createResponse = programsPage.page.waitForResponse(isProgramCreateResponse);
  await programsPage.createProgram(name, description);
  await trackCreateFromResponse(await createResponse, trackProgram);
  await expect(modal.dialog).toBeHidden({ timeout: 45_000 });
  // Shared tenant: create may not paint the row until the list is reloaded.
  await programsPage.reloadList();
  await expectProgramListed(programsPage, name);
}

export async function clickCreateAndTrack(
  programsPage: ProgramsPage,
  trackProgram: (uuid: string) => void,
): Promise<void> {
  const createResponse = programsPage.page.waitForResponse(isProgramCreateResponse);
  await programsPage.newProgramModal.createButton.click();
  await trackCreateFromResponse(await createResponse, trackProgram);
}
