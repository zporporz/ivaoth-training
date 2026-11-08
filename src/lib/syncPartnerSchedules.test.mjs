import assert from "node:assert/strict";
import test from "node:test";
import { syncPartnerSchedules } from "./syncPartnerSchedules.js";
import { mergePartnerSchedules } from "./mergePartnerSchedules.js";

const session = {
  id: "partner-thtraining-152", firestoreId: "partner-thtraining-152",
  source: "thtraining", externalId: "152", date: "2026-11-12", time: "1330Z",
  program: "APC", traineeVid: "755407", trainerVid: "739898",
  type: "Unofficial Practical", status: "Scheduled", position: "VTBD_APP",
};

function fakeDb() {
  const collections = { trainingSessions: new Map(), partnerScheduleLinks: new Map() };
  const writes = [];
  const snapshot = (name, id) => ({ id, exists: collections[name].has(id), data: () => collections[name].get(id) });
  return {
    collections, writes,
    collection(name) { return { name, doc(id) { return { name, id }; }, where(field, op, value) { return { name, field, op, value }; } }; },
    async runTransaction(callback) {
      const pending = [];
      const result = await callback({
        async get(query) {
          assert.equal(pending.length, 0, "All reads must precede writes");
          return { docs: [...collections[query.name].keys()]
            .filter((id) => !query.field || collections[query.name].get(id)[query.field] === query.value)
            .map((id) => snapshot(query.name, id)) };
        },
        async getAll(...refs) {
          assert.equal(pending.length, 0);
          return refs.map((ref) => snapshot(ref.name, ref.id));
        },
        set(ref, data, options) { pending.push({ ref, data, options }); },
      });
      for (const write of pending) {
        const { ref, data, options } = write;
        const original = options?.merge ? collections[ref.name].get(ref.id) || {} : {};
        collections[ref.name].set(ref.id, { ...original, ...data });
        writes.push(write);
      }
      return result;
    },
  };
}

test("imports once, repeated reads do not write, changed data updates same document", async () => {
  const db = fakeDb();
  assert.equal((await syncPartnerSchedules(db, [session], "first")).created, 1);
  const writes = db.writes.length;
  assert.equal((await syncPartnerSchedules(db, [session], "second")).unchanged, 1);
  assert.equal(db.writes.length, writes);
  assert.equal((await syncPartnerSchedules(db, [{ ...session, time: "1400Z" }], "third")).updated, 1);
  assert.equal(db.collections.trainingSessions.size, 1);
  const saved = db.collections.trainingSessions.get(session.id);
  assert.equal(saved.time, "1400Z");
  assert.equal(saved.importedAt, "first");
});

test("disappeared sessions remain stored as history", async () => {
  const db = fakeDb();
  await syncPartnerSchedules(db, [session]);
  await syncPartnerSchedules(db, []);
  assert.equal(db.collections.trainingSessions.size, 1);
});

test("local duplicate wins and persistent link prevents reimport when upstream reschedules", async () => {
  const db = fakeDb();
  const native = { ...session, id: "local", firestoreId: "local", source: undefined, type: "Official Practical", position: "OUR_POSITION" };
  db.collections.trainingSessions.set("local", native);
  assert.equal((await syncPartnerSchedules(db, [session])).localPreferred, 1);
  await syncPartnerSchedules(db, [{ ...session, time: "1800Z" }]);
  assert.equal(db.collections.trainingSessions.size, 1);
  assert.deepEqual(db.collections.trainingSessions.get("local"), native);
});

test("local cancellation survives identical and changed upstream data", async () => {
  const db = fakeDb();
  await syncPartnerSchedules(db, [session]);
  Object.assign(db.collections.trainingSessions.get(session.id), { localCancelled: true, status: "Cancelled", cancelledBy: "739898" });
  await syncPartnerSchedules(db, [session]);
  await syncPartnerSchedules(db, [{ ...session, time: "1800Z" }]);
  const saved = db.collections.trainingSessions.get(session.id);
  assert.equal(saved.status, "Cancelled");
  assert.equal(saved.localCancelled, true);
  assert.equal(saved.cancelledBy, "739898");
  assert.equal(saved.time, "1800Z");
});

test("a later local session suppresses saved imports without deleting history", async () => {
  const db = fakeDb();
  await syncPartnerSchedules(db, [session]);
  const native = { ...session, source: undefined, id: "local", firestoreId: "local" };
  db.collections.trainingSessions.set("local", native);
  await syncPartnerSchedules(db, [session]);
  assert.equal(db.collections.trainingSessions.size, 2);
  const rows = [...db.collections.trainingSessions.values()];
  assert.deepEqual(mergePartnerSchedules(rows, []), [native]);
});

test("rejects invalid IDs and oversized feeds before any DB changes", async () => {
  const db = fakeDb();
  await assert.rejects(syncPartnerSchedules(db, [{ ...session, firestoreId: "local" }]));
  await assert.rejects(syncPartnerSchedules(db, Array(201).fill(session)));
  assert.equal(db.writes.length, 0);
});

test("persisted and live copies merge once, preferring the saved cancellation", () => {
  const cancelled = { ...session, status: "Cancelled", localCancelled: true };
  assert.deepEqual(mergePartnerSchedules([cancelled], [session]), [cancelled]);
});
