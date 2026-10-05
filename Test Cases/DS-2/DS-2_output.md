# Test Plan: Edit Existing Program Details

## Positive Flows

### TC-001
**Title:** Edit form displays pre-populated program data and full field set

**Preconditions:**
- User is logged in as admin
- A program based on "Web Development 2026" with Description "Full-stack web development program" exists on the Programs page

**Steps:**
1. Navigate to the Programs page
2. Click the row action `Edit {program name}`
3. Observe the "Edit Program" dialog

**Expected result:**
```gherkin
Given I am on the Programs page
And a program "Web Development 2026" exists
When I click the edit action on "Web Development 2026"
Then I see a dialog titled "Edit Program"
And Program Name is pre-filled with the current name
And Description is pre-filled with the current description
And I see Show AI Generation Config, Total Program Hours, Default Session Hours (4), Default Exam Hours (3), Target Audience, Focus Areas
And I see Sync/Async Ratio: 70% sync / 30% async
And I see Cancel and Save
```

**Priority:** High

---

### TC-002
**Title:** Program name update is reflected immediately in the list

**Preconditions:**
- User is logged in as admin
- Program "Web Development 2026" exists
- Edit form is open for that program

**Steps:**
1. Change Program Name to "Web Development 2026 - Updated"
2. Click Save
3. Observe the dialog and program list

**Expected result:**
```gherkin
Given I am editing "Web Development 2026"
When I change the Name to "Web Development 2026 - Updated"
And I click Save
Then the dialog closes
And the program list immediately shows "Web Development 2026 - Updated"
And the old name is no longer shown
And no success toast is shown
```

**Priority:** High

---

### TC-003
**Title:** Unchanged fields are preserved when only Description is edited

**Preconditions:**
- User is logged in as admin
- Program with Name and Description exists
- Edit form is open

**Steps:**
1. Note the current Program Name
2. Change Description to "Updated full-stack curriculum for 2026"
3. Click Save
4. Reopen the edit form for the program

**Expected result:**
```gherkin
Given I am editing a program
When I only change the Description
And I click Save
Then the Name remains unchanged
And the Description shows "Updated full-stack curriculum for 2026"
```

**Priority:** High

---

### TC-004
**Title:** Description can be cleared while Name remains unchanged

**Preconditions:**
- User is logged in as admin
- Program with a non-empty Description exists
- Edit form is open

**Steps:**
1. Clear the Description field entirely
2. Click Save
3. Reopen the edit form

**Expected result:**
```gherkin
Given I am editing a program with a non-empty Description
When I clear the Description field
And I click Save
Then the Name remains unchanged
And the Description is empty
```

**Priority:** Medium

---

### TC-014
**Title:** Optional AI fields accept input and save without blocking edit

**Preconditions:**
- User is logged in as admin
- Program exists with Program Name and Description
- Edit form is open

**Steps:**
1. Enter "Career changers, no CS background" in Target Audience
2. Enter "Python, SQL" in Focus Areas
3. Click Save
4. Observe the dialog and list

**Expected result:**
```gherkin
Given I am editing a program
When I fill Target Audience and Focus Areas
And I click Save
Then the dialog closes
And the program remains in the list under the same name
And Save was enabled while optional fields were filled
```

**Priority:** Medium

---

## Negative Flows

### TC-005
**Title:** Save is disabled when Program Name is cleared

**Preconditions:**
- User is logged in as admin
- Edit form is open for an existing program

**Steps:**
1. Clear the Program Name field completely
2. Observe the Save button state

**Expected result:**
```gherkin
Given I am editing a program
When I clear the Name field
Then the Save button is disabled
And the changes are not saved
```

**Priority:** High

---

### TC-006
**Title:** Cancel discards unsaved edits and restores saved values on reopen

**Preconditions:**
- User is logged in as admin
- Program "Web Development 2026" exists
- Edit form is open

**Steps:**
1. Change Program Name to "Should Not Be Saved"
2. Click Cancel
3. Observe the program list
4. Open the edit form again

**Expected result:**
```gherkin
Given I am editing "Web Development 2026"
When I change the Name to "Should Not Be Saved"
And I click Cancel
Then the dialog closes
And the program list still shows "Web Development 2026"
When I open the edit form again
Then Program Name shows "Web Development 2026"
```

**Priority:** High

---

### TC-007
**Title:** Duplicate program name is accepted on edit

**Preconditions:**
- User is logged in as admin
- Programs "Web Development 2026" and "Data Science 2026" exist
- Edit form is open for "Data Science 2026"

**Steps:**
1. Change Program Name to "Web Development 2026"
2. Click Save
3. Observe the list and dialog

**Expected result:**
```gherkin
Given I am editing "Data Science 2026"
And a program "Web Development 2026" already exists
When I change the Name to "Web Development 2026"
And I click Save
Then the dialog closes
And no duplicate-name error is shown
And the list shows two programs named "Web Development 2026"
And "Data Science 2026" is no longer shown
```

**Priority:** High

---

### TC-008
**Title:** Unauthenticated user cannot edit a program

**Preconditions:**
- User is not logged in

