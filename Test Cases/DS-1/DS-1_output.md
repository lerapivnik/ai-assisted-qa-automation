# Test Plan: Create New Academic Program

## Positive Flows

### TC-001
**Title:** Program creation form displays required fields when opened from Programs page

**Preconditions:**
- User is logged in as admin
- User is on the Programs page

**Steps:**
1. Click "+ New Program"
2. Observe the modal/form that appears

**Expected result:**
```gherkin
Given I am logged in as admin
When I navigate to the Programs page
And I click "+ New Program"
Then I see the program creation form with fields: Program Name, Description
```

**Priority:** High

---

### TC-002
**Title:** New program is created and appears in the program list

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter "Web Development 2026" in the Program Name field
2. Enter "Full-stack web development program" in the Description field
3. Click Create
4. Observe the modal and program list

**Expected result:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with "Web Development 2026"
And I fill in Description with "Full-stack web development program"
And I click Create
Then the modal closes
And the program list shows "Web Development 2026"
```

**Priority:** High

---

### TC-003
**Title:** Program is created with only Program Name filled (Description optional)

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter "Data Science 2026" in the Program Name field
2. Leave the Description field empty
3. Click Create
4. Observe the program list

**Expected result:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with "Data Science 2026"
And I leave Description empty
And I click Create
Then the modal closes
And the program list shows "Data Science 2026"
```

**Priority:** Medium

---

## Negative Flows

### TC-004
**Title:** Create button remains disabled when Program Name is empty

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Leave the Program Name field empty
2. Observe the Create button state

**Expected result:**
```gherkin
Given I am on the program creation form
When I leave the Program Name field empty
Then the Create button is disabled
```

**Priority:** High

---

### TC-005
**Title:** Program is not created when form is submitted without a name

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Leave Program Name empty
2. Enter "Some description" in Description
3. Attempt to click Create (if enabled via workaround)
4. Observe the program list

**Expected result:**
```gherkin
Given I am on the program creation form
When I leave the Program Name field empty
And I fill in Description with "Some description"
Then the Create button is disabled
And no new program is added to the list
```

**Priority:** High

---

### TC-006
**Title:** Unauthenticated user cannot access program creation form

**Preconditions:**
- User is not logged in

**Steps:**
1. Navigate directly to the Programs page URL
2. Attempt to click "+ New Program"

**Expected result:**
```gherkin
Given I am not logged in
When I navigate to the Programs page
Then I am redirected to the login page
And I do not see the program creation form
```

**Priority:** High

---

## Edge Cases

### TC-007
**Title:** Program name at maximum allowed length is accepted

**Preconditions:**
- User is logged in as admin
- Program creation form is open
- Maximum Program Name length is 255 characters (assumed)

**Steps:**
1. Enter a 255-character string in Program Name (e.g., "A" repeated 255 times)
2. Enter "Boundary test program" in Description
3. Click Create

**Expected result:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with a 255-character string
And I fill in Description with "Boundary test program"
And I click Create
Then the modal closes
And the program list shows the 255-character program name
```

**Priority:** Medium

---

### TC-008
**Title:** Program name exceeding maximum length is rejected

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter a 256-character string in Program Name
2. Enter "Over limit test" in Description
3. Click Create

**Expected result:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with a 256-character string
And I click Create
Then I see a validation error indicating the name exceeds the maximum length
And the program is not created
```

**Priority:** Medium

---

### TC-009
**Title:** Program name with special characters is accepted

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter "Informatique & IA - Niveau 2" in Program Name
2. Enter "French-language program with accents: été" in Description
3. Click Create

**Expected result:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with "Informatique & IA - Niveau 2"
And I fill in Description with "French-language program with accents: été"
And I click Create
Then the modal closes
And the program list shows "Informatique & IA - Niveau 2"
```

**Priority:** Medium

---

### TC-010
**Title:** Program name with only whitespace is treated as empty

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter "   " (spaces only) in Program Name
2. Observe the Create button state

**Expected result:**
```gherkin
Given I am on the program creation form
When I enter "   " as the Program Name
Then the Create button is disabled
And the form is not submitted
```

**Priority:** High

---

### TC-011
**Title:** Closing the modal without saving discards entered data

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter "Unsaved Program" in Program Name
2. Enter "This should not be saved" in Description
3. Click the close (X) button or Cancel
4. Reopen the creation form

**Expected result:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with "Unsaved Program"
And I close the modal without saving
Then the modal closes
And "Unsaved Program" does not appear in the program list
And reopening the form shows empty fields
```

**Priority:** Medium

---

## Ambiguities and Gaps in Acceptance Criteria

1. **Description field requirement:** ACs do not specify whether Description is required or optional. TC-003 assumes it is optional.
2. **Maximum length:** No AC defines the maximum character limit for Program Name or Description. TC-007 and TC-008 assume 255 characters.
3. **Duplicate name handling:** Not covered in DS-1 ACs (covered in DS-3). Should creation be blocked if a duplicate name exists?
4. **User roles:** ACs mention "logged in as admin" but do not define behavior for non-admin authenticated users.
5. **Modal vs. page:** ACs reference a modal that closes on success, but do not specify behavior for navigating away mid-creation.
6. **Success feedback:** No AC specifies whether a toast/notification appears after successful creation.
7. **Whitespace trimming:** Only partially addressed; ACs do not clarify if leading/trailing spaces in valid names are trimmed before save.
