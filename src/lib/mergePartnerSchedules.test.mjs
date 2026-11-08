import assert from "node:assert/strict";
import test from "node:test";
import { mergePartnerSchedules } from "./mergePartnerSchedules.js";

const local = {
  id: "ours", date: "2026-11-08", time: "0600Z", program: "PP",
  traineeVid: "730146", trainerVid: "739898", position: "VTBD>VTPH",
  type: "Unofficial Practical", status: "Scheduled",
};
const partner = { ...local, id: "partner", source: "thtraining", type: "Practical Training", position: "" };

test("local official or unofficial practical wins regardless of upstream type, trainer and position", () => {
  for (const type of ["Official Practical", "Unofficial Practical"]) {
    const ours = { ...local, type };
    const result = mergePartnerSchedules([ours], [{ ...partner, trainerVid: "different" }]);
    assert.deepEqual(result, [ours]);
    assert.equal(result[0], ours);
  }
});

test("normalizes time, VID and rating representation", () => {
  assert.deepEqual(mergePartnerSchedules([local], [{ ...partner, time: "06:00", traineeVid: 730146, program: " pp " }]), [local]);
});

test("keeps separate trainees, ratings, dates and times", () => {
  for (const change of [{ traineeVid: "777777" }, { program: "ADC" }, { date: "2026-11-09" }, { time: "0700Z" }]) {
    assert.equal(mergePartnerSchedules([local], [{ ...partner, ...change }]).length, 2);
  }
});

test("does not hide exams or theory because a practical training exists", () => {
  for (const change of [{ type: "Practical Exam", status: "Exam" }, { type: "Theory Training" }]) {
    assert.equal(mergePartnerSchedules([local], [{ ...partner, ...change }]).length, 2);
  }
});

test("keeps local duplicates and incomplete identities without deleting data", () => {
  assert.equal(mergePartnerSchedules([local, local], [partner]).length, 2);
  assert.equal(mergePartnerSchedules([{ ...local, traineeVid: "" }], [partner]).length, 2);
  assert.deepEqual(mergePartnerSchedules([], [partner]), [partner]);
  assert.deepEqual(mergePartnerSchedules([local], []), [local]);
});
