# SecureScan Project Documentation

## 1. Executive Summary

SecureScan is an Electron-based desktop application that scans repositories and archives for exposed secrets, enriches findings with Git-based developer attribution, stores vulnerabilities in MongoDB, supports remediation workflows, and connects remediation to operational follow-up through Asana tasks and email notifications.

The project was built to solve a workflow gap that basic secret scanners do not solve well: finding a leaked API key is only the beginning. Teams also need to know who introduced it, where it lives, how to fix it, who is responsible for fixing it, and how to track remediation through completion.

At a high level, SecureScan provides:

- secret scanning for Git repositories and uploaded ZIP archives
- Git blame–based attribution for file-line ownership
- vulnerability persistence and lifecycle tracking
- role-based dashboards for solo developers, organization owners, and employees
- patch preview/apply/commit/verify workflows
- Asana remediation task creation
- email notifications for invites and task assignment
- Electron-managed local session persistence

The core workflow supported by the system is:

1. scan repository or archive
2. detect secrets
3. enrich with file, line, branch, author, email, and commit metadata
4. persist vulnerabilities and repo telemetry
5. review findings in dashboards and reports
6. optionally patch and verify
7. create remediation tasks in Asana
8. notify responsible developers by email
9. track completion and fixed status over time

## 2. How The Project Is Built

SecureScan uses a hybrid desktop-plus-local-server architecture:

- Electron provides the desktop shell, window lifecycle, and secure local persistence bridge.
- React + Vite power the renderer UI.
- Express provides a local backend API for scanning, auth, organizations, vulnerabilities, remediation, and tasks.
- MongoDB stores users, organizations, repositories, vulnerabilities, and remediation tasks.
- TruffleHog is invoked from the backend for secret scanning.
- Git CLI is used for repository cloning, blame enrichment, diff, commit, and verification workflows.
- Asana and email are integrated from the backend so the renderer is never the source of truth for external actions.

### Why this architecture makes sense

This architecture fits the product well because:

- scanning and patching need file-system and Git access, which are safer and simpler in the backend layer
- Electron can persist session state locally without exposing sensitive backend control logic to the renderer
- React can remain focused on workflow presentation and user interaction
- MongoDB gives a straightforward way to persist vulnerability lifecycle, task history, and organization/team visibility
- third-party integrations like Asana and email are safer when executed from the backend with env-based credentials

## 3. Full System Architecture

### Main application layers

| Layer | Responsibility | Main files |
| --- | --- | --- |
| Electron main | window boot, persisted token/session bridge, PDF save flow | [electronjs/main.js](../electronjs/main.js), [electronjs/preload.js](../electronjs/preload.js) |
| Renderer UI | landing page, auth pages, dashboards, scans, reports, vulnerabilities, team management, tasks | [client/src/App.tsx](../client/src/App.tsx), `client/src/pages/**` |
| Auth/session context | hydrates Electron/local session, refreshes backend identity, supports legacy and modern auth flows | [client/src/context/Auth.tsx](../client/src/context/Auth.tsx) |
| Express backend | scanning, auth, organizations, tasks, remediation endpoints | [back/server.js](../back/server.js), `back/routes/**`, `back/controllers/**` |
| Persistence layer | MongoDB models for app state | `back/models/**` |
| Integrations | Asana, invite email, task email, Git blame | [back/services/asana.js](../back/services/asana.js), [back/services/inviteEmail.js](../back/services/inviteEmail.js), [back/services/taskEmail.js](../back/services/taskEmail.js), [back/utils/gitBlame.js](../back/utils/gitBlame.js) |
| Patch/remediation engine | in-memory remediation sessions, patch previews, Git commit/verify helpers | [back/services/remediation.js](../back/services/remediation.js), `back/services/patchers/**` |

### Major folders

- `back/`
  - `server.js`: backend entry point, scan endpoints, patch endpoints, Mongo connection, route mounting
  - `controllers/`: modular controllers for auth, organizations, tasks
  - `controller/user.js`: legacy company/user endpoints still used by older UI
  - `routes/`: Express route modules
  - `models/`: Mongoose schemas
  - `services/`: auth, Asana, invite email, task email, remediation, patchers, vulnerability persistence
  - `utils/`: Git blame and mail helpers
- `client/`
  - `src/App.tsx`: top-level route mapping
  - `src/context/Auth.tsx`: session/auth provider
  - `src/pages/auth/`: login/register/invite accept
  - `src/pages/Dashboard/`: main dashboard shell and pages
  - `src/pages/Home.tsx`: marketing landing page
- `electronjs/`
  - `main.js`: BrowserWindow boot and IPC handlers
  - `preload.js`: safe renderer bridge

### Responsibility separation

- Renderer decides what to render and when to call APIs.
- Electron persists session/token state and file-save actions.
- Backend validates auth, performs scans, applies remediation, stores vulnerabilities and tasks, and calls Asana/email.
- MongoDB stores authoritative state for users, organizations, repositories, vulnerabilities, and tasks.

## 4. Authentication And Role System

### Supported roles

The current code supports:

- `SOLO_DEVELOPER`
- `ORG_OWNER`
- `EMPLOYEE`
- legacy/older values also still appear in the data model such as `developer` and `userType`

