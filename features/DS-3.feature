# DS-3 — Program name validation and duplicate prevention
# Jira: https://legionqaschool.atlassian.net/browse/DS-3
# Story: As an admin user, I want the system to prevent invalid or duplicate program names so that data integrity is maintained.

Feature: Program name validation and duplicate prevention

  # Happy paths

  @DS-3 @AC-special-characters
  Scenario: Accept program name with special characters
    Given I am logged in as admin
    And I am on the program creation form
    When I enter "Informatique & IA - Niveau 2" as the program name
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the program is created successfully
    And the program list shows "Informatique & IA - Niveau 2"

  @DS-3 @AC-duplicate
  Scenario: Reject duplicate program name
    Given I am logged in as admin
    And a program "Web Development 2026" already exists
    When I try to create a new program with the name "Web Development 2026"
    Then I see an error indicating the name already exists
    And the program list contains exactly one program named "Web Development 2026"

  # Negative

  @DS-3 @AC-whitespace
  Scenario: Reject program name with only whitespace
    Given I am logged in as admin
    And I am on the program creation form
    When I enter "   " as the program name
    And I click Create
    Then the form is not submitted
    And the program name is trimmed and treated as empty

  @DS-3
  Scenario: Empty program name does not create a program
    Given I am logged in as admin
    And I am on the program creation form
    When I leave the Program Name field empty
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the form is not submitted
    And the program list does not show a new unnamed program

  @DS-3
  Scenario: Duplicate name attempt does not close the New Program dialog with success
    Given I am logged in as admin
    And a program "Web Development 2026" already exists
    When I open the program creation form
    And I enter "Web Development 2026" as the program name
    And I fill in Description with "Another description"
    And I click Create
    Then I see an error indicating the name already exists
    And the New Program dialog remains open

  # Edge cases

  @DS-3
  Scenario: Leading and trailing spaces around a valid name are handled on create
    Given I am logged in as admin
    And I am on the program creation form
    When I enter "  Web Development 2026  " as the program name
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the program list shows "Web Development 2026"

  @DS-3
  Scenario: Program name with hyphen and ampersand is stored and listed as entered
    Given I am logged in as admin
    And I am on the program creation form
    When I enter "Informatique & IA - Niveau 2" as the program name
    And I fill in Description with "Programme bilingue"
    And I click Create
    Then the program list shows "Informatique & IA - Niveau 2" with description "Programme bilingue"

  # Ambiguities (review with PO)
  # - AC "fill other required fields" does not name fields beyond program name; Description requirement is unspecified.
  # - Whitespace AC expects trim-on-submit; separate scenario assumes trim-to-canonical name — exact trim rules not defined.
  # - Duplicate check case sensitivity, Unicode normalization, and edit-flow duplicates are not in AC.
  # - Max length, reserved names, and exact error message copy are not specified.
  # - Whether Create is disabled vs server-side error on duplicate/whitespace is not defined.
