# DS-4 — Delete program with confirmation
# Jira: https://legionqaschool.atlassian.net/browse/DS-4
# Story: As an admin user, I want to delete a program I no longer need, with a confirmation step to prevent accidental deletion.
# Live UI recon: skipped. DIDAXIS_EMAIL and DIDAXIS_PASSWORD are not set.

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
    And I do not see any Delete actions

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
  Scenario: Confirmation can be cancelled for a program with a very long name
    Given I am logged in as admin
    And a program with a 255-character name exists
    When I click the delete icon for that program
    And I click Cancel
    Then the program still exists in the list

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

  # Programs API edges

  Scenario: Delete returns 503
    Given I am logged in as admin
    And a program "Test Program" exists
    When I confirm deletion of "Test Program"
    And the delete request returns status 503
    Then the programs page shows the error outcome for status 503

  Scenario: Program list returns 200 with an empty array
    Given I am logged in as admin
    When the program list returns status 200 with an empty array
    Then the programs page shows the empty-state outcome

  Scenario: Program list returns 200 with a malformed body
    Given I am logged in as admin
    When the program list returns status 200 with a malformed body
    Then the programs page stays up

  Scenario: Program list returns 401
    Given I am logged in as admin
    When the program list returns status 401
    Then the programs page shows the outcome for status 401

  Scenario: Program list returns 403
    Given I am logged in as admin
    When the program list returns status 403
    Then the programs page shows the outcome for status 403

  Scenario: Program list returns 404
    Given I am logged in as admin
    When the program list returns status 404
    Then the programs page shows the outcome for status 404

  Scenario: Delete returns 400
    Given I am logged in as admin
    And a program "Test Program" exists
    When I confirm deletion of "Test Program"
    And the delete request returns status 400
    Then the programs page shows the outcome for status 400

  Scenario: Delete returns 409
    Given I am logged in as admin
    And a program "Test Program" exists
    When I confirm deletion of "Test Program"
    And the delete request returns status 409
    Then the programs page shows the outcome for status 409

  Scenario: Delete returns 500
    Given I am logged in as admin
    And a program "Test Program" exists
    When I confirm deletion of "Test Program"
    And the delete request returns status 500
    Then the programs page shows the outcome for status 500

  Scenario: Delete returns 501
    Given I am logged in as admin
    And a program "Test Program" exists
    When I confirm deletion of "Test Program"
    And the delete request returns status 501
    Then the programs page shows the outcome for status 501

  Scenario: Delete returns 502
    Given I am logged in as admin
    And a program "Test Program" exists
    When I confirm deletion of "Test Program"
    And the delete request returns status 502
    Then the programs page shows the outcome for status 502

  Scenario: Delete returns 504
    Given I am logged in as admin
    And a program "Test Program" exists
    When I confirm deletion of "Test Program"
    And the delete request returns status 504
    Then the programs page shows the outcome for status 504

  Scenario: Delete returns 204 with an empty body
    Given I am logged in as admin
    And a program "Test Program" exists
    When I confirm deletion of "Test Program"
    And the delete request returns status 204 with an empty body
    Then the programs page stays up

  Scenario: Delete returns 300
    Given I am logged in as admin
    And a program "Test Program" exists
    When I confirm deletion of "Test Program"
    And the delete request returns status 300
    Then the programs page stays up

  # Ambiguities (review with PO)
  # - Live UI recon was skipped this run because DIDAXIS_EMAIL and DIDAXIS_PASSWORD are not set. Confirmation control type, Cancel control, delete-icon accessible name, and any visible error or empty-state sentence were not read from the page. Do not invent that copy in the spec.
  # - AC says "confirmation dialog" and "click Cancel" without naming an in-app dialog versus a native confirm.
  # - AC example name is "Test Program". Whether a description is required to create that program is not stated.
  # - Whether deleting a program cascades semesters and courses is not in the AC.
  # - Failed delete, double-click, and non-admin permission behavior are not in the AC.
  # - Empty state after the last program is deleted is not in the AC. The empty-array scenario names the status and the empty-state outcome only.
