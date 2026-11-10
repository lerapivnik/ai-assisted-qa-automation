# DS-295 — Validate New Semester required fields
# Jira: https://legionqaschool.atlassian.net/browse/DS-295
# Story: As an admin, I want the New Semester dialog to require a name and both dates before a semester can be created.
# Live crawl: Select a program → "+ Semester" opens role=dialog "New Semester" with Semester Name *, Start Date *, End Date *.
# Create Semester is disabled when name/dates are empty, when only name is filled, and when name + start are filled without end.
# Create Semester enables when name, start, and end are all filled with end not before start.
# Do not submit the form in the required-field check.

Feature: Validate New Semester required fields

  # Happy paths

  @DS-295 @AC-all-required
  Scenario: Create Semester enables when name and both dates are filled
    Given a program with no required semester setup is selected
    And the New Semester dialog is open
    When I fill Semester Name, Start Date, and End Date
    Then Create Semester is enabled

  # Negative

  @DS-295 @AC-empty
  Scenario: Create Semester is disabled when name and dates are empty
    Given a program is selected
    And the New Semester dialog is open
    When Semester Name, Start Date, and End Date are empty
    Then Create Semester is disabled
    And the dialog stays open

  @DS-295 @AC-name-only
  Scenario: Create Semester stays disabled when only Semester Name is entered
    Given the New Semester dialog is open
    When I enter a Semester Name
    And I leave Start Date and End Date empty
    Then Create Semester stays disabled
    And the dialog stays open

  # Edge cases

  @DS-295
  Scenario: Create Semester stays disabled when End Date is still empty
    Given the New Semester dialog is open
    When I fill Semester Name and Start Date
    And I leave End Date empty
    Then Create Semester stays disabled

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
  # - Live wcag2a/wcag2aa scan on the Programs page previously reported color-contrast (serious). Do not disable rules. Functional coverage lives in this plan; shared a11y coverage is tests/programs.a11y.spec.ts.
  # - Ticket says "a program with no semesters". Live tenant already has programs; select an existing program row and open "+ Semester". Do not invent empty-semester setup beyond selecting a program.
  # - Required-field scenarios must not click Create Semester.
