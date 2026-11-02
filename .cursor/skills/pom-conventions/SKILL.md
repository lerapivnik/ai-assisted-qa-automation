---
name: pom-conventions
description: Page Object Model conventions for Playwright tests in this
  project. Apply whenever generating, refactoring, or reviewing any
  Playwright test that interacts with the Didaxis UI — even if the user
  doesn't say "POM". Tests should never contain inline locators.
---

# Page Object Model Conventions

All UI interactions go through Page Objects in `pages/`. Tests describe
intent; POMs handle mechanics.

## Steps

1. One Page Object class per page or distinct component.
   Examples: `LoginPage`, `ProgramsPage`, `NewProgramModal`.

2. Define locators as `readonly` properties in the constructor, in this
   priority order only:
   `getByRole` → `getByLabel` / `getByPlaceholder` → `getByText` →
   `getByTestId` (escape hatch only — comment why nothing higher worked).
   Never CSS selectors, XPath, or brittle text.

3. If a locator matches more than one element, disambiguate with
   `.filter({ hasText })` — do not use `.first()`.

4. Provide methods for user actions: `goto`, `clickX`, `fillY`, `submit`.
   Methods perform actions; they do not assert. Never use
   `waitForTimeout` inside POMs — callers wait with web-first
   `expect(locator).toBeVisible()` / `.toBeEnabled()` / `.toHaveText()`.
   `page.route` fulfill for API edge cases stays in the spec. Page
   objects do not stub the network.

5. **No assertions inside Page Objects.** All `expect(...)` calls
   live in the test files, never in `pages/`. Prefer auto-retrying
   web-first expects; never `expect(await locator.isVisible()).toBe(true)`.

6. Compose POMs when a page contains distinct components — e.g.
   `ProgramsPage` holds a `NewProgramModal` instance.

7. Import POMs at the top of each spec; instantiate with `new XxxPage(page)`.

   A spec that asserts a relative timestamp calls `page.clock.install({ time })` in the spec before navigation. Page objects do not install or pause the clock.

8. Accessibility specs use the same POMs. The programs page is reached with
   `ProgramsPage` (and `NewProgramModal` for the dialog). Role-based locators
   only. Methods such as tab-to-primary-control perform the action; `expect`
   (`toBeFocused()`, dialog visible, `expect(results.violations).toEqual([])`)
   stays in the spec. Do not put an axe scan inside a page object. Add a
   selector for `.include()` / `.exclude()` only when a third-party widget is
   noisy, and the spec comments why.

## Output
Page Object files in `pages/`. Tests in `tests/` that import them.
