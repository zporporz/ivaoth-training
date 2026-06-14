# IVAO Thailand Training Portal

Training schedule and staff-management portal for the IVAO Thailand Division.

- Production: https://ivaoth-training.vercel.app
- Repository: https://github.com/zporporz/ivaoth-training

This README is the developer handoff for the project. Read the Architecture,
Authentication, Firestore, and Deployment sections before changing data access
or permissions.

## What The Portal Does

- Public ATC and pilot training schedule
- Bangkok-date-aware training calendar
- Upcoming and historical session views
- IVAO OAuth login
- Personal trainee dashboard
- Staff console for creating and managing sessions
- Training-document CMS
- Training staff directory
- Webmaster access management
- Discord notifications for new or modified sessions
- In-browser reminders and staff notification bell

## Technology

| Area | Technology |
| --- | --- |
| Framework | Next.js App Router 16 |
| UI | React 19, Tailwind CSS 4 |
| Public/realtime data | Firebase Web SDK and Firestore `onSnapshot` |
| Trusted server writes | `@google-cloud/firestore` |
| Authentication | IVAO OAuth, signed application session cookie |
| Hosting | Vercel |
| Database | Firebase Firestore |

## Quick Start

Requirements:

- Node.js 20 or later
- npm
- Firebase project access
- IVAO OAuth application credentials

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Useful commands:

```bash
npm run lint
npm run build
npm audit
npm run start
```

There is currently no automated test suite. Always run lint and a production
build before opening a pull request. Test permission-sensitive workflows with
both a guest session and a real training-staff session.

## Project Map

```text
src/
  app/
    page.js                         Public schedule and dashboard
    my-training/page.js             Logged-in trainee history
    training-docs/page.js           Public-facing resource library
    training-list/page.js           Training staff directory
    staff/
      page.js                       Protected staff entry point
      staff-content.jsx             Main staff console composition
      manual-training/page.js       Core webmaster manual session entry
      training-docs/page.js         Staff docs CMS
      training-staff/page.js        Core webmaster staff-list CMS
      webmasters/page.js            Core webmaster access management
    api/
      auth/                         IVAO login, callback, and logout
      admin-data/                   Trusted Firestore CRUD routes
      discord/                      Discord webhook proxy
      ivao/                         Staff-only IVAO member lookup
      time/                         Bangkok server-date endpoint
  components/
    staff/                          Staff console form and schedule components
    TrainingCalendar.jsx            Calendar rendering and today-date sync
    TrainingReminder.jsx            Browser reminder logic
    StaffSessionBell.jsx            Staff new/modified-session notifications
    Navbar.jsx                      Navigation and role-dependent links
  hooks/
    useTrainingSessions.js          Staff session state and CRUD orchestration
  lib/
    firebase.js                     Browser Firebase client
    firebaseAdmin.js                Trusted server Firestore client
    serverSession.js                Session signing and verification
    authSession.js                  Browser session-cookie reader/hooks
    serverDataAccess.js             Server authorization and sanitizers
    permissions.js                  Client-side UI permission helpers
    useWebmasterAccess.js           Webmaster access lookup
    adminDataClient.js              Browser wrapper for `/api/admin-data`
    staffSessions.js                Session date/time helpers
  data/
    programs.js                     ATC and pilot training programs
    sessionTypes.js                 Session type definitions
firestore.rules                     Production Firestore security rules
firebase.json                       Firebase CLI rules configuration
```

The files in `src/data/calendarDays.js` and `src/data/upNext.js` are legacy
sample data. The production schedule is loaded from Firestore.

## Application Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Schedule, program cards, calendar, upcoming/history |
| `/my-training` | Logged-in user | Sessions matching the user's trainee VID |
| `/training-docs` | Public page | Active training resources |
| `/training-list` | Public page | Active training staff directory |
| `/staff` | Training staff | Create, edit, claim, and delete sessions |
| `/staff/training-docs` | Training staff | Manage training resources |
| `/staff/manual-training` | Core webmaster | Create a session for another trainer |
| `/staff/training-staff` | Core webmaster | Manage directory entries |
| `/staff/webmasters` | Core webmaster | Manage delegated webmasters |

`ProtectedStaffPage.jsx` protects staff pages in the UI. This is not a security
boundary by itself. Every write API must also verify the signed session on the
server.

## Data Flow

