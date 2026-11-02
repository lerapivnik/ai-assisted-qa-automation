---
name: jira-ticket-to-gherkin
description: Turns a Jira ticket into reviewable Gherkin scenarios. Use whenever the user references a ticket (DS-1, DS-2...) and asks for test cases, a plan, or scenarios — even if they don't say "Gherkin".
---

# Jira Ticket to Gherkin Test Cases

## Steps

1. Read the ticket via Atlassian MCP — extract every AC
2. Generate a .feature file: cover each AC, add negatives + edge cases
3. Each scenario in Given / When / Then form
4. Group: # Happy paths # Negative # Edge cases
5. Use real values from the ticket, not placeholders
6. End with a comment listing ambiguities found in the ACs

## Jira lookup

1. If `cloudId` is unknown, call `getAccessibleAtlassianResources` once and reuse the site `cloudId`.
2. Call `getJiraIssue` with the ticket key (e.g. `DS-1`). Prefer `view: full` or fields that include description and acceptance criteria.
3. Treat as ACs: explicit acceptance criteria, bullet lists under AC/Requirements, checklist items, and numbered success conditions in the description. Map each AC to at least one happy-path scenario.

## Feature file shape

```gherkin
Feature: <short title from ticket>

  # Happy paths
  Scenario: ...
    Given ...
    When ...
    Then ...

  # Negative
  Scenario: ...
    ...

  # Edge cases
  Scenario: ...
    ...

  # Ambiguities (review with PO)
  # - ...
```

- One `Feature` per ticket; scenario titles state intent and reference the AC when helpful.
- Steps use domain language from the ticket (roles, field names, statuses, limits).
- Do not invent product behavior not implied by the ticket; flag gaps under ambiguities instead.
- Programs API edges name the status and the UI outcome (save `503`, list `200` `[]`, list `200` malformed, and `401`, `403`, `404`, `400`, `409`, `500`, `501`, `502`, `504`, `204`, `300`). Do not write the error or empty-state sentence in the scenario; the spec reads that copy from the live page.
- A scenario that checks a relative timestamp names the frozen instant and the exact label (`5 minutes ago`). The spec installs that instant with `page.clock.install` before navigation. Do not write a step that reads the live clock.

## Programs page accessibility

When the ticket touches the programs page, add these scenarios (one behavior each). Do not invent a rule disable. If a crawl of the live page shows axe violations, list them under ambiguities and stop.

```gherkin
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
```

## Output

Save as `features/<ticket-key>.feature` (create `features/` if missing). Use lowercase ticket key in the filename (e.g. `features/DS-1.feature`).
