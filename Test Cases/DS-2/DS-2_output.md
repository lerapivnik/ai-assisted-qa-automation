# Test Plan: Edit Existing Program Details

## Positive Flows

### TC-001
**Title:** Edit form displays pre-populated program data

**Preconditions:**
- User is logged in as admin
- Program "Web Development 2026" exists on the Programs page

**Steps:**
1. Navigate to the Programs page
2. Click the edit icon on "Web Development 2026"
3. Observe the edit form fields

**Expected result:**
```gherkin
Given I am on the Programs page
And a program "Web Development 2026" exists
When I click the edit icon on "Web Development 2026"
Then I see the edit form pre-populated with the program's current data
```

**Priority:** High

---

### TC-002
**Title:** Program name update is reflected immediately in the list

**Preconditions:**
- User is logged in as admin
- Program "Web Development 2026" exists
- Edit form is open for "Web Development 2026"

**Steps:**
1. Change the Name field to "Web Development 2026 - Updated"
2. Click Save
3. Observe the modal and program list

**Expected result:**
```gherkin
Given I am editing "Web Development 2026"
When I change the Name to "Web Development 2026 - Updated"
And I click Save
Then the modal closes
And the program list immediately shows "Web Development 2026 - Updated"
```

**Priority:** High

---

### TC-003
**Title:** Unchanged fields are preserved when only Description is edited

**Preconditions:**
- User is logged in as admin
- Program "Web Development 2026" with Description "Full-stack web development program" exists
- Edit form is open

**Steps:**
1. Note the current Name value
2. Change Description to "Updated full-stack curriculum for 2026"
3. Click Save
4. Reopen the edit form for the program

**Expected result:**
```gherkin
Given I am editing a program with Name "Web Development 2026"
When I only change the Description to "Updated full-stack curriculum for 2026"
And I click Save
Then the Name remains "Web Development 2026"
And the Description shows "Updated full-stack curriculum for 2026"
```

**Priority:** High

---

### TC-004
**Title:** Description can be cleared while Name remains unchanged

**Preconditions:**
- User is logged in as admin
- Program "Web Development 2026" with a non-empty Description exists
- Edit form is open

**Steps:**
1. Clear the Description field entirely
2. Click Save
3. Reopen the edit form

**Expected result:**
```gherkin
Given I am editing "Web Development 2026"
When I clear the Description field
And I click Save
Then the Name remains "Web Development 2026"
And the Description is empty
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
1. Clear the Name field completely
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
**Title:** Cancel discards unsaved edits

**Preconditions:**
- User is logged in as admin
- Program "Web Development 2026" exists
- Edit form is open

**Steps:**
1. Change the Name to "Should Not Be Saved"
2. Click Cancel
3. Observe the program list

**Expected result:**
```gherkin
Given I am editing "Web Development 2026"
When I change the Name to "Should Not Be Saved"
And I click Cancel
Then the modal closes
And the program list still shows "Web Development 2026"
```

**Priority:** High

---

### TC-007
**Title:** Duplicate program name is rejected on edit

**Preconditions:**
- User is logged in as admin
- Programs "Web Development 2026" and "Data Science 2026" exist
- Edit form is open for "Data Science 2026"

**Steps:**
1. Change the Name to "Web Development 2026"
2. Click Save
3. Observe the error message

**Expected result:**
```gherkin
Given I am editing "Data Science 2026"
And a program "Web Development 2026" already exists
When I change the Name to "Web Development 2026"
And I click Save
Then I see an error indicating the name already exists
And the program name remains "Data Science 2026"
```

**Priority:** High

---

### TC-008
**Title:** Unauthenticated user cannot edit a program

**Preconditions:**
- User is not logged in
- Program "Web Development 2026" exists

**Steps:**
1. Navigate directly to the Programs page URL
2. Attempt to access the edit form

**Expected result:**
```gherkin
Given I am not logged in
When I navigate to the Programs page
Then I am redirected to the login page
And I cannot edit any program
```

**Priority:** High

---

## Edge Cases

### TC-009
**Title:** Program name with special characters is accepted on edit

**Preconditions:**
- User is logged in as admin
- Program "Web Development 2026" exists
- Edit form is open

**Steps:**
1. Change the Name to "Web Dev & Design — Niveau 2"
2. Click Save
3. Observe the program list

**Expected result:**
```gherkin
Given I am editing "Web Development 2026"
When I change the Name to "Web Dev & Design — Niveau 2"
And I click Save
Then the program list shows "Web Dev & Design — Niveau 2"
```

**Priority:** Medium

---

### TC-010
**Title:** Program name at maximum allowed length is accepted on edit

**Preconditions:**
- User is logged in as admin
- Program "Web Development 2026" exists
- Edit form is open

**Steps:**
1. Change the Name to a 255-character string
2. Click Save
3. Observe the program list

**Expected result:**
```gherkin
Given I am editing "Web Development 2026"
When I change the Name to a 255-character string
And I click Save
Then the modal closes
And the program list shows the updated 255-character name
```

**Priority:** Medium

---

### TC-011
**Title:** Program name with only whitespace is rejected on edit

**Preconditions:**
- User is logged in as admin
- Edit form is open for an existing program

**Steps:**
1. Change the Name to "   " (spaces only)
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

### TC-012
**Title:** Concurrent edit by two users shows appropriate conflict handling

**Preconditions:**
- Two admin users are logged in
- Program "Web Development 2026" exists
- Both users open the edit form for the same program

**Steps:**
1. User A changes Description to "Updated by User A" and saves
2. User B changes Description to "Updated by User B" and saves
3. Observe the final state

**Expected result:**
```gherkin
Given two users are editing "Web Development 2026" simultaneously
When User A saves first
And User B saves second
Then User B sees a conflict warning or the latest save wins with clear feedback
And the program data is not corrupted
```

**Priority:** Low

---

## Ambiguities and Gaps in Acceptance Criteria

1. **Required fields on edit:** ACs do not specify whether Name can be cleared or if Save should be disabled (TC-005 assumes disabled).
2. **Duplicate name on edit:** Not mentioned in ACs but logically required; covered in TC-007.
3. **Maximum length on edit:** No AC defines character limits during edit. TC-010 assumes 255 characters.
4. **Cancel behavior:** ACs do not explicitly define a Cancel action; TC-006 assumes a Cancel button exists.
5. **Success feedback:** No AC specifies toast/notification after a successful save.
6. **Concurrent editing:** No AC addresses multi-user edit conflicts. TC-012 flags this gap.
7. **Description requirement:** ACs do not clarify if Description can be emptied on edit. TC-004 assumes it can.
8. **Immediate update:** AC states list updates "immediately" but does not define whether a page refresh is needed.