### Reads

The browser uses the Firebase Web SDK from `src/lib/firebase.js`.

- `trainingSessions`, `trainingDocs`, and `trainingStaff` are publicly readable.
- Pages subscribe with `onSnapshot` for realtime updates.
- `webmasters` is not publicly readable; access is checked through server APIs.

### Writes

The browser must never write to Firestore directly.

1. A client page calls `adminDataRequest()`.
2. The request reaches `/api/admin-data/...`.
3. The route verifies the signed IVAO session.
4. The route sanitizes and validates the payload.
5. `firebaseAdmin.js` writes through the service account.
6. Firestore realtime listeners update the UI.

Do not add `addDoc`, `setDoc`, `updateDoc`, or `deleteDoc` to client components.
Direct browser writes are intentionally denied by `firestore.rules`.

The server Firestore client uses `preferRest: true`. This is required because
the default gRPC transport timed out in the Vercel runtime.

## Authentication

### OAuth flow

1. `/api/auth/login` creates an OAuth state cookie and redirects to IVAO SSO.
2. `/api/auth/callback/ivao` verifies state and exchanges the code.
3. The callback reads `/v2/users/me`, identifies training staff positions, and
   builds the application session.
4. `serverSession.js` signs the session with HMAC-SHA256.
5. The signed `ivao_session` cookie is valid for seven days.

The browser can decode the session to render the UI, but it cannot create a
valid signature. Server APIs always call `getRequestSession()` and reject
unsigned, modified, or expired sessions.

Do not put OAuth access tokens, service-account data, webhook URLs, or other
secrets in the session payload. The cookie is browser-readable.

### Training staff detection

`src/app/api/auth/callback/ivao/route.js` sets `hasTrainingAccess` by inspecting
IVAO staff-position data. When IVAO changes its response shape or department
codes, update `getStaffPositionName()` and `isTrainingStaffPosition()` there.

### Webmaster roles

- Core webmaster VID: `739898`
- Client constant: `src/lib/useWebmasterAccess.js`
- Server constant: `src/lib/serverDataAccess.js`
- Delegated webmasters: `webmasters/{vid}` documents

Keep the client and server core VID constants synchronized. Server checks are
authoritative.

## Permission Model

| Action | Required permission |
| --- | --- |
| Open staff console | Training staff |
| Create session | Training staff |
| Claim session with no `trainerVid` | Training staff |
| Edit/delete owned session | Matching trainer VID |
| Edit/delete any session | Core webmaster in the current UI |
| Manage training docs | Training staff |
| Manage training staff directory | Core webmaster |
| Manually create for another trainer | Core webmaster |
| Manage delegated webmasters | Core webmaster |
| Lookup an IVAO member | Training staff |
| Send Discord training notification | Training staff |

Client checks in `permissions.js` control visibility and user experience.
Server checks in `serverDataAccess.js` and API routes enforce security.

The session API recognizes delegated webmasters, but the current session UI
only grants global edit/delete controls to the core webmaster. If delegated
webmasters should manage every session, pass the resolved webmaster state into
the client permission checks and test both layers.

## Firestore Collections

### `trainingSessions`

