# DS-296 — Verify New Semester date validation
# Jira: https://legionqaschool.atlassian.net/browse/DS-296
# Story: As an admin, I want New Semester to validate Start Date and End Date so a semester is not created with an invalid date range.
# Live crawl: Create Semester disabled when Start or End is empty. Enabled when name + start + end are filled with end on/after start.
# When End Date is before Start Date, clicking Create leaves the dialog open and no semester is created. No alert/toast copy was shown — do not invent an error sentence.

Feature: Verify New Semester date validation

  # Happy paths

  @DS-296 @AC-valid-range
  Scenario: Create Semester can enable for a valid date range once name is filled
    Given the New Semester dialog is open
    When Start Date and End Date are both filled and End Date is not before Start Date
    And Semester Name is filled
    Then Create Semester is enabled

  # Negative

  @DS-296 @AC-empty-date
  Scenario: Create Semester is disabled when Start Date or End Date is empty
    Given the New Semester dialog is open
    When Start Date or End Date is empty
    Then Create Semester is disabled

  @DS-296 @AC-end-before-start
  Scenario: End Date before Start Date does not create a semester
    Given the New Semester dialog is open
    When Semester Name, Start Date, and End Date are filled
    And End Date is before Start Date
    And I click Create Semester
    Then the semester is not created
    And the New Semester dialog stays open

  # Edge cases

  @DS-296
  Scenario: Same Start Date and End Date can enable Create Semester with a name
    Given the New Semester dialog is open
    When Semester Name is filled
    And Start Date and End Date are the same day
    Then Create Semester is enabled

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
  # - Live end-before-start: Create briefly enabled, click leaves dialog open, no visible alert/toast. Assert dialog still open / semester not listed — do not invent error copy.
  # - Live wcag2a/wcag2aa color-contrast finding on Programs page. Do not disable rules.
  # - Ticket does not define cleanup for accidental creates; use unique semester names and API cleanup if a create path is exercised.