Reference:

- [back/models/user.js](../back/models/user.js)
- [back/services/authentication.js](../back/services/authentication.js)
- [back/middleware/auth.js](../back/middleware/auth.js)

### Modern auth flow

Modern auth lives under `/api/auth`:

- register: [back/controllers/auth.js](../back/controllers/auth.js)
- login: [back/controllers/auth.js](../back/controllers/auth.js)
- current user: `/api/auth/me`
- invite accept: `/api/auth/invite/:token` and `/api/auth/invite/accept`
- password update: `/api/auth/set-password`

Passwords are hashed with bcrypt in the modern auth controller. JWTs are created with `createTokenForUser()` from [back/services/authentication.js](../back/services/authentication.js).

### Legacy auth flow

The codebase still contains older endpoints and page flows under `/api`:

- company login/auth
- staff login
- employee creation
- employee logs
- repo telemetry sync

These live in:

- [back/routes/user.js](../back/routes/user.js)
- [back/controller/user.js](../back/controller/user.js)

The frontend auth context intentionally supports both the new role-based system and the older company session model.

### JWT validation and access control

Backend auth middleware:

- `authMiddleware`: verifies bearer token and loads user
- `requireRole(...roles)`: role guard
- `requireOrganizationOwner`: owner-only guard
- `requireOrganizationMember`: validates org membership from user/org relation

Reference:

- [back/middleware/auth.js](../back/middleware/auth.js)

### Electron-managed session persistence

Electron stores:

- `companyToken`
- `authSession`
- `githubToken`

via IPC in:

- [electronjs/main.js](../electronjs/main.js)
- [electronjs/preload.js](../electronjs/preload.js)

The renderer uses these through `window.electronAPI` and the auth context in [client/src/context/Auth.tsx](../client/src/context/Auth.tsx).

### Role-based UI rendering

- `DashboardHome` routes owners/employees to org overview and others to developer dashboard.
- Sidebar links are filtered based on role.
- Organization-only pages are locked in the frontend and backend.

Reference:

- [client/src/pages/Dashboard/pages/DashboardHome.tsx](../client/src/pages/Dashboard/pages/DashboardHome.tsx)
- [client/src/pages/Dashboard/components/Sidebar.tsx](../client/src/pages/Dashboard/components/Sidebar.tsx)

## 5. How Repository Scanning Works

### Entry points

Primary scan endpoints are implemented directly in [back/server.js](../back/server.js):

- `POST /scan-url`
- `POST /scan-zip`
- `POST /scan-url-remediation`
- `POST /scan-zip-remediation`

### Remote repository scan flow

1. Renderer sends repo URL.
2. Backend clones the repository into `back/temp`.
3. Backend runs TruffleHog using `execFile("trufflehog", ["--json", "file://..."])`.
4. Raw JSON lines are parsed.
5. Ignore rules and false-positive filters are applied.
6. Findings are enriched and grouped.
7. Vulnerabilities are persisted if an authenticated actor is present.
8. Response is returned to the UI.

### Local/archive scan flow

1. Renderer uploads a ZIP file.
2. Backend stores it under `uploads/`.
3. ZIP is extracted into `temp/`.
4. TruffleHog scans the extracted directory.
5. Ignore and false-positive filters run.
6. Results are formatted and optionally persisted.

### Remediation-enabled scan flow

The remediation routes follow the same scan logic, but instead of deleting the workspace immediately, they create a remediation session:

- `createSession()` from [back/services/remediation.js](../back/services/remediation.js)
- session includes `repoPath`, `sourceType`, `repoUrl`, `branch`, `results`, and persistence context

This powers preview/apply/diff/commit/verify/rollback without rescanning from scratch in the renderer.

## 6. How API Keys / Secrets Are Found

### Core detector engine

SecureScan uses TruffleHog as the primary scanning engine:

- [back/server.js](../back/server.js) `runTrufflehog()`

It executes:

```bash
trufflehog --json file://<scanPath>
```

### Raw result parsing

The backend parses TruffleHog JSON lines with `safeParseJson()`. It then extracts:

- file path
- line number
- detector/type
- raw secret value or first strings-found entry
- commit metadata if present in TruffleHog output
- Git/filesystem metadata if present

Key helpers:

- `getFindingFileKey()`
- `getFindingLine()`
- `collectSecretNeedles()`
- `pickPrimarySecret()`

All are in [back/server.js](../back/server.js).

### Secret types

Secret types are derived from TruffleHog detector metadata:

- `DetectorName`
- `DetectorType`
- `Reason`
- `Rule`

If none exist, type falls back to `"Secret"`.

### Severity and confidence

Two layers affect severity:

1. AI analysis
2. backend heuristics

AI enrichment uses `analyzeCandidateWithAi()` and `enrichFindingsWithAi()` in [back/server.js](../back/server.js). The backend posts candidate secrets to:

- `SECURE_SCAN_AI_URL` or default `https://secure-scan-ai-risk.onrender.com/analyze`

The UI receives:

- `aiAnalysis`
- `aiSource`
- `aiCandidate`

For persisted vulnerabilities, severity is derived in [back/services/vulnerabilityPersistence.js](../back/services/vulnerabilityPersistence.js):

