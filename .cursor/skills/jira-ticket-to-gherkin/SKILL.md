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

## Output

Save as `features/<ticket-key>.feature` (create `features/` if missing). Use lowercase ticket key in the filename (e.g. `features/DS-1.feature`).
