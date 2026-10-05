# Test Plan: Program List Filtering and Display

## Positive Flows

### TC-001
**Title:** Program list displays name and description for each existing program

**Preconditions:**
- User is logged in as admin
- Programs exist with names and descriptions

**Steps:**
1. Navigate to the Programs page
2. Create or locate programs with known names and descriptions
3. Observe the table list

**Expected result:**
```gherkin
Given programs exist in the system
When I navigate to the Programs page
Then I see a table with column header "Program"
And each program row shows the program name in bold
And each program row shows the description in a secondary line when provided
And I see "+ New Program"
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

**Note:** Not runnable on the shared `test.didaxis.studio` environment (always contains existing programs).

---

### TC-003
**Title:** Create-first-program prompt opens the New Program dialog

**Preconditions:**
- User is logged in as admin
- No programs exist

**Steps:**
1. Navigate to the Programs page
2. Click the empty-state CTA to create the first program
3. Observe the dialog

**Expected result:**
```gherkin
Given no programs exist
When I click the prompt to create the first program
Then I see the "New Program" dialog with Program Name and Description
```

**Priority:** Medium

**Note:** Skipped on shared environment (see TC-002).

---

### TC-004
**Title:** Program with empty description displays only the name line in the list

**Preconditions:**
- User is logged in as admin
- A program exists with Description left empty at create

**Steps:**
1. Navigate to the Programs page
2. Locate the program row

**Expected result:**
```gherkin
Given a program exists with no description
When I navigate to the Programs page
Then I see the program name in the list
And the row shows a single text line (no description subtitle)
```

**Priority:** Medium

---

### TC-014
**Title:** Programs page shows table layout and row management actions

**Preconditions:**
- User is logged in as admin
- At least one program exists

**Steps:**
1. Navigate to the Programs page
2. Inspect the list and a program row

**Expected result:**
```gherkin
When I navigate to the Programs page
Then I see heading "Programs"
And I see a table with a "Program" column
And each row has Edit {Program Name} and Delete {Program Name} actions
```

**Priority:** High

---

## Negative Flows

### TC-005
**Title:** Unauthenticated user cannot view the program list

**Preconditions:**
- User is not logged in

**Steps:**
1. Navigate directly to /programs

**Expected result:**
```gherkin
Given I am not logged in
When I navigate to the Programs page
Then I am redirected to /login
And I see "Sign in to your account"
And I do not see the Programs table
```

**Priority:** High

---

### TC-006
**Title:** Program list does not show stale data after a program is deleted

**Preconditions:**
- User is logged in as admin
- Two distinct programs exist

**Steps:**
1. Navigate to the Programs page
2. Delete one program and confirm
3. Observe the list without manual refresh

**Expected result:**
```gherkin
Given I am on the Programs page
When I delete a program
Then that program is no longer visible in the list
And other programs remain visible
```

**Priority:** High

---

### TC-007
**Title:** Program list does not show duplicate entries after creating a program once

**Preconditions:**
- User is logged in as admin

**Steps:**
1. Create a new program with a unique name
2. Observe the list

**Expected result:**
```gherkin
When I create a program with a unique name
Then that name appears exactly once in the list for that create action
```

**Priority:** Medium

---

### TC-015
**Title:** Programs page has no search or filter controls

**Preconditions:**
- User is logged in as admin
- Programs page is loaded

**Steps:**
1. Observe toolbar and table chrome

**Expected result:**
```gherkin
When I navigate to the Programs page
Then I do not see search or filter controls for the program list
```

**Priority:** Low

**Note:** Feature title mentions "filtering" but ACs and live UI do not expose list filtering (related: DS-221).

---

## Edge Cases

### TC-008
**Title:** Program list displays programs with special characters correctly

**Preconditions:**
- User is logged in as admin
- Program with special characters in name and description exists

**Steps:**
1. Navigate to the Programs page
2. Locate the program row

**Expected result:**
```gherkin
Given a program "Informatique & IA - Niveau 2" exists
When I navigate to the Programs page
Then the name and description render correctly in the row
```

**Priority:** Medium

---

### TC-009
**Title:** Program list handles a large number of programs via scrollable table

**Preconditions:**
- User is logged in as admin
- Many programs exist (shared env has thousands)

**Steps:**
1. Navigate to the Programs page
2. Scroll the table
3. Observe load time and layout

**Expected result:**
```gherkin
Given many programs exist
When I navigate to the Programs page
Then the table is visible with a "Program" column
And rows are accessible by scrolling the table
And the page remains usable without pagination controls
```

**Priority:** Medium

---

### TC-010
**Title:** Program with long name and description appears in the list

**Preconditions:**
- User is logged in as admin
- Program with a 255-character name and long description exists

**Steps:**
1. Navigate to the Programs page
2. Locate the program row

**Expected result:**
```gherkin
Given a program with a very long name exists
When I navigate to the Programs page
Then the full program name is shown in the name line
And the description appears in the dimmed subtitle (may be line-clamped)
```

**Priority:** Low

---

### TC-011
**Title:** Program list updates immediately after editing a program

**Preconditions:**
- User is logged in as admin
- Program exists

**Steps:**
1. Edit the program name and save
2. Observe the list without refresh

**Expected result:**
```gherkin
When I rename a program and save
Then the list immediately shows the updated name
And Edit/Delete actions use the updated name
```

**Priority:** High

---

### TC-012
**Title:** Empty state transitions to list view after creating the first program

**Preconditions:**
- User is logged in as admin
- No programs exist

**Steps:**
1. Confirm empty state
2. Create the first program
3. Observe the page

**Expected result:**
```gherkin
Given no programs exist
When I create the first program
Then the empty state is replaced by the program table row
```

**Priority:** High

**Note:** Skipped on shared environment (see TC-002).

---

### TC-013
**Title:** Program list sort order is stable across refresh for a batch of programs

**Preconditions:**
- User is logged in as admin
- Multiple programs created in one session share a unique batch token in the name

**Steps:**
1. Note row order for the batch
2. Reload the page
3. Compare order

**Expected result:**
```gherkin
Given multiple programs from the same batch exist
When I reload the Programs page
Then their relative order is unchanged
```

**Priority:** Low

---

### TC-016
**Title:** Duplicate program names appear as separate rows

**Preconditions:**
- User is logged in as admin
- Two programs with the same name exist (allowed by create flow)

**Steps:**
1. Create two programs with identical names
2. Observe the list

**Expected result:**
```gherkin
Given duplicate names are allowed
When two programs share the same name
Then two separate rows appear with separate Edit/Delete actions
```

**Priority:** Medium

---

## Ambiguities and Gaps in Acceptance Criteria

1. **Filtering:** Title mentions filtering; live page has **no** search/filter UI (DS-221). ACs cover display only.
2. **Table structure:** Programs render in a **table** with column **Program** and an actions column (Edit/Delete icon buttons with accessible names).
3. **Name/description layout:** First cell uses two `<p>` elements when description exists — bold name, dimmed description with `line-clamp`; empty description shows only the name line.
4. **Empty state:** AC requires empty message + create-first prompt; not testable on shared env with thousands of programs.
5. **Pagination:** Large lists use a **scrollable table** with all rows in DOM (6000+), not paginated (DS-222).
6. **Real-time updates:** List updates without refresh after create, edit, and delete.
7. **Duplicate names:** Multiple rows can share a name; distinguish by separate `Edit {name}` buttons (DS-75).
8. **Locators:** Prefer row scope via `Edit {Program Name}` with `exact: true`; avoid `getByText` on the table (matches actions column — DS-87, DS-98).
9. **Delete confirmation:** Native `window.confirm()` before removal (DS-4 / DS-172).
10. **API errors:** HTTP 500/malformed API may show empty or broken UI instead of error message (DS-35, DS-112, DS-114) — out of DS-5 happy-path scope.