- confidence >= `0.85` => `HIGH`
- detector keywords like AWS/GitHub/private key/token/secret => `HIGH`
- confidence >= `0.6` => `MEDIUM`
- otherwise `LOW`

### Ignore rules

SecureScan actively ignores known noise sources:

- lock files
- `node_modules`
- `dist`
- `build`
- `.git`
- `.env.example`
- `README.md`
- generated Vite timestamp files such as `vite.config.*.timestamp-*.mjs`

Implemented in:

- `ignorePatterns`
- `shouldIgnoreGeneratedFile()`

in [back/server.js](../back/server.js).

### False-positive reduction

Entropy-only findings are filtered more aggressively with context checks:

- test/fixture path detection
- route/sample-like strings
- API schema path logic
- ObjectId-like hex strings in tests or schema contexts

Implemented in:

- `shouldDropHighEntropyFalsePositive()`
- `filterEntropyFalsePositives()`

in [back/server.js](../back/server.js).

### Data captured when a secret is found

After formatting, each finding can contain:

- `secret`
- `type`
- `line`
- `commit`
- `branch`
- `author`
- `authorEmail`
- `email`
- `commitTime`
- `commitHash`
- `assignedTo`
- `snippet`
- `aiAnalysis`
- `aiSource`
- `aiCandidate`

The response shape returned to the UI is:

```json
{
  "summary": {
    "secretsFound": 2,
    "filesWithSecrets": 1
  },
  "vulnerabilities": {
    "src/config.ts": [
      {
        "secret": "AIza...",
        "type": "High Entropy",
        "line": 13,
        "commit": "N/A",
        "branch": "main",
        "author": "Kiran Rathod",
        "authorEmail": "kiran@example.com"
      }
    ]
  }
}
```

## 7. How Developer Attribution Works

Developer attribution is implemented through Git blame in:

- [back/utils/gitBlame.js](../back/utils/gitBlame.js)

### Git command used

The helper runs:

```bash
git blame -L <line>,<line> --porcelain -- <file>
```

using `spawn()`.

### What is extracted

The parser reads:

- `author`
- `author-mail`
- `author-time`
- commit hash from the porcelain header

The helper returns:

```json
{
  "author": "Name",
  "authorEmail": "name@example.com",
  "email": "name@example.com",
  "commitTime": "2026-04-18T10:30:00.000Z",
  "commitHash": "abcdef1234",
  "assignedTo": "Name"
}
```

### Failure handling

If blame fails, SecureScan does not crash. It returns `emptyBlameInfo()`:

- `author: null`
- `authorEmail: null`
- `commitTime: null`
- `commitHash: null`
- `assignedTo: null`

### How findings are mapped

During `formatResults()`, each row is blame-enriched if:

- it is a Git repo scan
- repo path exists
- file path is known
- line number is valid

The blame results are cached per `file:line`.

### Where attribution is shown

It is displayed in:

- scan results
- report details
- organization vulnerability cards
- employee repo detail views
- task creation prefill
- task emails

## 8. Vulnerability Model And Lifecycle

The canonical vulnerability schema is in:

- [back/models/vulnerability.js](../back/models/vulnerability.js)

### Important fields

| Field | Purpose |
| --- | --- |
| `repoName`, `repoUrl`, `branch` | repository context |
| `file`, `line` | location of the issue |
| `secret`, `maskedSecret` | stored raw and masked values |
| `secretType`, `severity` | classification |
| `author`, `authorEmail`, `commitTime`, `commitHash` | Git attribution |
| `snippet` | saved code context if available |
| `assignedTo` | email-based ownership hint |
| `status` | `OPEN`, `FIXED`, `IGNORED` |
| `fixedBy`, `fixedByEmail`, `fixedAt` | patch ownership and fix time |
| `createdBy` | actor who scanned the repo |
| `organizationId` | org context if any |
| `scannedAt`, `lastSeenAt` | scan lifecycle timing |
| `fingerprint` | unique identity for reconciliation |
| `scanSource` | scan origin |

### How records are created and updated

Persistence is handled in:

- [back/services/vulnerabilityPersistence.js](../back/services/vulnerabilityPersistence.js)

For each formatted finding:

1. line and dates are normalized
2. repo name is inferred from repo URL or path
3. fingerprint is generated from:
   - actor id
   - organization id
   - repo URL
   - branch
   - file
   - line
   - secret type
   - secret
4. vulnerability is upserted by fingerprint
5. latest scan metadata and severity are written
6. stale open findings for the same actor/repo/branch not seen in the current scan are marked `FIXED`

### OPEN/FIXED lifecycle

- If a finding is present in the current scan, it is stored as `OPEN`.
- If a previously open finding is not found in a later scan for the same actor/repo/branch scope, it becomes `FIXED`.

### Fixed-by tracking

When stale findings are marked fixed, SecureScan writes:

- `fixedBy`
- `fixedByEmail`
- `fixedAt`

using the authenticated scan actor as the fix recorder.

### Important implementation note

The current automatic lifecycle supports `OPEN` and `FIXED`. `IGNORED` exists in the schema and UI filters, but there is no dedicated ignore mutation route in the current implementation.

## 9. Repository Telemetry And Report Storage

Repository telemetry is stored separately from vulnerability records in:

