# Test Plan: Delete Program with Confirmation

## Positive Flows

### TC-001
**Title:** Program is permanently removed after confirming deletion

**Preconditions:**
- User is logged in as admin
- Program "Test Program" exists on the Programs page

**Steps:**
1. Navigate to the Programs page
2. Click the delete icon for "Test Program"
3. Observe the confirmation dialog
4. Click Confirm (or equivalent affirmative action)
5. Observe the program list

**Expected result:**
```gherkin
Given a program "Test Program" exists
When I click the delete icon for "Test Program"
Then I see a confirmation dialog
When I confirm deletion
Then "Test Program" is removed from the program list
```

**Priority:** High

---

### TC-002
**Title:** Program remains in the list when deletion is cancelled

**Preconditions:**
- User is logged in as admin
- At least one program exists on the Programs page

**Steps:**
1. Navigate to the Programs page
2. Click the delete icon for a program
3. Observe the confirmation dialog
4. Click Cancel
5. Observe the program list

**Expected result:**
```gherkin
Given I click the delete icon for a program
When I see the confirmation dialog
And I click Cancel
Then the program still exists in the list
And the confirmation dialog closes
```

**Priority:** High

---

### TC-003
**Title:** Confirmation dialog displays the program name being deleted

**Preconditions:**
- User is logged in as admin
- Program "Test Program" exists

**Steps:**
1. Click the delete icon for "Test Program"
2. Read the confirmation dialog message

**Expected result:**
```gherkin
Given a program "Test Program" exists
When I click the delete icon for "Test Program"
Then I see a confirmation dialog
And the dialog mentions "Test Program" by name
```

**Priority:** Medium

---

## Negative Flows

### TC-004
**Title:** Program is not deleted when confirmation dialog is dismissed without action

**Preconditions:**
- User is logged in as admin
- Program "Test Program" exists

**Steps:**
1. Click the delete icon for "Test Program"
2. Press Escape or click outside the dialog (if supported)
3. Observe the program list

**Expected result:**
```gherkin
Given I click the delete icon for "Test Program"
When I dismiss the confirmation dialog without confirming
Then "Test Program" still exists in the program list
```

**Priority:** Medium

---

### TC-005
**Title:** Unauthenticated user cannot delete a program

**Preconditions:**
- User is not logged in
- Program "Test Program" exists

**Steps:**
1. Navigate directly to the Programs page URL
2. Attempt to delete a program

**Expected result:**
```gherkin
Given I am not logged in
When I navigate to the Programs page
Then I am redirected to the login page
And I cannot delete any program
```

**Priority:** High

---

### TC-006
**Title:** Deleting a non-existent program shows an appropriate error

**Preconditions:**
- User is logged in as admin
- Program "Test Program" was deleted by another user

**Steps:**
1. User A's browser still shows "Test Program" in the list (stale view)
2. User A clicks delete and confirms
3. Observe the response

**Expected result:**
```gherkin
Given "Test Program" no longer exists on the server
When I attempt to confirm deletion of "Test Program"
Then I see an error indicating the program was not found
And the program list refreshes to reflect the current state
```

**Priority:** Medium

---

### TC-007
**Title:** Double-clicking confirm does not cause duplicate delete requests

**Preconditions:**
- User is logged in as admin
- Program "Test Program" exists

**Steps:**
1. Click the delete icon for "Test Program"
2. Rapidly double-click the Confirm button
3. Observe the program list and any error messages

**Expected result:**
```gherkin
Given I see the confirmation dialog for "Test Program"
When I double-click Confirm
Then "Test Program" is removed exactly once
And no server error occurs
```

**Priority:** Medium

---

## Edge Cases

### TC-008
**Title:** Program with special characters in name can be deleted

**Preconditions:**
- User is logged in as admin
- Program "Informatique & IA - Niveau 2" exists

**Steps:**
1. Click the delete icon for "Informatique & IA - Niveau 2"
2. Confirm deletion
3. Observe the program list

**Expected result:**
```gherkin
Given a program "Informatique & IA - Niveau 2" exists
When I click the delete icon for "Informatique & IA - Niveau 2"
And I confirm deletion
Then "Informatique & IA - Niveau 2" is removed from the program list
```

**Priority:** Medium

---

### TC-009
**Title:** Deleting the only program in the system shows empty state

**Preconditions:**
- User is logged in as admin
- Only one program "Test Program" exists

**Steps:**
1. Click the delete icon for "Test Program"
2. Confirm deletion
3. Observe the Programs page

**Expected result:**
```gherkin
Given only "Test Program" exists
When I confirm deletion of "Test Program"
Then the program list is empty
And I see a message indicating no programs have been created
```

**Priority:** Medium

---

### TC-010
**Title:** Deleting a program with a very long name displays correctly in confirmation dialog

**Preconditions:**
- User is logged in as admin
- Program with a 255-character name exists

**Steps:**
1. Click the delete icon for the long-named program
2. Observe the confirmation dialog layout

**Expected result:**
```gherkin
Given a program with a 255-character name exists
When I click the delete icon for that program
Then the confirmation dialog displays the program name without layout breakage
And I can confirm or cancel the deletion
```

**Priority:** Low

---

### TC-011
**Title:** Keyboard navigation works in the confirmation dialog

**Preconditions:**
- User is logged in as admin
- Program "Test Program" exists

**Steps:**
1. Click the delete icon for "Test Program"
2. Use Tab to navigate between Confirm and Cancel
3. Press Enter on Cancel
4. Observe the result

**Expected result:**
```gherkin
Given I see the confirmation dialog for "Test Program"
When I press Tab to focus Cancel
And I press Enter
Then the dialog closes
And "Test Program" still exists in the list
```

**Priority:** Low

---

### TC-012
**Title:** Concurrent deletion by two users is handled gracefully

**Preconditions:**
- Two admin users are logged in
- Program "Test Program" exists

**Steps:**
1. Both users click delete for "Test Program"
2. User A confirms deletion
3. User B confirms deletion
4. Observe User B's experience

**Expected result:**
```gherkin
Given two users attempt to delete "Test Program"
When User A confirms first
And User B confirms second
Then User B sees an error indicating the program no longer exists
And the program list reflects the deletion
```

**Priority:** Low

---

## Ambiguities and Gaps in Acceptance Criteria

1. **Confirmation dialog content:** ACs require a dialog but do not specify the exact message, button labels (Delete/Confirm/Cancel), or whether the program name is shown.
2. **Dismiss behavior:** No AC covers closing the dialog via Escape or clicking outside. TC-004 addresses this gap.
3. **Cascade effects:** ACs do not define what happens to related data (enrollments, courses) when a program is deleted.
4. **Undo/recovery:** No AC mentions whether deletion is reversible or if a soft-delete/archive option exists.
5. **User roles:** ACs do not specify which roles can delete programs (assumed admin).
6. **Empty state transition:** Deleting the last program should trigger the empty state (DS-5), but this cross-feature behavior is not referenced in DS-4 ACs.
7. **Success feedback:** No AC specifies toast/notification after successful deletion.
8. **Already-deleted program:** No AC covers stale UI or concurrent deletion scenarios. TC-006 and TC-012 address this.
