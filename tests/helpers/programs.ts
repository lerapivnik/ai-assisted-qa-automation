import {
  expect,
  isProgramCreateResponse,
  trackCreateFromResponse,
} from '../../fixtures/cleanup.fixture';
import { ProgramsPage } from '../../pages/ProgramsPage';

export function uniqueName(base: string): string {
  return `${base} ${Date.now()}`;
}

export function nameOfLength(length: number): string {
  const suffix = ` ${Date.now()}`;
  return `${'A'.repeat(length - suffix.length)}${suffix}`;
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
  await expect(programsPage.programNameInList(name)).toBeVisible();
}

export async function clickCreateAndTrack(
  programsPage: ProgramsPage,
  trackProgram: (uuid: string) => void,
): Promise<void> {
  const createResponse = programsPage.page.waitForResponse(isProgramCreateResponse);
  await programsPage.newProgramModal.createButton.click();
  await trackCreateFromResponse(await createResponse, trackProgram);
}
