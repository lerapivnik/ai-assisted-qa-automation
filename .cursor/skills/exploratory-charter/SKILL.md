---
name: exploratory-charter
description: >
  Turns a feature + a risk into an exploratory charter and a findings
  template. Use when the user asks for an exploratory charter, ET
  session, session charter, risk-based explore, or exploratory findings
  template. The thinking is human; the skill just keeps the format.
---

# Exploratory charter

a tiny procedure that turns a feature + a risk into a charter and a findings template. The thinking is human; the skill just keeps the format.

Do not explore the app. Do not write Playwright. Do not invent findings. Emit the charter and the blank findings template only.

## Inputs

Require both. If either is missing, ask once and stop:

1. **Feature** — what is in scope to explore
2. **Risk** — why this session matters (failure mode, harm, or uncertainty)

## Steps

1. Restate feature and risk in one line each (user's words; do not expand).
2. Fill the **Charter** template below.
3. Fill the **Findings** template below with blank rows ready for a human.
4. Return both in the response. Do not create files unless the user asks.

## Charter

```markdown
# Charter

- Mission: Explore <feature> with attention to <risk>
- Feature: <feature>
- Risk: <risk>
- Scope in:
  - 
- Scope out:
  - 
- Time box: <duration or TBD>
- Environment: <env or TBD>
- Notes / oracles:
  - 
```

## Findings

```markdown
# Findings

| # | Area | Observation | Severity | Evidence | Follow-up |
|---|------|-------------|----------|----------|-----------|
| 1 |  |  |  |  |  |
| 2 |  |  |  |  |  |
| 3 |  |  |  |  |  |

## Session log
- Started:
- Ended:
- Coverage notes:
```
