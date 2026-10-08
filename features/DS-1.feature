# DS-1 — Create new academic program
# Jira: https://legionqaschool.atlassian.net/browse/DS-1
# Story: As an admin user, I want to create a new academic program so that I can begin designing its curriculum structure.

Feature: Create new academic program

  # Happy paths

  @DS-1 @AC-navigate
  Scenario: Navigate to program creation form from Programs page
    Given I am logged in as admin
    When I navigate to the Programs page
    And I click "+ New Program"
    Then I see the program creation form with fields Program Name and Description

  @DS-1 @AC-create
  Scenario: Successfully create a program with name and description
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"

  @DS-1 @AC-validation
  Scenario: Validation prevents empty program name
    Given I am on the program creation form
    When I leave the Program Name field empty
    Then the Create button is disabled

  @DS-1
  Scenario: Create program with only Program Name when Description is left empty
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I leave the Description field empty
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"

  # Negative

  @DS-1
  Scenario: Cannot submit create while Program Name is empty even if Description is filled
    Given I am on the program creation form
    When I leave the Program Name field empty
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled

  @DS-1
  Scenario: Cancel closes the form without adding a program to the list
    Given I am on the program creation form
    And the program list does not contain "Web Development 2026"
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Cancel
    Then the modal closes
    And the program list does not show "Web Development 2026"

  @DS-1
  Scenario: Create stays disabled when Program Name contains only whitespace
    Given I am on the program creation form
    When I fill in Program Name with "   "
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled

  # Edge cases

  @DS-1
  Scenario: Program name with special characters is accepted on create
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026 (Cohort A)"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026 (Cohort A)"

  @DS-1
  Scenario: Re-open New Program after successful create shows an empty form
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    And the modal closes
    And I click "+ New Program"
    Then I see the program creation form
    And the Program Name field is empty
    And the Description field is empty

  # Ambiguities (review with PO)
  # - AC lists only Program Name and Description; Confluence "Program Setup & Management" may define additional fields (e.g. Total Program Hours, AI config) — not specified in Jira AC.
  # - AC does not state whether Description is required; optional-description happy path is inferred from the success scenario filling both fields.
  # - AC does not define duplicate program name handling, max length, trimming, or double-click / idempotency on Create (related defects exist but are out of scope for written AC).
  # - AC does not specify success feedback (toast/message) or exact modal title; only "modal closes" and list visibility are asserted.
  # - AC does not define non-admin access to "+ New Program" or Programs page.
