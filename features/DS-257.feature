# DS-257 — Edit existing program details
# Jira: https://legionqaschool.atlassian.net/browse/DS-257
# Story: As an admin user, I want to edit an existing program's details so that I can correct or update program information after creation.
# Live crawl: Edit control accessible name is "Edit <program name>". Dialog name is "Edit Program". Name and Description are pre-filled. Save is enabled.
# Playwright: covered by tests/ds2-edit-program.spec.ts (shared with DS-2; duplicate ds257 spec removed).

Feature: Edit existing program details

  # Happy paths

  @DS-257 @AC-open-edit
  Scenario: Open program for editing
    Given I am on the Programs page
    And a program "Web Development 2026" exists
    When I click the edit icon on "Web Development 2026"
    Then I see the edit form pre-populated with the program's current data

  @DS-257 @AC-edit-name
  Scenario: Successfully edit a program name
    Given I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated"
    And I click Save
    Then the modal closes
    And the program list immediately shows "Web Development 2026 - Updated"

  @DS-257 @AC-preserve-fields
  Scenario: Edit preserves unchanged fields
    Given I am editing a program named "Web Development 2026" with Description "Full-stack web development program"
    When I only change the Description to "Updated full-stack web development program"
    And I click Save
    Then the Name stays "Web Development 2026"
    And the Description shows "Updated full-stack web development program"

  # Negative

  @DS-257
  Scenario: Cancel edit leaves the list name and description unchanged
    Given I am editing "Web Development 2026" with Description "Full-stack web development program"
    When I change the Name to "Web Development 2026 - Updated"
    And I click Cancel
    Then the modal closes
    And the program list still shows "Web Development 2026"
    And the program list still shows "Full-stack web development program"

  @DS-257
  Scenario: Clearing Program Name does not save an empty name
    Given I am editing "Web Development 2026"
    When I clear the Program Name field
    Then the Save button is disabled

  # Edge cases

  @DS-257
  Scenario: Edit form shows the selected program Name and Description
    Given a program "Web Development 2026" exists with Description "Full-stack web development program"
    When I click the edit icon on "Web Development 2026"
    Then the Name field shows "Web Development 2026"
    And the Description field shows "Full-stack web development program"

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
  # - AC says "other fields remain unchanged" but does not name them. The live edit form also has Total Program Hours, Default Session Hours, Default Exam Hours, Target Audience, Focus Areas, and sync/async ratio.
  # - AC does not define Cancel, empty name on edit, or duplicate rename.
  # - "Immediately" is not defined as a toast versus the row updating in place. Live Save was not submitted during recon, so the save outcome is unverified.
  # - Clearing Program Name was not submitted on the live edit form; the disabled-Save scenario records the create-form rule and needs confirmation on edit.
