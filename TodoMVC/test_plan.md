# Test Plan: Playwright TodoMVC Demo

**Application under test:** [https://demo.playwright.dev/todomvc/#/](https://demo.playwright.dev/todomvc/#/)  
**Page title:** React • TodoMVC

**Scope (Acceptance Criteria):**

- User can add a todo item to the list
- User can complete an item
- User can delete an item from the list

**Key UI elements (verified on demo):**

| Element | Selector / label |
|--------|-------------------|
| New todo input | Textbox **What needs to be done?** (class `new-todo`) |
| Todo row | `[data-testid="todo-item"]` |
| Todo text | `[data-testid="todo-title"]` |
| Complete toggle | Checkbox **Toggle Todo** (class `toggle`) |
| Delete control | Button **Delete** (class `destroy`) |
| Items counter | `.todo-count` (e.g. `1 item left`, `3 items left`) |
| Mark all complete | Checkbox **Mark all as complete** |
| Filters | Links **All**, **Active**, **Completed** |

---

## Positive Flows

### TC-001

**Title:** A new todo appears in the list after submitting text in **What needs to be done?**

**Preconditions:**

- Browser opened at `https://demo.playwright.dev/todomvc/#/`
- Todo list is empty (no `[data-testid="todo-item"]` rows; footer with filters is not shown)

**Steps:**

1. Click the **What needs to be done?** textbox.
2. Type `Buy milk`.
3. Press **Enter**.

**Expected result:**

```gherkin
Given the TodoMVC app is open with an empty list
When I enter "Buy milk" in "What needs to be done?" and press Enter
Then one todo row is visible with title "Buy milk"
And the todo-count shows "1 item left"
And filter links "All", "Active", and "Completed" are visible
```

---

### TC-002

**Title:** Multiple todos can be added and each is listed with an updated item count

**Preconditions:**

- App is open at `https://demo.playwright.dev/todomvc/#/`
- List is empty

**Steps:**

1. Add `Buy milk` via **What needs to be done?** and **Enter**.
2. Add `Walk dog` via **What needs to be done?** and **Enter**.
3. Add `Pay bills` via **What needs to be done?** and **Enter**.

**Expected result:**

```gherkin
Given an empty todo list
When I add "Buy milk", "Walk dog", and "Pay bills"
Then three todo rows are visible in order added
And the todo-count shows "3 items left"
And each row has a "Toggle Todo" checkbox and a "Delete" button
```

---

### TC-003

**Title:** A todo is marked completed when **Toggle Todo** is checked

**Preconditions:**

- App is open
- Exactly one todo exists with title `Buy milk` and it is active (not completed)

**Steps:**

1. Click the **Toggle Todo** checkbox on the `Buy milk` row.
2. Observe the row styling and the items counter.

**Expected result:**

```gherkin
Given an active todo "Buy milk" is in the list
When I check "Toggle Todo" for that row
Then the todo row has completed styling (class "completed" on the list item)
And the todo-count shows "0 items left"
And the todo title text remains "Buy milk"
And the todo is not removed from the "All" list
```

---

### TC-004

**Title:** A completed todo becomes active again when **Toggle Todo** is unchecked

**Preconditions:**

- App is open
- Todo `Buy milk` exists and is completed

**Steps:**

1. Click the **Toggle Todo** checkbox on the completed `Buy milk` row again.

**Expected result:**

```gherkin
Given a completed todo "Buy milk"
When I uncheck "Toggle Todo" for that row
Then the todo row is no longer marked completed
And the todo-count shows "1 item left"
```

---

### TC-005

**Title:** A todo is removed from the list when **Delete** is activated

**Preconditions:**

- App is open
- Todo `Buy milk` exists (active or completed)

**Steps:**

1. Hover or focus the `Buy milk` row so the **Delete** control is available.
2. Click **Delete** on that row.
3. Observe the list and footer.

**Expected result:**

```gherkin
Given a todo "Buy milk" is in the list
When I click "Delete" for that todo
Then no todo row displays "Buy milk"
And no "[data-testid=\"todo-item\"]" rows remain when it was the only item
And the footer (filters and todo-count) is hidden when the list is empty
```

---

### TC-006

**Title:** Deleting one item leaves remaining todos unchanged

**Preconditions:**

- App is open
- Todos `Buy milk` and `Walk dog` exist and are active

**Steps:**

1. Click **Delete** on the `Buy milk` row only.

**Expected result:**

```gherkin
Given todos "Buy milk" and "Walk dog" are in the list
When I delete "Buy milk"
Then exactly one todo remains with title "Walk dog"
And the todo-count shows "1 item left"
```

---

## Negative Flows

### TC-007

**Title:** Pressing Enter with an empty **What needs to be done?** field does not create a todo

**Preconditions:**

- App is open
- Todo list is empty

**Steps:**

1. Click **What needs to be done?** without typing.
2. Press **Enter** twice.

**Expected result:**

```gherkin
Given an empty todo list
When I press Enter in "What needs to be done?" without entering text
Then no todo rows are added
And the footer with filters remains hidden
```

---

### TC-008

**Title:** Whitespace-only input does not create a todo row

**Preconditions:**

- App is open
- Todo list is empty

**Steps:**

1. Type three spaces `   ` in **What needs to be done?**.
2. Press **Enter**.

**Expected result:**

```gherkin
Given an empty todo list
When I submit only spaces in "What needs to be done?" and press Enter
Then no new "[data-testid=\"todo-item\"]" is created
And the list stays empty
```

---

### TC-009

**Title:** Completing a todo does not remove it from the list

**Preconditions:**

- App is open
- Single active todo `Buy milk` exists

**Steps:**

1. Check **Toggle Todo** for `Buy milk`.
2. Look for the todo title in the main list under heading **todos**.

**Expected result:**

```gherkin
Given an active todo "Buy milk"
When I mark it complete
Then "Buy milk" is still visible as a todo row
And it is not deleted automatically
```

---

### TC-010

**Title:** Special characters in todo text are displayed as plain text and do not execute scripts

**Preconditions:**

- App is open
- List is empty

**Steps:**

1. Add `Task & "quotes" <tag>` via **What needs to be done?** and **Enter**.
2. Observe the displayed title and page behavior (no alert dialog).

**Expected result:**

```gherkin
Given an empty list
When I add the todo 'Task & "quotes" <tag>'
Then the todo-title shows the exact characters entered
And no script alert or HTML rendering of "<tag>" as an element occurs
```

---

## Edge Cases

### TC-011

**Title:** Duplicate todo titles are allowed as separate list entries

**Preconditions:**

- App is open
- List is empty

**Steps:**

1. Add `Buy milk` and press **Enter**.
2. Add `Buy milk` again and press **Enter**.

**Expected result:**

```gherkin
Given an empty list
When I add "Buy milk" twice
Then two separate todo rows both show title "Buy milk"
And the todo-count shows "2 items left"
```

---

### TC-012

**Title:** Very long todo text (500 characters) is accepted and stored in full

**Preconditions:**

- App is open
- At least one todo already exists (to verify counter increment)

**Steps:**

1. Enter a string of 500 letter `A` characters in **What needs to be done?**.
2. Press **Enter**.
3. Inspect `[data-testid="todo-title"]` for the new row.

**Expected result:**

```gherkin
Given the todo list is displayed
When I add a todo consisting of 500 "A" characters
Then a new todo row is created
And the todo-title text length is 500 characters
And the todo-count increases by one (e.g. "4 items left" when three items existed before)
```

---

### TC-013

**Title:** Todo-count uses singular **item** for one active todo and **items** for multiple

**Preconditions:**

- App is open
- List is empty

**Steps:**

1. Add `Buy milk` only; read `.todo-count`.
2. Add `Walk dog`; read `.todo-count` again.

**Expected result:**

```gherkin
Given an empty list
When I have one active todo
Then the todo-count text is "1 item left"
When I add a second active todo
Then the todo-count text is "2 items left"
```

---

### TC-014

**Title:** Footer and filters are hidden when the last todo is deleted

**Preconditions:**

- App is open
- Exactly one todo `Buy milk` exists

**Steps:**

1. Click **Delete** on `Buy milk`.
2. Observe the area below the **What needs to be done?** input.

**Expected result:**

```gherkin
Given a single todo in the list
When I delete that todo
Then no "All" / "Active" / "Completed" filter links are shown
And no todo-count element is shown
```

---

### TC-015

**Title:** Leading and trailing spaces are trimmed when a todo is added

**Preconditions:**

- App is open
- List is empty

**Steps:**

1. Type `  Trim me  ` in **What needs to be done?** (leading and trailing spaces).
2. Press **Enter**.
3. Read `[data-testid="todo-title"]` text.

**Expected result:**

```gherkin
Given an empty list
When I add "  Trim me  " with spaces around the words
Then a todo row is created
And the todo-title displays "Trim me" without leading or trailing spaces
```

---

## Ambiguities and Gaps in the Acceptance Criteria

1. **Persistence:** The demo stores todos in browser `localStorage`. ACs do not state whether items must survive refresh or new sessions; clarify if persistence is in scope.
2. **Input normalization:** ACs do not mention trimming; the demo trims leading/trailing spaces on save (see TC-015).
3. **Duplicates:** ACs do not say whether duplicate titles are allowed; the demo allows them (TC-011).
4. **Uncomplete / edit:** ACs only mention “complete an item,” not toggling back to active or double-click edit (**Edit** field exists in the DOM). Out of scope unless product owner expands ACs.
5. **Filters and “Mark all as complete”:** Not mentioned in ACs; behavior is undefined for this test plan’s official pass/fail unless ACs are extended.
6. **Delete interaction:** **Delete** is visually hidden until the row is hovered/focused; ACs do not define accessibility or keyboard-only delete requirements.
7. **Maximum length:** No AC limit on title length; demo accepted 500 characters in exploratory check — define a business max if one exists.
8. **Empty vs whitespace:** ACs imply “add an item” but not explicit rejection rules for empty or whitespace-only submissions (covered as negative tests above).