- [back/models/repo.js](../back/models/repo.js)
- [back/controller/user.js](../back/controller/user.js) `numberkeysSafe`

### Stored repo telemetry

Repo records include:

- `userId`
- `gitUrl`
- `repoName`
- `organizationId`
- `ownerUserId`
- `defaultBranch`
- `Branch`
- `LastScanned`
- `Status`
- `VerifiedRepositories`
- `UnverifiedRepositories`
- `TotalSecrets`

### Duplicate handling

A compound unique index exists on:

- `userId + gitUrl`

This means the same repo URL can be stored separately per developer, while avoiding duplicates for the same user.

### Report data source

The report page primarily reads:

- `/api/auth/vulnerabilities`

and falls back to older in-memory/legacy repo structures when necessary.

This allows users to reopen stored findings later without scanning again, as long as vulnerability records exist in MongoDB.

## 10. How Patching / Remediation Works

Patching is implemented as a remediation workspace flow, not as direct blind file replacement in production repos.

### Remediation session lifecycle

Session logic lives in:

- [back/services/remediation.js](../back/services/remediation.js)

Each session stores:

- session id
- workspace path
- source type (`git` or `zip`)
- repo URL
- branch
- current results
- persistence context
- latest changed files
- last commit branch/SHA

Sessions live in-memory and expire after 1 hour.

### Patch stages

The UI exposes the following stages from [client/src/pages/Dashboard/pages/Scans.tsx](../client/src/pages/Dashboard/pages/Scans.tsx):

1. preview
2. apply
3. diff
4. commit
5. verify
6. rollback

### Patch preview generation

Patch previews are built per finding with language-aware patchers:

- TypeScript
- JavaScript
- Python
- Java
- Go
- PHP
- C#

Patcher selection lives in:

- [back/services/patchers/index.js](../back/services/patchers/index.js)

If no patcher can safely handle a file, preview returns a non-ready state instead of applying unsafe changes.

### What patching actually does

The remediation engine:

- locates the source line containing the secret
- infers an environment variable name
- rewrites the literal secret reference to env-based access
- for `.env` files, can strip tracked value content
- preserves a preview of old vs new line before application

### Verification

After apply or push, SecureScan can rescan:

- the same workspace
- or a fresh remote clone after push

Routes:

- `POST /patch/preview`
- `POST /patch/apply`
- `POST /patch/diff`
- `POST /patch/commit`
- `POST /patch/verify`
- `POST /patch/rollback`

All are defined in [back/server.js](../back/server.js).

### How fixed status updates

Verification scan results flow back through `buildScanResponse()` and then `persistFormattedScan()`, which triggers vulnerability reconciliation. If the secret is no longer present, the old finding becomes `FIXED`.

### What users see

Users can see:

- patch previews
- Git diff
- changed files
- verification results
- patched-by metadata in vulnerability/report pages

## 11. How Task Creation Works

Task creation is implemented as a modular remediation task system.

### UI trigger points

Current task creation appears in:

- organization vulnerabilities page
- scan results page

through:

- [client/src/pages/Dashboard/components/AssignTaskModal.tsx](../client/src/pages/Dashboard/components/AssignTaskModal.tsx)
- [client/src/pages/Dashboard/pages/OrganizationVulnerabilities.tsx](../client/src/pages/Dashboard/pages/OrganizationVulnerabilities.tsx)
- [client/src/pages/Dashboard/pages/Scans.tsx](../client/src/pages/Dashboard/pages/Scans.tsx)

### Roles allowed

Backend route allows:

- `ORG_OWNER`
- `SOLO_DEVELOPER`

Employees can view relevant tasks but cannot create them in the current implementation.

### Prefilled task context

The modal pre-fills:

- title
- assignee email
- due date
- repo
- branch
- file
- line
- secret type
- severity
- remediation recommendation

### On submit

The frontend posts to:

```http
POST /api/tasks/create
```

with fields such as:

```json
{
  "vulnerabilityId": "...",
  "title": "[SecureScan] Remediate exposed High Entropy in repo-name",
  "assignedToEmail": "dev@example.com",
  "dueDate": "2026-04-20",
  "note": "Optional admin note",
  "remediationRecommendation": "Rotate the exposed secret...",
  "sendEmail": true,
  "createInAsana": true
}
```

### Backend behavior

`createTask()` in [back/controllers/tasks.js](../back/controllers/tasks.js):

1. validates vulnerability existence and caller access
2. builds title/recommendation defaults if not provided
3. resolves assignee by email and organization context
4. builds a rich text description for Asana
5. optionally creates the Asana task
6. stores the remediation task in MongoDB
7. optionally sends assignment email
8. returns task + Asana + email status + warnings

### Task storage

Stored in:

- [back/models/remediationTask.js](../back/models/remediationTask.js)

### All Tasks page

The task listing page is:

- [client/src/pages/Dashboard/pages/AllTasks.tsx](../client/src/pages/Dashboard/pages/AllTasks.tsx)

It supports:

- search
- repo filter
- branch filter
- assignee filter
- status filter
- severity filter
- detail modal
- task status updates

## 12. Asana Integration In Detail

Asana integration lives in:

- [back/services/asana.js](../back/services/asana.js)

