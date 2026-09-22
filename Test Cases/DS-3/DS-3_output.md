# Test Plan: Program Name Validation and Duplicate Prevention

## Positive Flows

### TC-001
**Title:** Program name with special characters is accepted and saved

**Preconditions:**
- User is logged in as admin
- Program creation form is open
- No program named "Informatique & IA - Niveau 2" exists

**Steps:**
1. Enter "Informatique & IA - Niveau 2" in Program Name
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
And the program list shows "Informatique & IA - Niveau 2"
```

**Priority:** High

---

### TC-002
**Title:** Program name with accented characters is accepted

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter "Programme d'Été 2026" in Program Name
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

## Negative Flows

### TC-003
**Title:** Whitespace-only program name is rejected and form is not submitted

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter "   " (three spaces) in Program Name
2. Enter "Valid description" in Description
3. Click Create
4. Observe form state and program list

**Expected result:**
```gherkin
Given I am on the program creation form
When I enter "   " as the program name
And I click Create
Then the form is not submitted
And the name is trimmed and treated as empty
And the Create button is disabled or a validation error is shown
```

**Priority:** High

---

### TC-004
**Title:** Duplicate program name is rejected with an error message

**Preconditions:**
- User is logged in as admin
- Program "Web Development 2026" already exists
- Program creation form is open

**Steps:**
1. Enter "Web Development 2026" in Program Name
2. Enter "Duplicate attempt" in Description
3. Click Create
4. Observe the error message and program list

**Expected result:**
```gherkin
Given a program "Web Development 2026" already exists
When I try to create a new program with the name "Web Development 2026"
Then I see an error indicating the name already exists
And no duplicate program is created
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
3. Attempt to click Create

**Expected result:**
```gherkin
Given I am on the program creation form
When I leave the Program Name field empty
Then the Create button is disabled
And the form is not submitted
```

**Priority:** High

---

### TC-006
**Title:** Duplicate check is case-sensitive (exact match required)

**Preconditions:**
- User is logged in as admin
- Program "Web Development 2026" already exists
- Program creation form is open

**Steps:**
1. Enter "web development 2026" (lowercase) in Program Name
2. Enter "Case variation test" in Description
3. Click Create
4. Observe whether creation succeeds or fails

**Expected result:**
```gherkin
Given a program "Web Development 2026" already exists
When I try to create a new program with the name "web development 2026"
Then the system either rejects it as a duplicate (case-insensitive)
Or creates it as a distinct program (case-sensitive)
And the behavior is consistent and documented
```

**Priority:** Medium

---

## Edge Cases

### TC-007
**Title:** Leading and trailing whitespace is trimmed before duplicate check

**Preconditions:**
- User is logged in as admin
- Program "Web Development 2026" already exists
- Program creation form is open

**Steps:**
1. Enter "  Web Development 2026  " (with leading/trailing spaces) in Program Name
2. Enter "Whitespace padding test" in Description
3. Click Create

**Expected result:**
```gherkin
Given a program "Web Development 2026" already exists
When I enter "  Web Development 2026  " as the program name
And I click Create
Then I see an error indicating the name already exists
And no duplicate program is created
```

**Priority:** High

---

### TC-008
**Title:** Program name at maximum allowed length is accepted

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter a 255-character string in Program Name
2. Enter "Max length boundary test" in Description
3. Click Create

**Expected result:**
```gherkin
Given I am on the program creation form
When I enter a 255-character string as the program name
And I fill other required fields
And I click Create
Then the program is created successfully
```

**Priority:** Medium

---

### TC-009
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
When I enter a 256-character string as the program name
And I click Create
Then I see a validation error indicating the name exceeds the maximum length
And the program is not created
```

**Priority:** Medium

---

### TC-010
**Title:** Program name with HTML/script tags is sanitized or rejected

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter "<script>alert('xss')</script>" in Program Name
2. Enter "XSS test description" in Description
3. Click Create
4. Observe how the name is stored and displayed

**Expected result:**
```gherkin
Given I am on the program creation form
When I enter "<script>alert('xss')</script>" as the program name
And I click Create
Then the script is not executed
And the name is either sanitized or rejected with a validation error
```

**Priority:** High

---

### TC-011
**Title:** Program name with only special characters is accepted if non-empty after trim

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter "---" in Program Name
2. Enter "Special chars only name" in Description
3. Click Create

**Expected result:**
```gherkin
Given I am on the program creation form
When I enter "---" as the program name
And I fill other required fields
And I click Create
Then the program is created successfully
Or a validation error is shown if special-character-only names are disallowed
```

**Priority:** Low

---

### TC-012
**Title:** Duplicate prevention applies on edit as well as create

**Preconditions:**
- User is logged in as admin
- Programs "Web Development 2026" and "Data Science 2026" exist
- Edit form is open for "Data Science 2026"

**Steps:**
1. Change the Name to "Web Development 2026"
2. Click Save

**Expected result:**
```gherkin
Given a program "Web Development 2026" already exists
And I am editing "Data Science 2026"
When I change the Name to "Web Development 2026"
And I click Save
Then I see an error indicating the name already exists
And the name remains "Data Science 2026"
```

**Priority:** High

---

## Ambiguities and Gaps in Acceptance Criteria

1. **Case sensitivity:** ACs do not specify whether duplicate detection is case-sensitive. TC-006 flags this ambiguity.
2. **Whitespace trimming scope:** AC covers whitespace-only names but not leading/trailing whitespace on otherwise valid names. TC-007 addresses this gap.
3. **Maximum length:** No AC defines the character limit for Program Name. TC-008 and TC-009 assume 255 characters.
4. **Duplicate on edit:** ACs only mention creation; unclear if duplicate check applies when editing. TC-012 covers this gap.
5. **Error message content:** AC says "an error indicating the name already exists" but does not specify exact wording or UI placement (inline vs. toast).
6. **Special character restrictions:** AC accepts one example with `&` and `-` but does not define a full allowed character set. TC-010 and TC-011 probe boundaries.
7. **Internationalization:** AC includes a French name example but does not clarify Unicode support beyond accented characters.
