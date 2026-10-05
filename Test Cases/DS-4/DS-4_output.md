# Test Plan: Delete Program with Confirmation

## Positive Flows

### TC-001
**Title:** Program is permanently removed after confirming deletion

**Preconditions:**
- User is logged in as admin
- A program based on "Test Program" exists on the Programs page

**Steps:**
1. Navigate to the Programs page
2. Click the delete action `Delete {program name}`
3. Observe the native browser confirmation dialog
4. Click OK / Confirm on the dialog
5. Observe the program list

**Expected result:**
```gherkin
Given a program "Test Program" exists
When I click the delete action for "Test Program"
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
2. Click the delete action for a program
3. Observe the confirmation dialog
4. Click Cancel on the native confirm dialog (dismiss)
5. Observe the program list

**Expected result:**
```gherkin
Given I click the delete action for a program
When I see the confirmation dialog
And I click Cancel
Then the program still exists in the list
```

**Priority:** High

---

### TC-003
**Title:** Confirmation dialog displays the program name and cascade warning

**Preconditions:**
- User is logged in as admin
- Program "Test Program" exists

**Steps:**
1. Click the delete action for "Test Program"
2. Read the confirmation dialog message

**Expected result:**
```gherkin
Given a program "Test Program" exists
When I click the delete action for "Test Program"
Then I see a native confirm dialog
And the message includes the program name
And the message warns that semesters and courses will be removed
And the message states the action cannot be undone
```

**Priority:** Medium

---

## Negative Flows

### TC-004
**Title:** Program is not deleted when confirmation dialog is dismissed

**Preconditions:**
- User is logged in as admin
- Program "Test Program" exists

**Steps:**
1. Click the delete action for "Test Program"
2. Dismiss the native confirm dialog (Cancel)
3. Observe the program list

**Expected result:**
```gherkin
Given I click the delete action for "Test Program"
When I dismiss the confirmation dialog without confirming
Then "Test Program" still exists in the program list
```

**Priority:** Medium

---

### TC-005
**Title:** Unauthenticated user cannot delete a program

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
And I do not see any Delete actions
```

**Priority:** High

---

### TC-006
**Title:** Deleting an already-deleted program removes stale row after confirm

**Preconditions:**
- User is logged in as admin in two sessions
- The same program exists in both sessions

**Steps:**
1. Session B deletes the program and confirms
2. Session A still shows the program (stale list)
3. Session A clicks delete and confirms
4. Observe Session A's list after reload

**Expected result:**
```gherkin
Given the program no longer exists on the server
When I confirm deletion from a stale list view
Then the program does not reappear
And the list no longer shows that program after refresh
```

**Priority:** Medium

---

### TC-007
**Title:** Confirming deletion once removes the program without duplicate DELETE errors

**Preconditions:**
- User is logged in as admin
- Program "Test Program" exists

**Steps:**
1. Click the delete action for "Test Program"
2. Accept the confirmation dialog once
3. Observe the program list and network DELETE calls

**Expected result:**
```gherkin
Given I see the confirmation dialog for "Test Program"
When I confirm once
Then "Test Program" is removed exactly once from the list
And at most one DELETE request is sent
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
1. Click the delete action for that program
2. Confirm deletion
3. Observe the program list

**Expected result:**
```gherkin
Given a program with special characters in the name exists
When I confirm deletion
Then that program is removed from the program list
```

**Priority:** Medium

---

### TC-009
**Title:** Deleted program no longer appears in the program list

**Preconditions:**
- User is logged in as admin
- Program exists

**Steps:**
1. Delete the program and confirm
2. Observe the list

**Expected result:**
```gherkin
Given a program exists
When I confirm its deletion
Then it no longer appears in the program list
And the Delete action for that name is gone
```

**Priority:** Medium

---

### TC-010
**Title:** Deleting a program with a very long name shows the name in confirmation

**Preconditions:**
- User is logged in as admin
- Program with a 255-character name exists

**Steps:**
1. Click the delete action for the long-named program
2. Dismiss the confirmation and read the message

**Expected result:**
```gherkin
Given a program with a 255-character name exists
When I click the delete action for that program
Then the native confirm message includes the full program name
And I can confirm or cancel the deletion
```

**Priority:** Low

---

### TC-011
**Title:** Dismissing the confirmation dialog keeps the program (no modal Cancel button)

**Preconditions:**
- User is logged in as admin
- Program exists

**Steps:**
1. Click the delete action
2. Dismiss the native confirm without accepting

**Expected result:**
```gherkin
Given I see the native delete confirmation
When I dismiss it
Then the program remains in the list
```

**Priority:** Low

---

### TC-012
**Title:** Concurrent deletion by two users leaves the program removed

**Preconditions:**
- Two admin sessions
- Same program visible in both

**Steps:**
1. Both users trigger delete
2. Both confirm
3. Observe both lists

**Expected result:**
```gherkin
Given two users delete the same program
When both confirm
Then the program is absent from both users' lists after refresh
And no user-visible error is required if the second DELETE is idempotent
```

**Priority:** Low

---

### TC-013
**Title:** Rapid double-click on delete can open multiple confirmation dialogs

**Preconditions:**
- User is logged in as admin
- Program exists

**Steps:**
1. Double-click the delete action quickly
2. Dismiss each confirmation dialog that appears

**Expected result:**
```gherkin
Given a program exists
When I double-click the delete action
Then more than one native confirmation dialog may appear
And dismissing all dialogs leaves the program in the list until one is accepted
```

**Priority:** Medium

---

## Ambiguities and Gaps in Acceptance Criteria

1. **Native confirm vs in-app modal:** AC says "confirmation dialog"; the app uses the browser `window.confirm()` with OK/Cancel, not a Mantine modal (related: DS-172).
2. **Cancel wording:** AC says "click Cancel"; on the native dialog this is **Dismiss/Cancel**, handled via `dialog.dismiss()` in Playwright.
3. **Delete control:** Row action accessible name is `Delete {Program Name}` (icon button, often empty visible text).
4. **Message text:** `Delete program "{name}"? All its semesters and courses will be removed. This cannot be undone.`
5. **Cascade:** Message mentions semesters and courses; ACs do not define backend cascade behavior beyond this warning.
6. **Success feedback:** No toast after delete; removal from the list is the only confirmation.
7. **Empty state:** Deleting the only program should show empty state (DS-5), but the shared test environment always has thousands of programs — empty-state delete is not practically testable there.
8. **Stale / concurrent delete:** Second confirm on an already-deleted program typically leaves the list clean after reload; no guaranteed user-visible error (related: DS-116).
9. **Double-click delete:** Can queue multiple confirm dialogs (related: DS-109, DS-156, DS-30).
10. **Locators:** Use `Delete {name}` with `exact: true`; assert removal via delete button count or row filter, not broad table `getByText` (avoids actions-column false positives).
11. **Large list:** Scroll delete control into view before clicking on crowded Programs pages (related: DS-107).