```js
{
  date: "2026-06-14",          // YYYY-MM-DD
  time: "1330Z",               // strict 24-hour HHMMZ
  program: "ADC",
  type: "Official Practical",
  topic: "Tower procedures",
  remarks: "Preparation notes",
  position: "VTBS_TWR",
  traineeName: "Example Trainee",
  traineeVid: "123456",
  trainerName: "Example Trainer",
  trainerVid: "654321",
  trainerStaffPosition: "TH-Division Trainer",
  status: "Official",          // Scheduled, Official, or Exam
  createdByWebmaster: "739898",// manual entries only
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

Session status is derived from `type` in the server routes. Time validation is
performed in the UI and API. The UI displays `13:30`, while Firestore stores
`1330Z`.

### `trainingDocs`

```js
{
  title: "Resource title",
  description: "Optional description",
  type: "YouTube",             // YouTube, Website, or PDF
  url: "https://...",
  thumbnailUrl: "https://...",
  order: 1,
  active: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `trainingStaff`

```js
{
  order: 1,
  vid: "123456",
  name: "Staff Name",
  position: "TH-DT",
  division: "TH",
  avatarUrl: "/staff/avatars/123456.jpg",
  bio: "Optional biography",
  active: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `webmasters`

Document ID is the member VID.

```js
{
  vid: "123456",
  name: "Webmaster Name",
  note: "Reason for access",
  active: true,
  addedBy: "739898",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## API Reference

### Authentication and utility APIs

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/auth/login` | Public | Begin IVAO OAuth |
| GET | `/api/auth/callback/ivao` | OAuth callback | Create signed session |
| GET | `/api/auth/logout` | Public | Clear session |
| GET | `/api/time/today` | Public | Current Bangkok date |
| GET | `/api/admin-data/health` | Public | Firestore server connectivity |
| GET | `/api/ivao/user/:vid` | Training staff | Resolve an IVAO display name |
| POST | `/api/discord/training-session` | Training staff | Send Discord notification |

IVAO may return only a generic nickname such as `User 727075`. The lookup route
intentionally rejects generic names; staff can type the trainee name manually.

### Trusted data APIs

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/admin-data/sessions` | Training staff; core for `manual: true` |
| PATCH | `/api/admin-data/sessions/:id` | Owner or webmaster |
| DELETE | `/api/admin-data/sessions/:id` | Owner or webmaster |
| POST | `/api/admin-data/docs` | Training staff |
| PATCH | `/api/admin-data/docs/:id` | Training staff |
| DELETE | `/api/admin-data/docs/:id` | Training staff |
| POST | `/api/admin-data/staff` | Core webmaster |
| PATCH | `/api/admin-data/staff/:id` | Core webmaster |
| DELETE | `/api/admin-data/staff/:id` | Core webmaster |
| GET | `/api/admin-data/webmaster-access` | Logged-in user |
| GET | `/api/admin-data/webmasters` | Core webmaster |
| POST | `/api/admin-data/webmasters` | Core webmaster |
| DELETE | `/api/admin-data/webmasters/:vid` | Core webmaster |

`PATCH /api/admin-data/sessions/:id` with `{ "action": "claim" }` claims a
legacy session that has no `trainerVid`.

## Environment Variables

Create `.env.local` for local development. Never commit it.

### IVAO and application session

```env
IVAO_CLIENT_ID=
IVAO_CLIENT_SECRET=
IVAO_REDIRECT_URI=http://localhost:3000/api/auth/callback/ivao
SESSION_SECRET=
```

`SESSION_SECRET` should be a long random value. If omitted, the application
falls back to `IVAO_CLIENT_SECRET`.

Register every callback URL in the IVAO OAuth application:

- `http://localhost:3000/api/auth/callback/ivao`
- `https://ivaoth-training.vercel.app/api/auth/callback/ivao`
- Any Vercel preview URL used for OAuth testing

### Firebase browser SDK

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

These values are public by design. Firestore rules, not API-key secrecy,
protect the database.

### Firestore server credentials

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Alternatively:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Generate the key in Firebase Console -> Project settings -> Service accounts.
Never place the downloaded JSON file in the repository.

### Discord

```env
DISCORD_TRAINING_WEBHOOK_URL=
```

When this variable is missing, the portal still saves sessions but skips the
Discord notification.

## Firestore Rules

The production rules are in `firestore.rules`.

Current policy:

- Public read: `trainingSessions`, `trainingDocs`, `trainingStaff`
- No browser writes
- No browser read/write: `webmasters`
- Deny every unspecified collection

The server service account bypasses Firestore rules and is protected by server
session authorization.

Deploy rules with the Firebase CLI:

```bash
npx firebase-tools login
npx firebase-tools use <firebase-project-id>
npx firebase-tools deploy --only firestore:rules
```

Do not temporarily change the catch-all rule to `allow read, write: if true`.
That allows anyone with the public Firebase configuration to modify the whole
database.

## Calendar And Time Rules

- Session dates use `YYYY-MM-DD`.
- Session times are stored as UTC/Zulu `HHMMZ`.
- The staff input displays `HH:MM` but stores `HHMMZ`.
- The highlighted calendar day uses `Asia/Bangkok`.
- `/api/time/today` is the server source of truth.
- `TrainingCalendar.jsx` resyncs after focus, visibility restore, `pageshow`,
  reconnect, user interaction, and Bangkok midnight.

Do not replace the numeric time field with `<input type="time">`; browsers can
render it with AM/PM depending on the device locale.

## Development Workflows

### Add or change a training program

1. Edit `src/data/programs.js`.
2. Check program-card counts and calendar chip colors.
3. Confirm existing Firestore sessions still map to a valid program code.

### Change session fields

Update all of the following:

1. `src/components/staff/SessionForm.jsx`
2. `src/hooks/useTrainingSessions.js`
3. `src/app/api/admin-data/sessions/route.js`
4. `src/app/api/admin-data/sessions/[id]/route.js`
5. Display components such as `SessionDetailModal.jsx`
6. This README's Firestore schema

### Change permissions

Review both layers:

1. Client UX: `src/lib/permissions.js`
2. Server enforcement: `src/lib/serverDataAccess.js` and the API route

Never rely only on hiding a button or redirecting a page.

### Add a Firestore collection

1. Define the data owner and read/write policy.
2. Add trusted server API routes for writes.
3. Add the minimum required rule to `firestore.rules`.
4. Add indexes if Firestore reports a query requirement.
5. Document the collection and deploy the rules.

## Deployment

GitHub `main` deploys automatically to Vercel.

Before merging:

```bash
npm run lint
npm run build
npm audit
```

Deployment order for infrastructure changes:

1. Add required environment variables to Vercel Production and Preview.
2. Merge and wait for the Vercel deployment to succeed.
3. Verify `/api/admin-data/health`.
4. Smoke-test an authenticated staff write.
5. Publish stricter Firestore rules last.

This order prevents a period where the browser is blocked from writing before
the trusted server route is operational.

## Smoke-Test Checklist

- Guest can open `/` and view schedule data.
- Guest visiting `/staff` returns to `/`.
- IVAO login and logout work.
- Training staff can create a session.
- Session owner can edit and delete the session.
- Another ordinary trainer cannot edit that session.
- Legacy session claim works only when `trainerVid` is empty.
- Core webmaster pages reject non-core users.
- Realtime UI updates after an API write.
- Calendar highlights the current Bangkok date after tab resume.
- Time input shows `HH:MM` and stores `HHMMZ`.
- Firestore health returns `{ "ok": true }`.
- Direct browser writes remain denied by Firestore rules.

## Troubleshooting

### Staff writes fail

1. Open `/api/admin-data/health`.
2. Check Firebase server environment variables in Vercel.
3. Preserve `preferRest: true` in `firebaseAdmin.js`.
4. Check Vercel function logs for the affected API route.
5. Confirm the signed session is current; old sessions expire after seven days.

### Staff console is missing

- Verify the user has an IVAO training staff position.
- Inspect `isTrainingStaffPosition()` in the OAuth callback.
- Log out and log in again after changing session or role logic.

### Trainee VID does not auto-fill a name

- Confirm `/api/ivao/user/:vid` is called by a training-staff session.
- IVAO may return a generic nickname without a real name.
- Generic names are rejected intentionally; manual name entry remains allowed.
- The current client UI treats all non-success lookup responses similarly.

### Calendar highlights an old date

- Check `/api/time/today`.
- Confirm the browser is running the latest deployment.
- Review lifecycle listeners in `TrainingCalendar.jsx`.
- Avoid caching the time endpoint.

### Realtime reads fail after rules changes

- Confirm public read access still exists for the three public collections.
- Keep `webmasters` private.
- Remember that trusted server writes bypass Firestore rules.

## Security Notes

- Never commit `.env.local`, service-account JSON, or webhook URLs.
- Never trust client-side permission checks.
- Validate and sanitize every server payload.
- Keep Firestore catch-all access denied.
- Do not expose the `webmasters` collection to the browser.
- Do not return service-account or OAuth details from health endpoints.
- Rotate Firebase and IVAO credentials if they are ever exposed.

## Current Limitations

- No automated unit, integration, or end-to-end test suite
- No audit-log collection for administrative changes
- No completed/cancelled/no-show workflow after a session
- IVAO member lookup cannot recover a real name when IVAO only exposes a
  generic nickname
- Some source strings contain legacy encoding artifacts and should be cleaned
  carefully in a dedicated UI-copy change

## Suggested Next Improvements

1. Session completion workflow and trainer feedback
2. Trainee progress dashboard
3. Training request/assignment workflow
4. Calendar `.ics` export
5. Scheduled Discord reminders
6. Administrative audit log
7. Automated API permission and calendar lifecycle tests
