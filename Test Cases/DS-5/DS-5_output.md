# Test Plan: Program List Filtering and Display

## Positive Flows

### TC-001
**Title:** Program list displays name and description for each existing program

**Preconditions:**
- User is logged in as admin
- Programs exist in the system:
  - "Web Development 2026" — "Full-stack web development program"
  - "Data Science 2026" — "Machine learning and analytics program"

**Steps:**
1. Navigate to the Programs page
2. Observe the program list

**Expected result:**
```gherkin
Given programs exist in the system
When I navigate to the Programs page
Then I see a list showing each program's name and description
And I see "Web Development 2026" with description "Full-stack web development program"
And I see "Data Science 2026" with description "Machine learning and analytics program"
```

**Priority:** High

---

### TC-002
**Title:** Empty state message and create prompt are shown when no programs exist

**Preconditions:**
- User is logged in as admin
- No programs exist in the system

**Steps:**
1. Navigate to the Programs page
2. Observe the page content

**Expected result:**
```gherkin
Given no programs exist
When I navigate to the Programs page
Then I see a message indicating no programs have been created
And I see a prompt to create the first program
```

**Priority:** High

---

### TC-003
**Title:** Create-first-program prompt navigates to program creation form

**Preconditions:**
- User is logged in as admin
- No programs exist in the system

**Steps:**
1. Navigate to the Programs page
2. Click the "create the first program" prompt (or equivalent CTA)
3. Observe the resulting form

**Expected result:**
```gherkin
Given no programs exist
When I navigate to the Programs page
And I click the prompt to create the first program
Then I see the program creation form with fields: Program Name, Description
```

**Priority:** Medium

---

### TC-004
**Title:** Program with empty description displays correctly in the list

**Preconditions:**
- User is logged in as admin
- Program "Data Science 2026" exists with an empty Description

**Steps:**
1. Navigate to the Programs page
2. Locate "Data Science 2026" in the list

**Expected result:**
```gherkin
Given a program "Data Science 2026" exists with no description
When I navigate to the Programs page
Then I see "Data Science 2026" in the list
And the description area is empty or shows a placeholder such as "No description"
```

**Priority:** Medium

---

## Negative Flows

### TC-005
**Title:** Unauthenticated user cannot view the program list

**Preconditions:**
- User is not logged in

**Steps:**
1. Navigate directly to the Programs page URL
2. Observe the response

**Expected result:**
```gherkin
Given I am not logged in
When I navigate to the Programs page
Then I am redirected to the login page
And I do not see the program list
```

**Priority:** High

---

### TC-006
**Title:** Program list does not show stale data after a program is deleted

**Preconditions:**
- User is logged in as admin
- Programs "Web Development 2026" and "Data Science 2026" exist

**Steps:**
1. Navigate to the Programs page
2. Delete "Data Science 2026"
3. Observe the list without refreshing the page

**Expected result:**
```gherkin
Given I am on the Programs page
When I delete "Data Science 2026"
Then "Data Science 2026" is no longer visible in the list
And "Web Development 2026" remains visible
```

**Priority:** High

---

### TC-007
**Title:** Program list does not show duplicate entries after creating a program

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Create a new program "Cloud Computing 2026"
2. Observe the program list

**Expected result:**
```gherkin
Given I am on the Programs page
When I create a program named "Cloud Computing 2026"
Then "Cloud Computing 2026" appears exactly once in the list
```

**Priority:** Medium

---

## Edge Cases

### TC-008
**Title:** Program list displays programs with special characters correctly

**Preconditions:**
- User is logged in as admin
- Program "Informatique & IA - Niveau 2" with description "Programme avancé d'informatique" exists

**Steps:**
1. Navigate to the Programs page
2. Locate the program in the list

**Expected result:**
```gherkin
Given a program "Informatique & IA - Niveau 2" exists
When I navigate to the Programs page
Then I see "Informatique & IA - Niveau 2" displayed correctly
And I see "Programme avancé d'informatique" as the description
```

**Priority:** Medium

---

### TC-009
**Title:** Program list handles a large number of programs

**Preconditions:**
- User is logged in as admin
- 50 or more programs exist in the system

**Steps:**
1. Navigate to the Programs page
2. Scroll through the list
3. Observe performance and layout

**Expected result:**
```gherkin
Given 50 programs exist in the system
When I navigate to the Programs page
Then all programs are accessible via scrolling or pagination
And the page loads within an acceptable time
And no layout breakage occurs
```

**Priority:** Medium

---

### TC-010
**Title:** Program with maximum-length name and description displays without truncation issues

**Preconditions:**
- User is logged in as admin
- Program with a 255-character name and 500-character description exists

**Steps:**
1. Navigate to the Programs page
2. Locate the program in the list
3. Observe name and description display

**Expected result:**
```gherkin
Given a program with a 255-character name exists
When I navigate to the Programs page
Then the program name is displayed without breaking the layout
And the full name is accessible (via tooltip or expand)
```

**Priority:** Low

---

### TC-011
**Title:** Program list updates immediately after editing a program

**Preconditions:**
- User is logged in as admin
- Program "Web Development 2026" exists

**Steps:**
1. Navigate to the Programs page
2. Edit "Web Development 2026" and change the name to "Web Development 2026 - Updated"
3. Save and observe the list

**Expected result:**
```gherkin
Given I am on the Programs page
When I edit "Web Development 2026" to "Web Development 2026 - Updated"
And I save the changes
Then the list immediately shows "Web Development 2026 - Updated"
And "Web Development 2026" is no longer shown
```

**Priority:** High

---

### TC-012
**Title:** Empty state transitions to list view after creating the first program

**Preconditions:**
- User is logged in as admin
- No programs exist

**Steps:**
1. Navigate to the Programs page and confirm empty state
2. Create program "First Program" with description "The very first program"
3. Observe the page

**Expected result:**
```gherkin
Given no programs exist
When I create a program named "First Program"
Then the empty state message disappears
And the list shows "First Program" with its description
```

**Priority:** High

---

### TC-013
**Title:** Program list sorting is consistent and predictable

**Preconditions:**
- User is logged in as admin
- Multiple programs exist: "Alpha Program", "Beta Program", "Gamma Program"

**Steps:**
1. Navigate to the Programs page
2. Observe the order of programs in the list
3. Refresh the page and observe again

**Expected result:**
```gherkin
Given multiple programs exist
When I navigate to the Programs page
Then programs are displayed in a consistent order (e.g., alphabetical by name or by creation date)
And the order does not change unexpectedly on refresh
```

**Priority:** Low

---

## Ambiguities and Gaps in Acceptance Criteria

1. **Filtering:** The feature title mentions "filtering" but ACs only cover display. No AC defines search, filter, or sort behavior. TC-013 probes sort order as a gap.
2. **Empty description display:** ACs require name and description columns but do not define how empty descriptions appear. TC-004 addresses this.
3. **Empty state CTA behavior:** AC mentions a prompt to create the first program but does not specify if it is a button, link, or navigates to the creation form. TC-003 covers this.
4. **Pagination:** No AC defines behavior for large lists. TC-009 assumes scrolling or pagination at 50+ programs.
5. **List actions:** ACs do not mention edit/delete icons or other row-level actions visible in the list.
6. **Real-time updates:** ACs do not specify whether the list auto-updates after create/edit/delete or requires a refresh. TC-006, TC-011, and TC-012 assume immediate updates.
7. **User roles:** ACs do not specify which roles can view the list.
8. **Truncation/tooltips:** No AC defines how long names and descriptions are displayed in the list view. TC-010 addresses this.
