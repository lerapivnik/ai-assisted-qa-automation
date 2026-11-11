# AI-assisted QA automation

Playwright end-to-end tests for Didaxis, plus Cursor agents and skills that turn Jira tickets into specs, triage red runs, and heal locator drift.

## Prerequisites

- Node.js 20+
- npm

## Setup

```bash
git clone <repo-url>
cd ai-assisted-qa-automation
npm ci
npx playwright install --with-deps chromium
cp .env.example .env
```

Edit `.env` with real values. Never commit `.env` (it is gitignored). Use `.env.example` as the template only — placeholders, no secrets.

### Environment variables

**Run tests** (required for `npx playwright test`):

| Variable | Purpose |
| --- | --- |
| `DIDAXIS_URL` | App base URL (`use.baseURL`) |
| `DIDAXIS_EMAIL` / `DIDAXIS_PASSWORD` | Auth setup → `playwright/.auth/user.json` |
| `DIDAXIS_API_TOKEN` | Bearer token for API cleanup / checks |
| `DIDAXIS_ALT_EMAIL` / `DIDAXIS_ALT_PASSWORD` | Optional — permission probe accounts |

**Agent / CI** (not needed for local Playwright alone):

| Variable | Purpose |
| --- | --- |
| `CURSOR_API_KEY` | Headless Cursor agent in `.github/workflows/test-generation.yml` |
| `ATLASSIAN_API_TOKEN` / `ATLASSIAN_BASE_URL` / `ATLASSIAN_EMAIL` | Jira access for agents; also wire MCP tokens in Cursor settings |

## Run tests

```bash
npx playwright test
# or
npm test
```

Useful variants:

```bash
npm run test:headed   # headed browser
npm run test:ui       # Playwright UI mode
npm run test:report   # open last HTML report
```

### Tagged slice

Specs tag individual tests (never `describe`). Run a tag with Playwright’s grep:

```bash
npx playwright test --grep @regression
```

## Cursor agents and skills

Policy lives under `.cursor/`:

- **Rules** — `constitution.mdc`, `qa-orchestration.mdc`, `playwright-conventions.mdc` (always-on conventions and the ticket → plan → write → run → triage/heal loop).
- **Skills** (`.cursor/skills/`) — `jira-ticket-to-gherkin`, `explore-and-generate`, `pom-conventions`, `a11y-checks`, `api-cleanup`, `ci-failure-triage`, `self-heal`, `jira-bug-reporter`, `eval-report`.
- **Agents** (`.cursor/agents/`) — `test-writer` (plan → spec), `triage` (classify red), `bug-reporter` (file + link Jira).

Reliability snapshot: `eval-report.md` (flake / heal / generation-gate / ask-vs-guess). Regenerate with `npm run eval:report` after `test-generation.yml` or any agent/orchestrator session (see `.cursor/skills/eval-report/SKILL.md`).

For local agent work: copy `.env.example` → `.env` for Didaxis vars, set `CURSOR_API_KEY` / Atlassian vars when using the headless agent or Jira skills, and configure Atlassian MCP tokens in Cursor settings. Humans approve every merge and every filed bug.