### Endpoint used

Task creation uses:

```http
POST https://app.asana.com/api/1.0/tasks?opt_fields=gid,permalink_url,name
```

### Payload shape

The request body is:

```json
{
  "data": {
    "name": "task title",
    "notes": "rich remediation description",
    "workspace": "<workspace gid>",
    "due_on": "YYYY-MM-DD",
    "projects": ["<project gid>"],
    "assignee": "<asana user gid>"
  }
}
```

`projects` and `assignee` are only included when they can be resolved safely.

### How title and notes are built

Title defaults to:

- `[SecureScan] Remediate exposed <secretType> in <repo>`

Notes come from `buildTaskDescription()` in [back/controllers/tasks.js](../back/controllers/tasks.js) and include:

- organization
- secret type
- repository and repo URL
- branch
- file
- line
- found by
- author email
- commit hash/time
- vulnerability status
- assigned by name/email
- assignee email
- severity
- vulnerability id
- remediation recommendation
- optional admin note

### Due date

Default due date comes from:

- `REMEDIATION_TASK_DUE_DAYS`

via `computeDefaultTaskDueDate()`.

### Workspace/project resolution

Asana configuration expects:

- `ASANA_ACCESS_TOKEN`
- `ASANA_WORKSPACE_GID`
- `ASANA_PROJECT_GID`

The service validates and falls back intelligently:

1. try configured workspace
2. try configured project and derive its workspace
3. fall back to first accessible current-user workspace

This is important because the code explicitly handles stale/invalid configured IDs.

### Assignee matching

The service attempts to resolve assignee by email against:

- `GET /workspaces/{workspaceGid}/users`
- then `/users/me` as a fallback

Direct Asana assignment only works if the email is actually assignable within the resolved workspace context.

### Why assignment can fail even if task creation succeeds

This is an expected partial-success case in the current implementation:

- Asana task can be created successfully
- but assignment can still fail if the target email is not an assignable member in the resolved workspace/project

When that happens:

- task is still created
- assignment message explains the mismatch
- DB task still saves successfully
- frontend surfaces warning/toast text instead of crashing

### What is stored locally

Each remediation task stores:

- Asana task GID
- Asana task URL
- `asanaSyncStatus` (`PENDING`, `SYNCED`, `FAILED`, `SKIPPED`)
- `asanaAssignmentResolved`
- `asanaAssignmentMessage`

### What the frontend shows

UI exposes:

- task created / assigned success
- created but not assignable warning
- skipped or failed sync state
- direct Asana link when available

## 13. Email Notification System

There are two major mail flows:

1. organization invite emails
2. remediation task assignment emails

### Invite emails

Implemented in:

- [back/services/inviteEmail.js](../back/services/inviteEmail.js)

This service uses SMTP-style transport options:

- `SMTP_SERVICE`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

It also supports Gmail auto-host fallback if the SMTP user is a Gmail address.

### Task assignment emails

Implemented in:

- [back/services/taskEmail.js](../back/services/taskEmail.js)

The task mailer:

- prefers SMTP first
- falls back to Gmail OAuth2 if configured
- builds rich text + HTML email markup

### Details sent in task emails

Task emails can include:

- title
- organization/responsibility line
- admin contact email
- repo
- repo URL
- branch
- file
- line
- issue type
- severity
- current vulnerability status
- author trace
- commit hash
- commit time
- due date
- Asana assignment state
- Asana sync status
- workspace/project context
- admin note
- remediation recommendation
- next-step checklist
- Asana task link
- internal reference id

### Failure handling

Task email errors return:

- `delivered: false`
- friendly message
- suggestion for common credential/network failures

Invite emails do similar controlled fallback instead of crashing organization flows.

## 14. Organization And Team Management

### Organization creation

Owners can self-register and get an org created automatically, or create an org later through:

- `POST /api/organizations/create`

Implementation:

- [back/controllers/organizations.js](../back/controllers/organizations.js)
- [back/controllers/auth.js](../back/controllers/auth.js)

### Invite flow

Owners invite employees through:

- `POST /api/organizations/:id/invite`

This:

1. verifies org ownership
2. avoids duplicate pending invites
3. rejects already-existing members
4. generates invite token
5. stores invite in org document
6. sends invite email
7. returns invite link and delivery state

### Accept invite flow

Employee invite acceptance is handled by:

- `GET /api/auth/invite/:token`
- `POST /api/auth/invite/accept`

The controller:

- validates pending token
- creates or updates employee user
- sets hashed password
- assigns `EMPLOYEE` role
- attaches org id
- updates invite to `ACCEPTED`
- adds employee to organization members

### Active vs invited members

Organization member views merge:

- actual user members from DB
- pending invites from the org document

Pending invites are not duplicated if a matching active/accepted user already exists.

### Member removal

Owner can remove:

- pending invite rows
- active employees

For active employee deletion, the controller also deletes:

- related repo records
- related vulnerability records
- the user document itself

Owner account is protected from deletion in this screen.

### Employee repo visibility

Owners can inspect:

- member repositories
- repository details
- vulnerabilities per member repo

via:

- `/api/organizations/:id/members/:memberId/repos`
- `/api/organizations/:id/members/:memberId/repos/:repoId/details`

