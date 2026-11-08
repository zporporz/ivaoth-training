import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { fetchPartnerEvents, normalizePartnerEvents } from "../../../lib/partnerSchedules";

export const runtime = "nodejs";

const readSchedules = unstable_cache(async () => {
  const events = await fetchPartnerEvents(process.env.PARTNER_SCHEDULE_API_KEY);
  return { sessions: normalizePartnerEvents(events), fetchedAt: new Date().toISOString() };
}, ["thtraining-schedules-v2"], { revalidate: 300 });

export async function GET() {
  if (!process.env.PARTNER_SCHEDULE_API_KEY) {
    return NextResponse.json({ enabled: false, sessions: [] }, { headers: { "Cache-Control": "no-store" } });
  }
  try {
    return NextResponse.json({ enabled: true, ...await readSchedules() }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Unable to load partner schedules" }, { status: 502 });
  }
}
