import assert from "node:assert/strict";
import { createCipheriv } from "node:crypto";
import test from "node:test";
import { fetchPartnerEvents, normalizePartnerEvents, PARTNER_SCHEDULE_URL } from "./partnerSchedules.js";

const event = {
  id: 141, starts_at: "2026-11-08T11:00:00Z", ends_at: "2026-11-08T13:00:00Z",
  status: "scheduled", session_type: "practical", request_type: "exam", role_type: "ATC",
  topic_or_rating: "ADC Practical Exam", member_name: "Student", member_vid: "765992",
  primary_staff: { name: "Examiner", member_vid: "600767", current_position: "TH-TAC" },
  secondary_staff: { name: "Observer", member_vid: "660519" },
};

test("maps exam, neutral practical training, UTC date and staff without inventing missing position", () => {
  const [exam] = normalizePartnerEvents([event]);
  assert.equal(exam.type, "Practical Exam");
  assert.equal(exam.program, "ADC");
  assert.equal(exam.time, "1100Z");
  assert.equal(exam.position, "");
  assert.equal(exam.trainerVid, "600767");
  assert.equal(exam.secondaryTrainerVid, "660519");
  const [pilot] = normalizePartnerEvents([{ ...event, request_type: "training", role_type: "Pilot", topic_or_rating: "SPP Exam Training and Practice", starts_at: "2026-11-09T01:00:00+07:00" }]);
  assert.equal(pilot.type, "Practical Training");
  assert.equal(pilot.status, "Scheduled");
  assert.equal(pilot.program, "SPP");
  assert.equal(pilot.date, "2026-11-08");
  assert.equal(pilot.time, "1800Z");
});

test("stable IDs replace duplicate events and cancellations are removed", () => {
  const entries = normalizePartnerEvents([event, { ...event, member_name: "Updated" }]);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].traineeName, "Updated");
  assert.deepEqual(normalizePartnerEvents([event, { ...event, status: "cancelled" }]), []);
  assert.throws(() => normalizePartnerEvents([{ ...event, starts_at: "invalid" }]));
  assert.throws(() => normalizePartnerEvents([{ ...event, id: null }]));
});

test("uses X-API-Key and handles known cookie challenge without running scripts", async () => {
  const key = Buffer.alloc(16, 1);
  const iv = Buffer.alloc(16, 2);
  const cookie = Buffer.alloc(16, 3);
  const cipher = createCipheriv("aes-128-cbc", key, iv);
  cipher.setAutoPadding(false);
  const encrypted = Buffer.concat([cipher.update(cookie), cipher.final()]);
  const calls = [];
  const result = await fetchPartnerEvents("test-key", async (url, options) => {
    calls.push({ url, options });
    return new Response(calls.length === 1
      ? `<html>var a=toNumbers("${key.toString("hex")}"),b=toNumbers("${iv.toString("hex")}"),c=toNumbers("${encrypted.toString("hex")}")</html>`
      : JSON.stringify({ events: [event] }));
  });
  assert.equal(result[0].id, 141);
  assert.equal(calls[0].options.headers["X-API-Key"], "test-key");
  assert.equal(calls[0].options.headers.Authorization, undefined);
  assert.equal(calls[1].url, `${PARTNER_SCHEDULE_URL}?i=1`);
  assert.equal(calls[1].options.headers.Cookie, `__test=${cookie.toString("hex")}`);
  assert.equal(calls[1].options.redirect, "error");
});

test("fails closed on authentication failure, invalid payload or changed challenge", async () => {
  await assert.rejects(fetchPartnerEvents("test", async () => new Response("Unauthorized", { status: 401 })));
  await assert.rejects(fetchPartnerEvents("test", async () => new Response("<html>changed</html>")));
  await assert.rejects(fetchPartnerEvents("test", async () => new Response("{}")));
  await assert.rejects(fetchPartnerEvents(""));
});