Employees themselves see their relevant data through `/api/auth/vulnerabilities` and personal report/task flows.

## 15. All Implemented Frontend Pages

### Home

- file: [client/src/pages/Home.tsx](../client/src/pages/Home.tsx)
- purpose: marketing/landing page
- includes hero, feature highlights, integrations, workflow explanation, and dashboard CTA

### Login

- file: [client/src/pages/auth/LoginPage.tsx](../client/src/pages/auth/LoginPage.tsx)
- purpose: role-based login for solo developer, organization owner, employee
- API: `POST /api/auth/login`

### Register

- file: [client/src/pages/auth/RegisterPage.tsx](../client/src/pages/auth/RegisterPage.tsx)
- purpose: self-register solo developer or org owner
- API: `POST /api/auth/register`

### Invite Accept

- file: [client/src/pages/auth/InviteAcceptPage.tsx](../client/src/pages/auth/InviteAcceptPage.tsx)
- purpose: activate invited employee account
- APIs:
  - `GET /api/auth/invite/:token`
  - `POST /api/auth/invite/accept`

### Dashboard Home

- file: [client/src/pages/Dashboard/pages/DashboardHome.tsx](../client/src/pages/Dashboard/pages/DashboardHome.tsx)
- purpose: routes user to developer dashboard or organization overview

### Developer Dashboard

- file: [client/src/pages/Dashboard/pages/Analysis.tsx](../client/src/pages/Dashboard/pages/Analysis.tsx)
- purpose: developer/legacy company metrics, repo summaries, activity visualization

### Scans

- file: [client/src/pages/Dashboard/pages/Scans.tsx](../client/src/pages/Dashboard/pages/Scans.tsx)
- purpose:
  - scan repo URL or ZIP
  - show findings
  - export PDF
  - preview/apply/commit/verify patches
  - create tasks from findings

### Reports

- file: [client/src/pages/Dashboard/pages/Report.tsx](../client/src/pages/Dashboard/pages/Report.tsx)
- purpose: stored findings review and repo analysis without rescanning
- API: `/api/auth/vulnerabilities`

### Organization Overview

- file: [client/src/pages/Dashboard/pages/OrganizationOverview.tsx](../client/src/pages/Dashboard/pages/OrganizationOverview.tsx)
- purpose: org summary cards, owner snapshot, team activity

### Team Management

- file: [client/src/pages/Dashboard/pages/OrganizationTeam.tsx](../client/src/pages/Dashboard/pages/OrganizationTeam.tsx)
- purpose: invite employees, remove members, inspect member repos and vulnerabilities

### Organization Vulnerabilities

- file: [client/src/pages/Dashboard/pages/OrganizationVulnerabilities.tsx](../client/src/pages/Dashboard/pages/OrganizationVulnerabilities.tsx)
- purpose: filterable vulnerability review with Assign Task button

### All Tasks

- file: [client/src/pages/Dashboard/pages/AllTasks.tsx](../client/src/pages/Dashboard/pages/AllTasks.tsx)
- purpose: remediation task list, filter/search, detail panel, status update

### Settings

- file: [client/src/pages/Dashboard/pages/Setting.tsx](../client/src/pages/Dashboard/pages/Setting.tsx)
- purpose: presentation-oriented account/session/settings summary

### Legacy pages still present

Older company flow pages still exist and are part of the codebase:

- `DashBord.tsx`
- `components/Analysis.tsx`
- `components/Profile.tsx`
- `components/Seeting.tsx`
- `pages/Dashboard/pages/MangeEmploy.tsx`
- `pages/Dashboard/pages/EmployedLogs.tsx`

These coexist with the newer role-based dashboard architecture.

## 16. Important Backend Routes

### Modern auth routes

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | self-register solo developer or org owner |
| POST | `/api/auth/login` | login for all modern roles |
| POST | `/api/auth/logout` | stateless logout response |
| GET | `/api/auth/me` | fetch current user/session payload |
| GET | `/api/auth/invite/:token` | inspect invite |
| POST | `/api/auth/invite/accept` | accept employee invite |
| POST | `/api/auth/set-password` | change password |
| GET | `/api/auth/vulnerabilities` | current user visible vulnerabilities |
| GET | `/api/auth/vulnerabilities/summary` | current user vulnerability summary |

### Organization routes

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/organizations/create` | create organization |
| GET | `/api/organizations/:id` | org detail and summary |
| GET | `/api/organizations/:id/members` | list members and pending invites |
| GET | `/api/organizations/:id/members/:memberId/repos` | owner view of member repos |
| GET | `/api/organizations/:id/members/:memberId/repos/:repoId/details` | owner view of member repo vulnerabilities |
| POST | `/api/organizations/:id/invite` | invite employee |
| GET | `/api/organizations/:id/invites` | list invite records |
| DELETE | `/api/organizations/:id/members/:memberId` | remove pending invite or employee |
| GET | `/api/organizations/:id/vulnerabilities` | list org vulnerabilities |
| GET | `/api/organizations/:id/vulnerabilities/summary` | org vulnerability summary |
| GET | `/api/organizations/:id/repos` | aggregate repo list from vulnerabilities |
| GET | `/api/organizations/:id/branches` | aggregate branches |
| GET | `/api/organizations/:id/developers` | aggregate developer/author list |

### Task routes

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/tasks/create` | create remediation task |
| GET | `/api/tasks` | list tasks with filters |
| GET | `/api/tasks/:id` | fetch task detail |
| PATCH | `/api/tasks/:id/status` | update task status |

