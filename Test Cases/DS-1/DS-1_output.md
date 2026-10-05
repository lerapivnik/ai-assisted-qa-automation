# Test Plan: Create New Academic Program

## Positive Flows

### TC-001
**Title:** Program creation form displays Program Name, Description, AI config fields, and Create/Cancel when opened from Programs page

**Preconditions:**
- User is logged in as admin
- User is on the Programs page

**Steps:**
1. Click "+ New Program"
2. Observe the "New Program" dialog

**Expected result:**
```gherkin
Given I am logged in as admin
When I navigate to the Programs page
And I click "+ New Program"
Then I see a dialog titled "New Program"
And I see fields: Program Name (required, placeholder "e.g. Computer Science BSc"), Description (placeholder "Brief description")
And I see "Show AI Generation Config"
And I see Total Program Hours, Default Session Hours (value 4), Default Exam Hours (value 3), Target Audience, Focus Areas
And I see "Sync/Async Ratio: 70% sync / 30% async"
And I see Cancel and Create
And Create is disabled while Program Name is empty
```

**Priority:** High

---

### TC-002
**Title:** New program is created and appears in the program list

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter a unique name based on "Web Development 2026" in Program Name
2. Enter "Full-stack web development program" in Description
3. Click Create
4. Observe the dialog and program list

**Expected result:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with a unique "Web Development 2026" name
And I fill in Description with "Full-stack web development program"
And I click Create
Then the "New Program" dialog closes
And the program list shows that program name
And no success toast is shown
```

**Priority:** High

---

### TC-003
**Title:** Program is created with only Program Name filled (Description optional)

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter a unique name based on "Data Science 2026" in Program Name
2. Leave Description empty
3. Click Create
4. Observe the program list

**Expected result:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with a unique "Data Science 2026" name
And I leave Description empty
And I click Create
Then the dialog closes
And the program list shows that program name
```

**Priority:** Medium

---

### TC-012
**Title:** Program is created when optional AI generation fields are filled

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter a unique Program Name
2. Enter "Full-stack web development program" in Description
3. Enter 900 in Total Program Hours
4. Enter "Career changers, no CS background" in Target Audience
5. Enter "Python, SQL, Machine Learning" in Focus Areas
6. Click Create

**Expected result:**
```gherkin
Given I am on the program creation form
When I fill Program Name, Description, Total Program Hours, Target Audience, and Focus Areas
And I click Create
Then the dialog closes
And the program list shows the new program
And the list subtitle concatenates Description, Total Program Hours, Target Audience, and Focus Areas without separators
```

**Priority:** Medium

---

### TC-017
**Title:** Program creation form is empty after a successful create

**Preconditions:**
- User is logged in as admin
- A program was just created successfully

**Steps:**
1. Click "+ New Program" again
2. Observe Program Name and Description

**Expected result:**
```gherkin
Given I just created a program successfully
When I open the "New Program" dialog again
Then Program Name is empty
And Description is empty
And Create is disabled
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
1. Leave Program Name empty
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
**Title:** Program is not created when Description is filled and Program Name is empty

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Leave Program Name empty
2. Enter "Some description" in Description
3. Observe Create and the program list

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
1. Navigate directly to /programs
2. Observe the page

**Expected result:**
```gherkin
Given I am not logged in
When I navigate to the Programs page
Then I am redirected to /login
And I see "Sign in to your account"
And I see Email, Password, and Sign In
And I do not see "+ New Program"
And I do not see the "New Program" dialog
```

**Priority:** High

---

### TC-018
**Title:** Non-numeric Total Program Hours is stripped and does not block create

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter a unique Program Name
2. Enter "abc" in Total Program Hours
3. Observe the hours field and Create
4. Enter "-5" in Total Program Hours
5. Click Create

**Expected result:**
```gherkin
Given I am on the program creation form
When I fill Program Name with a valid unique name
And I enter "abc" in Total Program Hours
Then Total Program Hours is empty
And Create remains enabled
When I enter "-5" in Total Program Hours
Then Total Program Hours is empty
And clicking Create still creates the program
And no inline hours validation error is shown
```

**Priority:** Medium

---

## Edge Cases

### TC-007
**Title:** Program name at 255 characters is accepted

**Preconditions:**
- User is logged in as admin
- Program creation form is open
- The form does not set an HTML maxLength on Program Name

**Steps:**
1. Enter a unique 255-character string in Program Name
2. Enter "Boundary test program" in Description
3. Click Create

**Expected result:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with a 255-character string
And I fill in Description with "Boundary test program"
And I click Create
Then the dialog closes
And the program list shows the 255-character program name
```

**Priority:** Medium

---

### TC-008
**Title:** Program name longer than 255 characters is accepted

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter a unique 256-character string in Program Name
2. Enter "Over limit test" in Description
3. Click Create

