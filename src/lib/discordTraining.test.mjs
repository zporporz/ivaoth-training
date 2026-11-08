import assert from "node:assert/strict";
import test from "node:test";
import { buildTrainingNotification, sendTrainingNotification } from "./discordTrainingServer.js";
import { flushTrainingNotifications, queueTrainingNotification } from "./discordTrainingOutbox.js";

const session = { program: "ADC", type: "Practical Exam", date: "2026-11-12", time: "1300Z", traineeName: "Student" };

function outboxDb() {
  const events = new Map();
  let serial = Promise.resolve();
  const reference = (id) => ({
    id,
    async get() { return { exists: events.has(id), data: () => events.get(id) }; },
    async update(data) { events.set(id, { ...events.get(id), ...data }); },
  });
  const db = {
    events,
    collection(name) {
      assert.equal(name, "discordTrainingOutbox");
      return {
        doc: reference,
        where(field, operator, value) {
          return { limit(count) { return { async get() {
            return { docs: [...events].filter(([, data]) => data[field] === value).slice(0, count).map(([id]) => ({ id })) };
          } }; } };
        },
      };
    },
    runTransaction(callback) {
      const next = serial.then(() => callback({
        get: (ref) => ref.get(), update: (ref, data) => ref.update(data),
        set: (ref, data) => events.set(ref.id, data),
      }));
      serial = next.catch(() => {});
      return next;
    },
  };
  return db;
}

test("notifications distinguish new, delete and cancel, including exam labels", () => {
  assert.match(buildTrainingNotification("new", session).embeds[0].title, /New/);
  for (const [action, label] of [["deleted", "Deleted"], ["cancelled", "Cancelled"]]) {
    const payload = buildTrainingNotification(action, session);
    assert.match(payload.embeds[0].title, new RegExp(label));
    assert.equal(payload.embeds[0].fields.find((field) => field.name === "Status").value, label);
    assert.ok(payload.embeds[0].fields.some((field) => field.name === "Examinee"));
    assert.deepEqual(payload.allowed_mentions.parse, []);
  }
});

test("Discord transport checks status and missing configuration", async () => {
  await assert.rejects(sendTrainingNotification("new", session, { webhookUrl: "" }));
  await assert.rejects(sendTrainingNotification("new", session, { webhookUrl: "https://example.test", fetcher: async () => new Response("", { status: 429 }) }));
  await sendTrainingNotification("deleted", session, { webhookUrl: "https://example.test", fetcher: async (_, options) => {
    assert.equal(JSON.parse(options.body).embeds[0].title, "Session Deleted");
    return new Response(null, { status: 204 });
  } });
});

test("concurrent drains claim one event, successful events are not sent again", async () => {
  const db = outboxDb();
  await db.runTransaction((tx) => queueTrainingNotification(tx, db, "new-1", "new", session));
  const sends = [];
  const sender = async (action, data) => { sends.push({ action, data }); };
  await Promise.all([flushTrainingNotifications(db, sender), flushTrainingNotifications(db, sender)]);
  await flushTrainingNotifications(db, sender);
  assert.equal(sends.length, 1);
  assert.equal(db.events.get("new-1").status, "sent");
});

test("Discord failure retains pending notification and retries after backoff", async () => {
  const db = outboxDb();
  await db.runTransaction((tx) => queueTrainingNotification(tx, db, "cancel-1", "cancelled", session));
  await flushTrainingNotifications(db, async () => { throw new Error("Unavailable"); });
  assert.equal(db.events.get("cancel-1").status, "pending");
  let sends = 0;
  await flushTrainingNotifications(db, async () => { sends++; });
  assert.equal(sends, 0);
  db.events.get("cancel-1").retryAt = 0;
  await flushTrainingNotifications(db, async () => { sends++; });
  assert.equal(sends, 1);
  assert.equal(db.events.get("cancel-1").status, "sent");
});
