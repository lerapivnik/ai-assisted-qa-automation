# DS-256 — Create new academic program
# Jira: https://legionqaschool.atlassian.net/browse/DS-256
# Story: As an admin user, I want to create a new academic program so that I can begin designing its curriculum structure.
# Live crawl: https://test.didaxis.studio/programs on 2026-11-03. Admin sign-in reaches Dashboard, then Programs.
# Playwright: covered by tests/ds1-create-program.spec.ts (shared with DS-1; duplicate ds256 spec removed).

Feature: Create new academic program

  # Happy paths

  @DS-256 @AC-navigate
  Scenario: Navigate to program creation form
    Given I am logged in as admin
    When I navigate to the Programs page
    And I click "+ New Program"
    Then I see the program creation form with fields Program Name and Description

  @DS-256 @AC-create
  Scenario: Successfully create a program
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"

  # Negative

  @DS-256 @AC-validation
  Scenario: Validation prevents empty program name
    Given I am on the program creation form
    When I leave the Program Name field empty
    Then the Create button is disabled

  @DS-256
  Scenario: Create stays disabled when Description is filled and Program Name is empty
    Given I am on the program creation form
    When I leave the Program Name field empty
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled

  @DS-256
  Scenario: Cancel closes the form without adding the program
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Cancel
    Then the modal closes
    And the program list does not show that new "Web Development 2026" row

  # Edge cases

  @DS-256
  Scenario: Create program when Description is left empty
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I leave the Description field empty
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"

  # Accessibility

  Scenario: Programs page meets WCAG 2.0 A and AA
    Given the user is on the Programs page
    When the page is scanned with tags wcag2a and wcag2aa
    Then there are no accessibility violations

  Scenario: Keyboard opens the New Program dialog
    Given the user is on the Programs page
    When the user tabs to the primary control
    Then that control is focused
    When the user presses Enter
    Then the New Program dialog opens

  # Ambiguities (review with PO)
  # - Live wcag2a/wcag2aa scan on the Programs page reported color-contrast, impact serious, 893 nodes. Generation stopped before Playwright. Do not disable rules.
  # - The New Program dialog also shows Total Program Hours, Default Session Hours, Default Exam Hours, Target Audience, Focus Areas, and Show AI Generation Config. Those fields are not in the Jira AC.
  # - AC does not say whether Description is required. Live Program Name is marked required; Description is not.
  # - AC does not define Cancel, duplicate names, max length, or success copy beyond the modal closing and the name appearing in the list.
  # - Empty Program Name leaves Create disabled on the live form (confirmed).
