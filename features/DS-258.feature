# DS-258 — Program name validation and duplicate prevention
# Jira: https://legionqaschool.atlassian.net/browse/DS-258
# Story: As an admin user, I want the system to prevent invalid or duplicate program names so that data integrity is maintained.
# Live crawl: Program Name of three spaces leaves Create disabled. An identical name was accepted twice (two persisted ids).
# Playwright: covered by tests/ds3-program-name-validation.spec.ts (shared with DS-3; no separate ds258 spec).

Feature: Program name validation and duplicate prevention

  # Happy paths

  @DS-258 @AC-special-characters
  Scenario: Accept program name with special characters
    Given I am on the program creation form
    When I enter "Informatique & IA - Niveau 2" as the program name
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the program is created successfully
    And the program list shows "Informatique & IA - Niveau 2"

  # Negative

  @DS-258 @AC-whitespace
  Scenario: Reject program name with only whitespace
    Given I am on the program creation form
    When I enter "   " as the program name
    And I click Create
    Then the form is not submitted
    And the program name is trimmed and treated as empty

  @DS-258 @AC-duplicate
  Scenario: Reject duplicate program name
    Given a program "Web Development 2026" already exists
    When I try to create a new program with the name "Web Development 2026"
    Then I see an error indicating the name already exists
    And the program list contains one program named "Web Development 2026"

  @DS-258
  Scenario: Empty Program Name does not create a program
    Given I am on the program creation form
    When I leave the Program Name field empty
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled
    And no program is created

  # Edge cases

  @DS-258
  Scenario: Program name with leading and trailing spaces is not stored as whitespace-only
    Given I am on the program creation form
    When I enter "  Informatique & IA - Niveau 2  " as the program name
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the program list shows a trimmed name "Informatique & IA - Niveau 2"

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
  # - Whitespace AC says click Create. Live Create is disabled when Program Name is "   ", so the click cannot submit. Confirmed 2026-11-03.
  # - Duplicate AC was not met on the live app. Creating "Recon Dup 1793758060370" twice persisted two programs (e049e622-c7b2-4dd5-85dd-d584db911a9f and 111edbc2-583e-400f-a9f3-910d945eaf95). Both were deleted afterward. The error sentence was not shown. Do not invent that sentence in a spec.
  # - Trimming of leading and trailing spaces was not observed. The edge scenario states the AC implication only.
  # - AC does not define case-insensitive duplicates or duplicates on rename.
