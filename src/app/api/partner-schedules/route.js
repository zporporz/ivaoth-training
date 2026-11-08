import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { fetchPartnerEvents, normalizePartnerEvents } from "../../../lib/partnerSchedules";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import { syncPartnerSchedules } from "../../../lib/syncPartnerSchedules";
import { tryFlushTrainingNotifications } from "../../../lib/discordTrainingOutbox";

export const runtime = "nodejs";

const readSchedules = unstable_cache(async () => {
  const events = await fetchPartnerEvents(process.env.PARTNER_SCHEDULE_API_KEY);
  const sync = await syncPartnerSchedules(getAdminDb(), normalizePartnerEvents(events));
  await tryFlushTrainingNotifications(getAdminDb());
  return { sessions: [], persisted: true, sync, fetchedAt: new Date().toISOString() };
}, ["thtraining-schedules-persisted-v1"], { revalidate: 300 });

export async function GET() {
  if (!process.env.PARTNER_SCHEDULE_API_KEY) {
    return NextResponse.json({ enabled: false, sessions: [] }, { headers: { "Cache-Control": "no-store" } });
  }
  try {
    const schedules = await readSchedules();
    await tryFlushTrainingNotifications(getAdminDb());
    return NextResponse.json({ enabled: true, ...schedules }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Unable to load partner schedules" }, { status: 502 });
  }
}
