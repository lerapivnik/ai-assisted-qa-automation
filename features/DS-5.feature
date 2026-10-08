# DS-5 — Program list filtering and display
# Jira: https://legionqaschool.atlassian.net/browse/DS-5
# Story: As an admin user, I want to see all programs in a clear list so that I can quickly find and manage them.

Feature: Program list filtering and display

  # Happy paths

  @DS-5 @AC-list-display
  Scenario: Display program list with key details
    Given I am logged in as admin
    And programs exist in the system
    When I navigate to the Programs page
    Then I see a list showing each program's name and description

  @DS-5 @AC-empty-state
  Scenario: Empty state when no programs exist
    Given I am logged in as admin
    And no programs exist
    When I navigate to the Programs page
    Then I see a message indicating no programs have been created
    And I see a prompt to create the first program

  @DS-5
  Scenario: Multiple programs each show name and description in the list
    Given I am logged in as admin
    And a program "Web Development 2026" exists with Description "Full-stack web development program"
    And a program "Data Science 2026" exists with Description "Analytics and machine learning program"
    When I navigate to the Programs page
    Then the program list shows "Web Development 2026" with description "Full-stack web development program"
    And the program list shows "Data Science 2026" with description "Analytics and machine learning program"

  @DS-5
  Scenario: Create-first-program prompt opens the new program flow
    Given I am logged in as admin
    And no programs exist
    When I navigate to the Programs page
    And I follow the prompt to create the first program
    Then I see the program creation form with fields Program Name and Description

  # Negative

  @DS-5
  Scenario: Empty-state message is not shown when programs exist
    Given I am logged in as admin
    And a program "Web Development 2026" exists
    When I navigate to the Programs page
    Then I do not see a message indicating no programs have been created

  @DS-5
  Scenario: Program list is not shown when no programs exist
    Given I am logged in as admin
    And no programs exist
    When I navigate to the Programs page
    Then I do not see a program row for "Web Development 2026"

  @DS-5
  Scenario: Navigating to Programs without data does not show another program's details
    Given I am logged in as admin
    And no programs exist
    When I navigate to the Programs page
    Then I do not see "Web Development 2026" in the program list

  # Edge cases

  @DS-5
  Scenario: Program with no description still appears in the list by name
    Given I am logged in as admin
    And a program "Web Development 2026" exists with an empty Description
    When I navigate to the Programs page
    Then the program list shows "Web Development 2026"

  @DS-5
  Scenario: Program name and description with special characters display in the list
    Given I am logged in as admin
    And a program "Web Development 2026 (Cohort A)" exists with Description "Stacks: HTML, CSS & JavaScript"
    When I navigate to the Programs page
    Then the program list shows "Web Development 2026 (Cohort A)" with description "Stacks: HTML, CSS & JavaScript"

  @DS-5
  Scenario: Newly created program appears in the list with name and description
    Given I am logged in as admin
    And I am on the Programs page
    When I click "+ New Program"
    And I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the program list shows "Web Development 2026" with description "Full-stack web development program"

  # Ambiguities (review with PO)
  # - Story summary mentions "filtering" but Jira AC defines only list display and empty state — no search/filter/sort criteria.
  # - AC does not specify exact empty-state copy, CTA control type (button vs link), or table vs card layout.
  # - AC does not define behavior when Description is empty, when two programs share a name, or for very long name/description text.
  # - AC does not cover API/load failures, pagination, or non-admin visibility of the Programs list.
  # - "No programs exist" may require an isolated environment; shared test tenants may always have programs.
