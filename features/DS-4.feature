# DS-4 — Delete program with confirmation
# Jira: https://legionqaschool.atlassian.net/browse/DS-4
# Story: As an admin user, I want to delete a program I no longer need, with a confirmation step to prevent accidental deletion.

Feature: Delete program with confirmation

  # Happy paths

  @DS-4 @AC-delete-confirm
  Scenario: Delete program with confirmation
    Given I am logged in as admin
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog
    When I confirm deletion
    Then "Test Program" is removed from the program list

  @DS-4 @AC-cancel-delete
  Scenario: Cancel program deletion
    Given I am logged in as admin
    And a program "Test Program" exists
    When I click the delete icon for a program
    And I see the confirmation dialog
    And I click Cancel
    Then the program still exists in the list
    And the program list shows "Test Program"

  @DS-4
  Scenario: Confirmation dialog appears before any program is removed
    Given I am logged in as admin
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog
    And the program list still shows "Test Program"

  # Negative

  @DS-4
  Scenario: Dismissing confirmation without confirming does not delete the program
    Given I am logged in as admin
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    And I see the confirmation dialog
    And I click Cancel
    Then "Test Program" is not removed from the program list

  @DS-4
  Scenario: Deleting one program does not remove other programs from the list
    Given I am logged in as admin
    And a program "Test Program" exists
    And a program "Web Development 2026" exists
    When I click the delete icon for "Test Program"
    And I confirm deletion
    Then "Test Program" is removed from the program list
    And the program list still shows "Web Development 2026"

  @DS-4
  Scenario: Program is not deleted before the confirmation dialog is shown
    Given I am logged in as admin
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    Then "Test Program" is still in the program list

  # Edge cases

  @DS-4
  Scenario: Delete program with special characters in the name after confirmation
    Given I am logged in as admin
    And a program "Informatique & IA - Niveau 2" exists
    When I click the delete icon for "Informatique & IA - Niveau 2"
    And I confirm deletion
    Then "Informatique & IA - Niveau 2" is removed from the program list

  @DS-4
  Scenario: Program remains deleted in the list after page refresh following confirmed delete
    Given I am logged in as admin
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    And I confirm deletion
    And I refresh the Programs page
    Then the program list does not show "Test Program"

  # Ambiguities (review with PO)
  # - AC does not specify confirmation dialog type (in-app modal vs native browser confirm) or exact button labels.
  # - AC does not define behavior when delete API fails, when program has dependent curriculum data, or double-click on delete.
  # - Cancel scenario uses generic "a program" — assumed to be the same row targeted by the delete icon.
  # - Non-admin visibility of delete control and soft-delete vs hard-delete are not specified.
  # - Whether a success message is shown after delete is not in AC.
