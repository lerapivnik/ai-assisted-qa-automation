# DS-4 — Delete program with confirmation
# Jira: https://legionqaschool.atlassian.net/browse/DS-4
# Story: As an admin user, I want to delete a program I no longer need, with a confirmation step to prevent accidental deletion.

Feature: Delete program with confirmation

  # Happy paths

  @DS-4 @AC-delete
  Scenario: Delete program with confirmation
    Given I am logged in as admin
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog
    When I confirm deletion
    Then "Test Program" is removed from the program list

  @DS-4 @AC-cancel
  Scenario: Cancel program deletion
    Given I am logged in as admin
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    And I see the confirmation dialog
    And I click Cancel
    Then "Test Program" still exists in the list

  @DS-4
  Scenario: Confirmation dialog names the program and warns that the delete cannot be undone
    Given I am logged in as admin
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog
    And the message includes "Test Program"
    And the message warns that semesters and courses will be removed
    And the message states the action cannot be undone

  # Negative

  @DS-4
  Scenario: Dismissing the confirmation leaves the program in the list
    Given I am logged in as admin
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    And I dismiss the confirmation dialog without confirming
    Then "Test Program" still exists in the list

  @DS-4
  Scenario: Unauthenticated user cannot delete a program
    Given I am not logged in
    When I navigate to the Programs page
    Then I am redirected to /login
    And I see "Sign in to your account"
    And I do not see any Delete actions

  @DS-4
  Scenario: Confirmed deletion does not leave a leftover Delete action for that program
    Given I am logged in as admin
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    And I confirm deletion
    Then I do not see a Delete action for "Test Program"

  # Edge cases

  @DS-4
  Scenario: Program with special characters in the name can be deleted
    Given I am logged in as admin
    And a program "Informatique & IA - Niveau 2" exists
    When I click the delete icon for "Informatique & IA - Niveau 2"
    And I confirm deletion
    Then "Informatique & IA - Niveau 2" is removed from the program list

  @DS-4
  Scenario: Deleted program stays gone after the Programs page is reloaded
    Given I am logged in as admin
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    And I confirm deletion
    And I reload the Programs page
    Then "Test Program" is not in the program list

  @DS-4
  Scenario: Confirmation dialog includes the full name of a very long program
    Given I am logged in as admin
    And a program with a 255-character name exists
    When I click the delete icon for that program
    Then the confirmation message includes the full program name
    And I can cancel the deletion
    And the program still exists in the list

  # Ambiguities (review with PO)
  # - AC says "confirmation dialog"; the live app uses native window.confirm() with OK/Cancel, not an in-app Mantine modal (related: DS-172, DS-210).
  # - AC says "click Cancel"; Playwright dismisses the native dialog (dialog.dismiss()), not a Cancel button in the page.
  # - Delete control is a Mantine ActionIcon with accessible name "Delete {Program Name}" and an SVG trash icon (no visible text, not an emoji).
  # - Confirm copy is: Delete program "{name}"? All its semesters and courses will be removed. This cannot be undone.
  # - Cascade of semesters/courses is only warned in the dialog; backend cascade is not specified in AC.
  # - No success toast after delete; removal from the list is the only confirmation (no role=alert).
  # - Rapid double-click on Delete can queue two native confirms (related: DS-30, DS-109, DS-156, DS-218) — not specified as intended AC behavior.
  # - Empty-state after deleting the last program is not testable on the shared tenant (hundreds of programs always present).
  # - Failed DELETE has no user-visible error (related: DS-116, DS-155); AC does not define error handling.
  # - Non-admin delete permissions are not specified in AC.