**Expected result:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with a 256-character string
And I click Create
Then the dialog closes
And the program list shows the 256-character program name
And no max-length validation error is shown
```

**Priority:** Medium

---

### TC-009
**Title:** Program name with special characters is accepted

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter a unique name based on "Informatique & IA - Niveau 2" in Program Name
2. Enter "French-language program with accents: été" in Description
3. Click Create

**Expected result:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with "Informatique & IA - Niveau 2" plus a unique suffix
And I fill in Description with "French-language program with accents: été"
And I click Create
Then the dialog closes
And the program list shows that program name
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

### TC-013
**Title:** Leading and trailing whitespace in Program Name is trimmed before save

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter a unique name with leading and trailing spaces, e.g. "  Web Development 2026  "
2. Click Create
3. Observe the name in the program list

**Expected result:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with leading and trailing spaces around a unique name
And I click Create
Then the dialog closes
And the program list shows the name without leading or trailing spaces
```

**Priority:** Medium

---

### TC-011
**Title:** Closing the dialog with Cancel discards the new program but keeps typed values

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter "Unsaved Program" in Program Name
2. Enter "This should not be saved" in Description
3. Click Cancel
4. Click "+ New Program" again

**Expected result:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with "Unsaved Program"
And I fill in Description with "This should not be saved"
And I click Cancel
Then the dialog closes
And "Unsaved Program" does not appear in the program list
When I open the form again
Then Program Name still shows "Unsaved Program"
And Description still shows "This should not be saved"
```

**Priority:** Medium

---

### TC-019
**Title:** Closing the dialog with X discards the new program but keeps typed values

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter "Closed via X" in Program Name
2. Click the dialog close (X) button
3. Click "+ New Program" again

**Expected result:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with "Closed via X"
And I click the dialog close button
Then the dialog closes
And "Closed via X" does not appear in the program list
When I open the form again
Then Program Name still shows "Closed via X"
```

**Priority:** Low

---

### TC-015
**Title:** Duplicate program name is accepted on create

**Preconditions:**
- User is logged in as admin
- A program with a unique name already exists

**Steps:**
1. Open "+ New Program"
2. Enter the same Program Name again
3. Enter a different Description
4. Click Create

**Expected result:**
```gherkin
Given a program named with a unique value already exists
When I create another program with that same Program Name
Then the dialog closes
And no duplicate-name error is shown
And the program list shows two rows with that name
```

**Priority:** High

---

### TC-016
**Title:** Rapid double-click on Create produces two program records

**Preconditions:**
- User is logged in as admin
- Program creation form is open with a unique Program Name filled

**Steps:**
1. Double-click Create before the dialog closes

**Expected result:**
```gherkin
Given I am on the program creation form with a unique Program Name
When I double-click Create
Then two programs with that name appear in the list
And no submission-guard prevents the second create
```

**Priority:** Medium

---

## Ambiguities and Gaps in Acceptance Criteria

1. **Extra fields not in ACs:** The live "New Program" dialog also has Show AI Generation Config, Total Program Hours, Default Session Hours (default 4), Default Exam Hours (default 3), Target Audience, Focus Areas, and Sync/Async Ratio (default 70% sync / 30% async). ACs only mention Program Name and Description.
2. **Description optional:** Confirmed on the live form (no required marker; Create enables from Program Name alone).
3. **No max length:** Program Name has no HTML `maxLength`. 255 and 256 character names are both accepted (related: DS-78, DS-191).
4. **Duplicate names:** Creation does not block duplicates (related: DS-13, DS-77, DS-18, DS-188). Duplicate handling is out of scope for DS-1 ACs but is actual create behavior.
5. **Double-click Create:** Rapid double-click creates two records (related: DS-17, DS-79, DS-110, DS-189, SS-26). ACs do not mention a submit guard.
6. **Cancel / close persistence:** Cancel and X close the dialog without saving, but typed values remain when the dialog is reopened. After a successful create, the next open is empty.
7. **Whitespace:** Spaces-only names keep Create disabled. Leading/trailing spaces around a real name are trimmed on save.
8. **Invalid hours:** Total Program Hours is a Mantine NumberInput; "abc" and "-5" are stripped to empty and do not disable Create. Related bug DS-115 describes a silent-fail path that was not reproduced when the input cleared itself.
9. **List subtitle concatenation:** Filling Description plus Total Program Hours, Target Audience, and Focus Areas shows those values concatenated in the list description line with no separators.
10. **Success feedback:** No toast or alert appears after create. The only confirmation is the dialog closing and the new row appearing. Dialog dismiss can take several seconds on the shared list (~6000 programs; related: DS-16).
11. **User roles:** ACs say "logged in as admin" only. Non-admin behavior is unspecified.
12. **List locators:** Row actions use accessible names `Edit {Program Name}` and `Delete {Program Name}`. Broad `getByText(name)` matches the actions cell (related: DS-19, DS-88, DS-98).
