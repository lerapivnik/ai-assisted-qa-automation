# DS-259 — Delete program with confirmation
# Jira: https://legionqaschool.atlassian.net/browse/DS-259
# Story: As an admin user, I want to delete a program I no longer need, with a confirmation step to prevent accidental deletion.
# Live crawl: Delete uses a native confirm dialog, not an in-page dialog.
# Message pattern: Delete program "<name>"? All its semesters and courses will be removed. This cannot be undone.
# Playwright: covered by tests/ds4-delete-program.spec.ts (shared with DS-4; duplicate ds259 spec removed).

Feature: Delete program with confirmation

  # Happy paths

  @DS-259 @AC-delete
  Scenario: Delete program with confirmation
    Given a program "Test Program" exists
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog
    When I confirm deletion
    Then "Test Program" is removed from the program list

  @DS-259 @AC-cancel
  Scenario: Cancel program deletion
    Given a program "Test Program" exists
    When I click the delete icon for "Test Program"
    And I see the confirmation dialog
    And I click Cancel
    Then "Test Program" still exists in the list

  # Negative

  @DS-259
  Scenario: Dismissing the confirmation leaves the program in the list
    Given a program "Test Program" exists
    When I click the delete icon for "Test Program"
    And I dismiss the confirmation dialog
    Then "Test Program" still exists in the list

  # Edge cases

  @DS-259
  Scenario: Confirmation names the program and warns that delete cannot be undone
    Given a program "Test Program" exists
    When I click the delete icon for "Test Program"
    Then the confirmation message includes "Test Program"
    And the message warns that semesters and courses will be removed
    And the message states the action cannot be undone

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
  # - Live wcag2a/wcag2aa scan on the Programs page reported color-contrast, impact serious, 893 nodes. Do not disable rules.
  # - The confirmation is a browser confirm dialog. Accept removes the program. The in-page role=dialog locator does not match it.
  # - AC says "click Cancel". The native dialog's dismiss control is the confirm Cancel button. No separate in-page Cancel was present.
  # - AC does not define deleting a program that still has semesters beyond the warning text, or double-click on delete.