### Scan and remediation routes

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/scan-url` | scan remote git repo |
| POST | `/scan-zip` | scan uploaded zip |
| POST | `/scan-url-remediation` | scan remote repo and keep remediation session |
| POST | `/scan-zip-remediation` | scan zip and keep remediation session |
| POST | `/patch/preview` | preview patches |
| POST | `/patch/apply` | apply patches |
| POST | `/patch/diff` | Git diff |
| POST | `/patch/commit` | commit and optional push/verify |
| POST | `/patch/verify` | post-push verification scan |
| POST | `/patch/rollback` | rollback workspace state |

### Legacy routes still used by older UI

Examples:

- `/api/createAcount`
- `/api/auths`
- `/api/createEmpy`
- `/api/getmyemp`
- `/api/loginStaff`
- `/api/getlogEmploy`
- `/api/authsss`
- `/api/orgLoginData`
- `/api/numberkeys`

Defined in [back/routes/user.js](../back/routes/user.js).

## 17. Database Models

### User

- file: [back/models/user.js](../back/models/user.js)
- purpose: stores modern users plus some legacy compatibility fields
- relationships:
  - `organizationId` -> Organization
  - `companyId` -> legacy company model

### Organization

- file: [back/models/organization.js](../back/models/organization.js)
- purpose: owner, members, pending/accepted invites
- relationships:
  - `owner` -> User
  - `members[]` -> User

### Vulnerability

- file: [back/models/vulnerability.js](../back/models/vulnerability.js)
- purpose: canonical persisted scan finding with lifecycle state
- relationships:
  - `createdBy` -> User
  - `organizationId` -> Organization
  - `fixedBy` -> User

### Repository

- file: [back/models/repo.js](../back/models/repo.js)
- purpose: per-user repo telemetry and report summary data
- relationships:
  - `userId` -> User
  - `organizationId` -> Organization
  - `ownerUserId` -> User

### RemediationTask

- file: [back/models/remediationTask.js](../back/models/remediationTask.js)
- purpose: stores remediation assignment, Asana state, due date, assignee, status, and email result
- relationships:
  - `vulnerabilityId` -> Vulnerability
  - `organizationId` -> Organization
  - `assignedToUserId` -> User
  - `assignedByUserId` -> User

### Legacy company model

- file: [back/models/company.js](../back/models/company.js)
- purpose: older company/session flow used by legacy endpoints and pages

## 18. Environment Variables

### Variables actually used in code

| Variable | Used in | Purpose |
| --- | --- | --- |
| `JWT_SECRET` | `back/services/authentication.js` | JWT signing secret |
| `JWT_EXPIRES_IN` | `back/services/authentication.js` | JWT expiration |
| `LEAKSHIELD_INVITE_BASE_URL` | `back/controllers/auth.js` | invite link base URL |
| `SECURE_SCAN_AI_URL` | `back/server.js` | AI analyzer endpoint |
| `ASANA_ACCESS_TOKEN` | `back/services/asana.js` | Asana auth token |
| `ASANA_WORKSPACE_GID` | `back/services/asana.js` | preferred Asana workspace |
| `ASANA_PROJECT_GID` | `back/services/asana.js` | preferred Asana project |
| `REMEDIATION_TASK_DUE_DAYS` | `back/services/asana.js` | default due date offset |
| `GOOGLE_OAUTH_USER` | `back/services/taskEmail.js` | Gmail OAuth sender |
| `GOOGLE_OAUTH_CLIENT_ID` | `back/services/taskEmail.js` | Gmail OAuth |
| `GOOGLE_OAUTH_CLIENT_SECRET` | `back/services/taskEmail.js` | Gmail OAuth |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | `back/services/taskEmail.js` | Gmail OAuth |
| `GOOGLE_OAUTH_ACCESS_TOKEN` | `back/services/taskEmail.js` | optional Gmail OAuth access token |
| `SMTP_SERVICE` | invite/task mail services | SMTP provider shortcut |
| `SMTP_HOST` | invite/task mail services | SMTP host |
| `SMTP_PORT` | invite/task mail services | SMTP port |
| `SMTP_SECURE` | invite/task mail services | SMTP TLS mode |
| `SMTP_USER` | invite/task mail services | SMTP username |
| `SMTP_PASS` | invite/task mail services | SMTP password / app password |
| `SMTP_FROM` | invite/task mail services | sender override |

### Important implementation note

MongoDB connection is currently hardcoded in [back/server.js](../back/server.js) rather than sourced from an env var. This is part of the current implementation and should be considered a limitation/security cleanup item.

## 19. End-To-End Data Flow Examples

### Example: owner scans a repo and creates a task

1. Owner logs in through `/api/auth/login`.
2. Renderer stores session through Electron.
3. Owner opens Scans and submits a repo URL.
4. Backend clones the repo and runs TruffleHog.
5. Backend filters ignored/generated files and entropy false positives.
6. Backend enriches findings with AI and Git blame metadata.
7. Backend persists vulnerabilities in MongoDB.
8. Repo telemetry is synced through `/api/numberkeys`.
9. Owner reviews vulnerability cards.
10. Owner clicks Assign Task.
11. Modal pre-fills title, file, line, severity, assignee email, and recommendation.
12. Backend creates a local remediation task.
13. Backend attempts Asana sync.
14. Backend attempts task assignment email.
15. Task appears in All Tasks with sync/email state.

### Example: developer fixes and verification marks issue fixed

1. Scan is run in remediation mode.
2. Backend creates remediation session.
3. User previews patch.
4. User applies patch.
5. Backend rescans workspace.
6. User commits and optionally pushes.
7. Verification route scans a fresh remote clone or workspace fallback.
8. Persisted vulnerability reconciliation no longer sees the old fingerprint.
9. Old `OPEN` vulnerability is marked `FIXED`.
10. `fixedBy`, `fixedByEmail`, and `fixedAt` are stored.
11. Reports and vulnerabilities page reflect fixed state.

## 20. Feature-By-Feature Implementation Summary

### Secret scanning

- detects secrets in repos and archives
- implemented in [back/server.js](../back/server.js)
- uses TruffleHog plus local filtering

### Developer attribution

- enriches findings with Git blame metadata
- implemented in [back/utils/gitBlame.js](../back/utils/gitBlame.js)

### Vulnerability dashboard

- org and personal vulnerability views
- implemented in [client/src/pages/Dashboard/pages/OrganizationVulnerabilities.tsx](../client/src/pages/Dashboard/pages/OrganizationVulnerabilities.tsx) and `/api/auth/vulnerabilities`

### Reports

- opens stored findings without rescanning
- implemented in [client/src/pages/Dashboard/pages/Report.tsx](../client/src/pages/Dashboard/pages/Report.tsx)

### Patching/remediation

- preview/apply/diff/commit/verify/rollback
- implemented in [back/services/remediation.js](../back/services/remediation.js) and `back/services/patchers/**`

### Task creation

- create remediation tasks from vulnerabilities
- implemented in [back/controllers/tasks.js](../back/controllers/tasks.js), [back/models/remediationTask.js](../back/models/remediationTask.js), [client/src/pages/Dashboard/components/AssignTaskModal.tsx](../client/src/pages/Dashboard/components/AssignTaskModal.tsx)

### Asana integration

- external task creation and optional assignee resolution
- implemented in [back/services/asana.js](../back/services/asana.js)

### Email notifications

- org invites and task assignment emails
- implemented in [back/services/inviteEmail.js](../back/services/inviteEmail.js) and [back/services/taskEmail.js](../back/services/taskEmail.js)

### Organization/team management

- invite, accept, list, remove, repo inspection
- implemented in [back/controllers/auth.js](../back/controllers/auth.js), [back/controllers/organizations.js](../back/controllers/organizations.js), [client/src/pages/Dashboard/pages/OrganizationTeam.tsx](../client/src/pages/Dashboard/pages/OrganizationTeam.tsx)

### Role-based auth

- JWT, role guards, org membership checks
- implemented in [back/middleware/auth.js](../back/middleware/auth.js) and [client/src/context/Auth.tsx](../client/src/context/Auth.tsx)

### Electron session persistence

- stores token/session/github token and exposes safe bridge
- implemented in [electronjs/main.js](../electronjs/main.js) and [electronjs/preload.js](../electronjs/preload.js)

### Stored findings review

- persisted vulnerability records can be reviewed later in reports and owner repo detail views
- implemented via Mongo vulnerability storage + report/team pages

## 21. Known Limitations And Current Implementation Notes

- MongoDB connection string is currently hardcoded in `back/server.js` instead of env-managed.
- Modern and legacy auth/company flows coexist, which adds compatibility complexity.
- `IGNORED` exists in vulnerability schema and filters, but no dedicated ignore action is exposed in the current backend.
- Asana direct assignment depends on the assignee email being an assignable member in the resolved workspace/project context.
- Asana workspace/project fallback exists because configured IDs may be stale or invalid.
- Some older stored findings may not contain newer fields such as `snippet`, `commitHash`, or richer patch metadata.
- Patch automation only supports languages covered by the current patcher modules.
- Unsupported files return safe non-ready previews instead of forced rewrites.
- Remediation sessions are stored in memory and expire; they are not persisted across backend restarts.
- ZIP-based scans cannot use Git blame attribution.
- Some older UI pages still use legacy routes and company model behavior.

## 22. Conclusion

SecureScan is implemented as a full workflow platform rather than a simple secret scanner. The codebase combines desktop delivery through Electron, workflow-rich React dashboards, an Express backend for scanning/remediation/integrations, and MongoDB persistence for lifecycle tracking. It detects exposed API keys, enriches them with Git-based authorship, stores them as vulnerabilities, supports patch verification, and turns findings into accountable remediation work through Asana and email.

The project’s strongest implementation characteristic is that it connects detection, attribution, remediation, notification, and tracking into one end-to-end system. Even where some flows are partially fallback-based or still carry legacy compatibility layers, the current code implements a real, reviewer-visible pipeline from leaked secret detection to verified remediation.