**Steps:**
1. Navigate directly to /programs
2. Observe the page

**Expected result:**
```gherkin
Given I am not logged in
When I navigate to the Programs page
Then I am redirected to /login
And I see "Sign in to your account"
And I do not see any Edit actions
And I do not see the "Edit Program" dialog
```

**Priority:** High

---

## Edge Cases

### TC-009
**Title:** Program name with special characters is accepted on edit

**Preconditions:**
- User is logged in as admin
- Program exists
- Edit form is open

**Steps:**
1. Change Program Name to "Web Dev & Design — Niveau 2"
2. Click Save
3. Observe the program list

**Expected result:**
```gherkin
Given I am editing a program
When I change the Name to "Web Dev & Design — Niveau 2"
And I click Save
Then the program list shows "Web Dev & Design — Niveau 2"
```

**Priority:** Medium

---

### TC-010
**Title:** Program name at 255 characters is accepted on edit

**Preconditions:**
- User is logged in as admin
- Program exists
- Edit form is open

**Steps:**
1. Change Program Name to a unique 255-character string
2. Click Save
3. Observe the program list

**Expected result:**
```gherkin
Given I am editing a program
When I change the Name to a 255-character string
And I click Save
Then the dialog closes
And the program list shows the updated 255-character name
```

**Priority:** Medium

---

### TC-016
**Title:** Program name longer than 255 characters is accepted on edit

**Preconditions:**
- User is logged in as admin
- Program exists
- Edit form is open

**Steps:**
1. Change Program Name to a unique 256-character string
2. Click Save

**Expected result:**
```gherkin
Given I am editing a program
When I change the Name to a 256-character string
And I click Save
Then the dialog closes
And the program list shows the updated name
And no max-length validation error is shown
```

**Priority:** Medium

---

### TC-011
**Title:** Program name with only whitespace keeps Save disabled

**Preconditions:**
- User is logged in as admin
- Edit form is open for an existing program

**Steps:**
1. Change Program Name to "   " (spaces only)
2. Observe the Save button state

**Expected result:**
```gherkin
Given I am editing a program
When I change the Name to "   "
Then the Save button is disabled
And the changes are not saved
```

**Priority:** High

---

### TC-013
**Title:** Leading and trailing whitespace in Program Name is trimmed on save

**Preconditions:**
- User is logged in as admin
- Program exists
- Edit form is open

**Steps:**
1. Change Program Name to a unique name with leading and trailing spaces
2. Click Save
3. Observe the list and row action label

**Expected result:**
```gherkin
Given I am editing a program
When I change the Name to a padded unique name
And I click Save
Then the dialog closes
And the list shows the trimmed name
And the Edit action uses the trimmed name
```

**Priority:** Medium

---

### TC-015
**Title:** Closing the dialog with X discards unsaved edits like Cancel

**Preconditions:**
- User is logged in as admin
- Program exists
- Edit form is open

**Steps:**
1. Change Program Name to "Closed Via X"
2. Click the dialog close (X) button
3. Observe the list and reopen the edit form

**Expected result:**
```gherkin
Given I am editing a program
When I change the Name to "Closed Via X"
And I click the dialog close button
Then the dialog closes
And the list still shows the original program name
When I reopen the edit form
Then Program Name shows the original saved name
```

**Priority:** Low

---

### TC-012
**Title:** Concurrent edit by two users shows appropriate conflict handling

**Preconditions:**
- Two admin sessions are logged in
- The same program exists in both sessions
- Both users open the edit form for that program

**Steps:**
1. User A changes Description and saves
2. User B changes Description and saves
3. Observe the final saved Description

**Expected result:**
```gherkin
Given two users are editing the same program simultaneously
When User A saves first
And User B saves second
Then either User B sees a conflict or error
Or the latest save wins without corrupting data
And reopening the form shows either User A's or User B's description
```

**Priority:** Low

---

## Ambiguities and Gaps in Acceptance Criteria

1. **Field set beyond ACs:** The live edit dialog matches create: AI config fields, hours defaults, and Sync/Async ratio. ACs only mention Name and Description.
2. **Edit control:** The UI exposes row actions with accessible name `Edit {Program Name}`, not a separate unlabeled icon only.
3. **Duplicate names on edit:** Not in ACs; the app accepts duplicates (same as create).
4. **No max length:** Program Name has no HTML `maxLength` on edit; 255+ character names save.
5. **Cancel vs create modal:** Unlike "New Program", canceling edit does **not** keep unsaved typed values; reopening loads last saved data.
6. **Success feedback:** No toast after save; confirmation is dialog close plus list update.
7. **Optional AI fields quirk:** Total Program Hours, Target Audience, and Focus Areas do not reliably repopulate in their inputs when the edit dialog reopens, even after a successful save. Hours set at create may concatenate into Description until Description is saved alone.
8. **Immediate update:** List and `Edit {name}` labels update without refresh after save; dismiss can take several seconds on the shared environment.
9. **Concurrent editing:** ACs silent; last-write-wins or conflict is environment-dependent (TC-012).
10. **List locators:** Use row-scoped `Edit {name}` / first `p` for name; broad `getByText` hits the actions column.
