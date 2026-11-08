import { createDecipheriv } from "node:crypto";

export const PARTNER_SCHEDULE_URL = "https://thtraining.gt.tc/public/api/v1/schedules.php";

const TRAINING_CATEGORIES = {
  1: { label: "Official", type: "Official Practical" },
  2: { label: "Unofficial", type: "Unofficial Practical" },
  3: { label: "Mock-up", type: "Mock-up Practical Training" },
  4: { label: "Recurrent", type: "Recurrent Training" },
};

export async function fetchPartnerEvents(apiKey, fetcher = fetch) {
  if (!apiKey) throw new Error("Partner API key is not configured");
  const headers = { "X-API-Key": apiKey, Accept: "application/json" };
  async function request(url, cookie) {
    const response = await fetcher(url, {
      headers: cookie ? { ...headers, Cookie: cookie } : headers,
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Partner API returned HTTP ${response.status}`);
    return response.text();
  }
  let body = await request(PARTNER_SCHEDULE_URL);
  if (body.trimStart().startsWith("<")) {
    const challenge = body.match(/var a=toNumbers\("([a-f0-9]{32})"\),b=toNumbers\("([a-f0-9]{32})"\),c=toNumbers\("([a-f0-9]{32})"\)/i);
    if (!challenge) throw new Error("Partner browser challenge is unsupported");
    // Decode only the known AES cookie challenge; never execute upstream scripts.
    const decipher = createDecipheriv("aes-128-cbc", Buffer.from(challenge[1], "hex"), Buffer.from(challenge[2], "hex"));
    decipher.setAutoPadding(false);
    const cookie = Buffer.concat([decipher.update(Buffer.from(challenge[3], "hex")), decipher.final()]).toString("hex");
    body = await request(`${PARTNER_SCHEDULE_URL}?i=1`, `__test=${cookie}`);
  }
  const payload = JSON.parse(body);
  if (!Array.isArray(payload.events)) throw new Error("Partner API events are missing");
  return payload.events;
}

export function normalizePartnerEvents(events) {
  const sessions = new Map();
  for (const event of events) {
    if (!event || event.id == null) throw new Error("Partner event ID is missing");
    const id = `partner-thtraining-${event.id}`;
    if (["cancelled", "canceled", "deleted"].includes(String(event.status).toLowerCase())) {
      sessions.delete(id);
      continue;
    }
    const start = new Date(event.starts_at);
    if (!/Z$|[+-]\d{2}:\d{2}$/.test(String(event.starts_at)) || !Number.isFinite(start.getTime())) {
      throw new Error("Partner event start time is invalid");
    }
    const topic = String(event.topic_or_rating || event.title || "");
    const pilot = String(event.role_type).toLowerCase() === "pilot";
    const rating = topic.toUpperCase().match(pilot ? /\b(SPP|PP|CP|ATP|FS[123X])\b/ : /\b(ADC|APC|ACC|SEC|GCA|AS[123X])\b/)?.[1];
    const program = rating?.startsWith("AS") ? "ASx" : rating?.startsWith("FS") ? "FSx" : rating || (pilot ? "FSx" : "ASx");
    const exam = String(event.request_type).toLowerCase() === "exam";
    const theory = String(event.session_type).toLowerCase() === "theory";
    const categoryCode = String(event.training_category ?? "").trim();
    const category = Object.hasOwn(TRAINING_CATEGORIES, categoryCode) ? TRAINING_CATEGORIES[categoryCode] : null;
    const type = exam ? (theory ? "Theory Exam" : "Practical Exam") : theory ? "Theory Training" : category?.type || "Practical Training (Unspecified)";
    sessions.set(id, {
      id, firestoreId: id, source: "thtraining", externalId: String(event.id),
      date: start.toISOString().slice(0, 10),
      time: start.toISOString().slice(11, 16).replace(":", "") + "Z",
      endsAt: event.ends_at || null, program, type,
      status: exam ? "Exam" : !theory && categoryCode === "1" ? "Official" : "Scheduled",
      trainingCategory: category?.label || "Unspecified",
      position: String(event.atc_position || event.position || event.apt_icao || ""),
      topic, remarks: String(event.remarks || ""),
      traineeName: String(event.member_name || ""), traineeVid: String(event.member_vid || ""),
      trainerName: String(event.primary_staff?.name || ""),
      trainerVid: String(event.primary_staff?.member_vid || ""),
      trainerStaffPosition: String(event.primary_staff?.current_position || ""),
      secondaryTrainerName: String(event.secondary_staff?.name || ""),
      secondaryTrainerVid: String(event.secondary_staff?.member_vid || ""),
    });
  }
  return [...sessions.values()];
}
