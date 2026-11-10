# DS-260 — Program list filtering and display
# Jira: https://legionqaschool.atlassian.net/browse/DS-260
# Story: As an admin user, I want to see all programs in a clear list so that I can quickly find and manage them.
# Live crawl: Programs page column header is "Program". Each row shows the program name and description.
# Empty GET /api/programs body { "data": [] } shows an empty state and a Create Program prompt. The scenario does not quote that sentence.

Feature: Program list filtering and display

  # Happy paths

  @DS-260 @AC-list-display
  Scenario: Display program list with key details
    Given programs exist in the system
    When I navigate to the Programs page
    Then I see a list showing each program's name and description

  @DS-260 @AC-empty-state
  Scenario: Empty state when no programs exist
    Given no programs exist
    When I navigate to the Programs page
    Then I see a message indicating no programs have been created
    And I see a prompt to create the first program

  @DS-260
  Scenario: Create-first-program prompt opens the new program form
    Given no programs exist
    When I navigate to the Programs page
    And I follow the prompt to create the first program
    Then I see the program creation form with fields Program Name and Description

  # Negative

  @DS-260
  Scenario: Empty-state message is not shown when programs exist
    Given a program "Web Development 2026" exists with Description "Full-stack web development program"
    When I navigate to the Programs page
    Then I do not see a message indicating no programs have been created
    And the list shows "Web Development 2026" and "Full-stack web development program"

  # Edge cases

  @DS-260
  Scenario: Program with an empty description still appears by name
    Given a program "Web Development 2026" exists with an empty Description
    When I navigate to the Programs page
    Then the program list shows "Web Development 2026"

  @DS-260
  Scenario: Several programs each show name and description
    Given a program "Web Development 2026" exists with Description "Full-stack web development program"
    And a program "Informatique & IA - Niveau 2" exists with Description "Programme d'informatique et d'IA"
    When I navigate to the Programs page
    Then the list shows "Web Development 2026" with description "Full-stack web development program"
    And the list shows "Informatique & IA - Niveau 2" with description "Programme d'informatique et d'IA"

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
  # - Live wcag2a/wcag2aa scan on the Programs page reported color-contrast, impact serious, 893 nodes. Generation stopped before Playwright. Do not disable rules.
  # - The summary says "filtering". The AC only covers list display and the empty state. No search, filter, or sort criteria are specified. Live page has no separate filter control in the crawled header row.
  # - Empty-state copy was read from the live page when GET /api/programs was fulfilled as { "data": [] }. The sentence stays out of this plan; the spec reads it from the page.
  # - The list endpoint returns { "data": [ ... ] }, not a bare array. A bare [] fulfill would not match the client.
  # - Shared tenant already contains many programs, including repeated display names. "No programs exist" needs a stub or an isolated tenant.
