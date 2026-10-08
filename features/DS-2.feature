# DS-2 — Edit existing program details
# Jira: https://legionqaschool.atlassian.net/browse/DS-2
# Story: As an admin user, I want to edit an existing program's details so that I can correct or update program information after creation.

Feature: Edit existing program details

  # Happy paths

  @DS-2 @AC-open-edit
  Scenario: Open program for editing
    Given I am on the Programs page
    And a program "Web Development 2026" exists
    When I click the edit icon on "Web Development 2026"
    Then I see the edit form pre-populated with the program's current data

  @DS-2 @AC-edit-name
  Scenario: Successfully edit a program name
    Given I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated"
    And I click Save
    Then the modal closes
    And the program list immediately shows "Web Development 2026 - Updated"

  @DS-2 @AC-preserve-fields
  Scenario: Edit preserves unchanged fields when only Description changes
    Given I am editing a program named "Web Development 2026" with Description "Full-stack web development program"
    When I change the Description to "Updated full-stack web development program"
    And I click Save
    Then the modal closes
    And the program list shows Name "Web Development 2026"
    And the program list shows Description "Updated full-stack web development program"

  @DS-2
  Scenario: Edit form shows current Name and Description for the selected program
    Given I am on the Programs page
    And a program "Web Development 2026" exists with Description "Full-stack web development program"
    When I click the edit icon on "Web Development 2026"
    Then the Name field shows "Web Development 2026"
    And the Description field shows "Full-stack web development program"

  # Negative

  @DS-2
  Scenario: Cancel closes edit without applying changes to the program list
    Given I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated"
    And I click Cancel
    Then the modal closes
    And the program list shows "Web Development 2026"
    And the program list does not show "Web Development 2026 - Updated"

  @DS-2
  Scenario: Clearing Name prevents save while editing
    Given I am editing "Web Development 2026"
    When I clear the Name field
    Then the Save button is disabled

  @DS-2
  Scenario: Saving a name change does not leave the old name visible in the program list
    Given I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated"
    And I click Save
    Then the modal closes
    And the program list does not show "Web Development 2026"

  # Edge cases

  @DS-2
  Scenario: Updated program name with special characters appears in the list after Save
    Given I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 (Cohort B)"
    And I click Save
    Then the modal closes
    And the program list immediately shows "Web Development 2026 (Cohort B)"

  @DS-2
  Scenario: Re-open edit after successful save shows the latest saved values
    Given I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated"
    And I click Save
    And the modal closes
    And I click the edit icon on "Web Development 2026 - Updated"
    Then the Name field shows "Web Development 2026 - Updated"

  # Ambiguities (review with PO)
  # - AC says "Name" on edit form; DS-1 create flow uses "Program Name" — same field label in UI is unspecified.
  # - AC "other fields remain unchanged" does not list which fields exist on the edit form beyond Name and Description.
  # - AC does not state whether Description can be cleared, max lengths, duplicate names after rename, or trim rules on Name.
  # - AC does not specify Save disabled rules (empty/whitespace Name) — negative scenario inferred from create-flow parity.
  # - AC does not define non-admin access to the edit icon or read-only behavior.
  # - AC does not mention success toasts, error handling on failed save, or optimistic vs refreshed list updates beyond "immediately shows".
