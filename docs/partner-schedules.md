# Official Schedule Integration

## Enable

Set `PARTNER_SCHEDULE_API_KEY` in Vercel server environment variables, then redeploy.
Never use a `NEXT_PUBLIC_` variable for the key. The endpoint is fixed to
`https://thtraining.gt.tc/public/api/v1/schedules.php`.

`GET /api/partner-schedules` syncs normalized sessions into Firestore and returns
`persisted: true`, sync counts and `fetchedAt`, never the key or challenge cookie.
The `sessions` response is empty: clients use the existing Firestore listeners.
Without configuration it returns an empty disabled feed. Successful syncs
are cached with Next Data Cache for 300 seconds. Active pages poll every 5 minutes
and on window focus. Cache revalidation can briefly serve the previous snapshot.
No cron job is required. Sync is triggered by active pages or endpoint requests;
there is no background polling when nobody visits. Only new/changed sessions are
written. Reads cover existing imported IDs, links and dates in the current feed,
not the entire history. Feed size is capped at 200 for an atomic transaction.

The adapter sends `X-API-Key`. For the observed hosting challenge it computes the
AES cookie server-side and retries once against the same fixed host. It never
executes remote JavaScript, follows redirects, or sends credentials to another host.
If the host changes its challenge, the feed fails with a generic 502 response.

## Behavior

- Homepage/calendar, My Training and staff records read saved imported history
  from the existing `trainingSessions` Firestore collection.
- External IDs are namespaced `partner-thtraining-<id>` and deduplicated per feed.
- Local entries take priority when UTC date/time, program and trainee VID match
  within the same training/exam and theory/practical category. Practical training
  matches regardless of Official/Unofficial, position or trainer. Local data is
  retained as-is. `partnerScheduleLinks` stores external-to-local links so source
  rescheduling does not overwrite or duplicate a local entry. If an import already
  existed before a native entry was added, it is retained but hidden as a duplicate.
- External session details are read only, including for webmasters; edit upstream.
  Owners and webmasters can cancel saved imports through Staff Console. Imported
  sessions cannot be hard-deleted through the API. Cancellation saves Cancelled,
  localCancelled, cancelledBy and cancelledAt. Sync preserves these fields even
  when upstream changes. Public views hide cancellation; staff history retains it.
- Dates and times are converted to UTC. Missing positions remain blank.
- `request_type=exam` selects an exam; `session_type=theory` selects theory.
  Practical training uses `training_category`: 1 Official Practical, 2 Unofficial
  Practical, 3 Mock-up Practical Training, 4 Recurrent Training. Missing, null,
  blank or unknown values map to Practical Training (Unspecified). Only category 1
  practical training gets Official status. Exam type takes precedence over category.
  Position uses `atc_position`, falling back to legacy `position` / `apt_icao`.
- Rating is extracted from `topic_or_rating`, falling back to ASx/FSx when absent.
- Disappeared or cancelled upstream entries never delete saved history or infer
  local cancellation. Users cancel locally under the agreed workflow.
- Feed failures leave all saved history available through Firestore. The sync
  uses a transaction so cancellations and concurrent syncs cannot overwrite each other.
- Newly imported sessions queue a Discord notification in the same transaction.
  Unchanged sessions, updates and local duplicates do not create a new-session alert.
  Local session deletion and imported-session cancellation also queue distinct alerts.
  The private `discordTrainingOutbox` uses the existing server webhook variable;
  failed sends remain pending and retry on later sync requests or local removals.
  Queue processing requires traffic (there is no background cron). Up to 10 pending
  messages are processed per pass, with a 60-second lease/backoff. Delivery is at
  least once: a crash after Discord accepts a message but before acknowledgement
  can cause a duplicate. Existing imports are not retrospectively announced.
  Disappearance from the scheduled-only upstream feed is not treated as deletion,
  so upstream deletion cannot trigger a reliable alert without an explicit event.

## Verify

Run the partner, merge, sync and permission tests (permission tests require
`--experimental-vm-modules`),
`npm run lint`, and `npm run build`. After deployment, check
`/api/partner-schedules` for `enabled: true`, `persisted: true` and recent `fetchedAt`, then compare
the calendar with the partner schedule. Local API access does not prove the host
will accept Vercel traffic.
