# Test Plan: Program Name Validation and Duplicate Prevention

## Positive Flows

### TC-001
**Title:** Program name with special characters is accepted and saved

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter a unique name based on "Informatique & IA - Niveau 2" in Program Name
2. Enter "Advanced informatics and AI program" in Description
3. Click Create
4. Observe the program list

**Expected result:**
```gherkin
Given I am on the program creation form
When I enter "Informatique & IA - Niveau 2" as the program name
And I fill in Description with "Advanced informatics and AI program"
And I click Create
Then the program is created successfully
And the program list shows that name
```

**Priority:** High

---

### TC-002
**Title:** Program name with accented characters is accepted

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter a unique name based on "Programme d'Été 2026" in Program Name
2. Enter "Summer program in French" in Description
3. Click Create

**Expected result:**
```gherkin
Given I am on the program creation form
When I enter "Programme d'Été 2026" as the program name
And I fill other required fields
And I click Create
Then the program is created successfully
```

**Priority:** Medium

---

### TC-011
**Title:** Program name with only special characters is accepted

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter a unique name based on "---" in Program Name
2. Enter "Special chars only name" in Description
3. Click Create

**Expected result:**
```gherkin
Given I am on the program creation form
When I enter "---" as the program name
And I fill other required fields
And I click Create
Then the program is created successfully
```

**Priority:** Low

---

## Negative Flows

### TC-003
**Title:** Whitespace-only program name is rejected and form is not submitted

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter "   " (three spaces) in Program Name
2. Enter "Valid description" in Description
3. Observe Create and the dialog

**Expected result:**
```gherkin
Given I am on the program creation form
When I enter "   " as the program name
Then the Create button is disabled
And the form is not submitted
```

**Priority:** High

---

### TC-005
**Title:** Empty program name prevents form submission

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Leave Program Name empty
2. Enter "Description without name" in Description
3. Observe Create

**Expected result:**
```gherkin
Given I am on the program creation form
When I leave the Program Name field empty
Then the Create button is disabled
And the form is not submitted
```

**Priority:** High

---

### TC-004
**Title:** Duplicate program name is accepted on create (no error shown)

**Preconditions:**
- User is logged in as admin
- A program with a unique name based on "Web Development 2026" already exists
- Program creation form is open

**Steps:**
1. Enter the same Program Name again
2. Enter "Duplicate attempt" in Description
3. Click Create
4. Observe errors and the program list

**Expected result:**
```gherkin
Given a program "Web Development 2026" already exists
When I try to create a new program with the same name
Then no inline validation or toast error is shown
And the dialog closes
And the list shows two programs with that name
```

**Priority:** High

**Note:** Jira AC expects rejection; live app behavior differs (documented under Ambiguities).

---

## Edge Cases

### TC-006
**Title:** Duplicate check is case-sensitive on create

**Preconditions:**
- User is logged in as admin
- Program "Web Development 2026" (unique instance) already exists
- Program creation form is open

**Steps:**
1. Enter the same name in all lowercase in Program Name
2. Enter "Case variation test" in Description
3. Click Create

**Expected result:**
```gherkin
Given a program "Web Development 2026" already exists
When I try to create a new program with the name "web development 2026"
Then the program is created successfully
And both the original and lowercase names appear as separate programs
```

**Priority:** Medium

---

### TC-007
**Title:** Leading and trailing whitespace is trimmed before save

**Preconditions:**
- User is logged in as admin
- Program with a unique name already exists
- Program creation form is open

**Steps:**
1. Enter the same name with leading and trailing spaces
2. Enter "Whitespace padding test" in Description
3. Click Create

**Expected result:**
```gherkin
Given a program already exists with a unique name
When I enter that name padded with spaces
And I click Create
Then the dialog closes
And a second program with the trimmed name is created
And no duplicate-name error is shown
```

**Priority:** High

---

### TC-008
**Title:** Program name at 255 characters is accepted

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter a unique 255-character string in Program Name
2. Enter "Max length boundary test" in Description
3. Click Create

**Expected result:**
```gherkin
Given I am on the program creation form
When I enter a 255-character string as the program name
And I click Create
Then the program is created successfully
```

**Priority:** Medium

---

### TC-009
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
When I enter a 256-character string as the program name
And I click Create
Then the program is created successfully
And no max-length validation error is shown
```

**Priority:** Medium

---

### TC-010
**Title:** Program name with HTML/script tags is stored as plain text

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter a unique name containing `<script>alert('xss')</script>` in Program Name
2. Enter "XSS test description" in Description
3. Click Create
4. Observe alerts and the list

**Expected result:**
```gherkin
Given I am on the program creation form
When I enter a script tag as the program name
And I click Create
Then no browser alert is executed
And the program is created with the literal name text shown in the list
```

**Priority:** High

---

### TC-012
**Title:** Duplicate prevention does not block edit rename to an existing name

**Preconditions:**
- User is logged in as admin
- Two programs with distinct unique names exist
- Edit form is open for the second program

**Steps:**
1. Change Program Name to match the first program
2. Click Save

**Expected result:**
```gherkin
Given a program name already exists
And I am editing another program
When I change the Name to the existing name
And I click Save
Then the dialog closes
And no duplicate-name error is shown
And the list shows two programs with that name
```

**Priority:** High

---

### TC-013
**Title:** Rapid double-click on Create produces duplicate program records with the same name

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
And no submission guard prevents the second create
```

**Priority:** Medium

---

### TC-014
**Title:** Tab and newline characters in Program Name are normalized on save

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter a name containing a tab and newline before a unique suffix
2. Click Create
3. Observe the stored name via the Edit action label

**Expected result:**
```gherkin
Given I am on the program creation form
When I enter a program name containing tab and newline characters
And I click Create
Then the program is created
And newline is normalized to a space in the saved name
```

**Priority:** Low

---

## Ambiguities and Gaps in Acceptance Criteria

1. **Duplicate rejection (AC vs app):** AC requires an error when creating a duplicate name. The live app **allows** duplicates on create and edit with no inline or toast error (related: DS-13, DS-77, DS-188).
2. **Whitespace-only names:** Matches AC — Create stays disabled; form is not submitted.
3. **Special characters:** Matches AC — names with `&`, accents, em dash, and `---` are accepted.
4. **Case sensitivity:** Duplicates are **case-sensitive**; `web development 2026` and `Web Development 2026` are distinct.
5. **Trimming:** Leading/trailing spaces are trimmed on save; padded duplicate names create a second row rather than triggering duplicate validation.
6. **Maximum length:** No HTML `maxLength` on Program Name; 255 and 256+ character names both save.
7. **Duplicate on edit:** AC silent; edit rename to an existing name is allowed.
8. **Double-click Create:** No guard; two identical records can be created (related: DS-17, DS-79).
9. **Internal whitespace:** Newlines in the name field normalize to spaces in the saved name; tabs may remain.
10. **XSS:** Script tags are stored and displayed as literal text; no `alert` execution observed.
11. **Locators:** Row actions use `Edit {Program Name}`; use `exact: true` on the Edit button so case-variant names do not cross-match. Assert names via row-scoped `p` first line, not broad `getByText` on the table.
