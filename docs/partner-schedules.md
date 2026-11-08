# Official Schedule Integration

## Enable

Set `PARTNER_SCHEDULE_API_KEY` in Vercel server environment variables, then redeploy.
Never use a `NEXT_PUBLIC_` variable for the key. The endpoint is fixed to
`https://thtraining.gt.tc/public/api/v1/schedules.php`.

`GET /api/partner-schedules` returns normalized sessions, never the key or challenge
cookie. Without configuration it returns an empty disabled feed. Successful reads
are cached with Next Data Cache for 300 seconds. Active pages poll every 5 minutes
and on window focus. Cache revalidation can briefly serve the previous snapshot.
No paid cron job or additional Firestore writes are required.

The adapter sends `X-API-Key`. For the observed hosting challenge it computes the
AES cookie server-side and retries once against the same fixed host. It never
executes remote JavaScript, follows redirects, or sends credentials to another host.
If the host changes its challenge, the feed fails with a generic 502 response.

## Behavior

- Homepage/calendar, My Training and staff records merge the feed with Firestore.
- External IDs are namespaced `partner-thtraining-<id>` and deduplicated per feed.
- Local entries take priority when UTC date/time, program and trainee VID match
  within the same training/exam and theory/practical category. Practical training
  matches regardless of Official/Unofficial, position or trainer. Local data is
  retained as-is; only the external copy is hidden from all merged views.
- External sessions are read only, including for webmasters; edit them upstream.
- Dates and times are converted to UTC. Missing positions remain blank.
- `request_type=exam` selects an exam; `session_type=theory` selects theory.
  Practical training uses `training_category`: 1 Official Practical, 2 Unofficial
  Practical, 3 Mock-up Practical Training, 4 Recurrent Training. Missing, null,
  blank or unknown values map to Practical Training (Unspecified). Only category 1
  practical training gets Official status. Exam type takes precedence over category.
  Position uses `atc_position`, falling back to legacy `position` / `apt_icao`.
- Rating is extracted from `topic_or_rating`, falling back to ASx/FSx when absent.
- Explicit cancelled/canceled/deleted entries are hidden. A successful new feed
  replaces the previous feed, so disappeared entries are removed from the display.
- Feed failures preserve the last snapshot in already-open pages. A new page has
  no external data until a successful read. Firestore data is unaffected.
- This is a live feed, not a historical import: if the partner drops completed
  sessions, those sessions also disappear from records. Persistent history needs
  a separate agreed retention/cancellation contract before adding DB sync.
- No Discord messages are sent for feed reads.

## Verify

Run `node --test --test-isolation=none src/lib/partnerSchedules.test.mjs`,
`npm run lint`, and `npm run build`. After deployment, check
`/api/partner-schedules` for `enabled: true` and a recent `fetchedAt`, then compare
the calendar with the partner schedule. Local API access does not prove the host
will accept Vercel traffic.
