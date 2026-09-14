import assert from "node:assert/strict";
import test from "node:test";
import { hasCoreWebmasterAccess, isCoreWebmasterPosition } from "./coreWebmasterAccess.js";

test("core owner and Thai training coordinators have core access", () => {
  assert.equal(hasCoreWebmasterAccess({ vid: "739898" }), true);
  for (const position of [
    "TH-TC", "TH-TAC", " th-tac ", "TH-TA1, TH-TC",
    "TH-Division Training Coordinator",
    "TH-Division Training Assistant Coordinator",
    "TH-DIR", "TH-ADIR", " th-adir ",
    "TH-Division Director", "TH-Division Assistant Director",
  ]) {
    assert.equal(hasCoreWebmasterAccess({
      vid: "123456", hasTrainingAccess: true, trainingStaffPosition: position,
    }), true, position);
  }
});

test("other staff and unauthenticated users do not gain core access", () => {
  for (const position of ["TH-TA1", "TH-T01", "US-TC", "TC", "TH-TC1", "", "TH-TC assistant", "US-DIR", "DIR", "TH-ADIR1"]) {
    assert.equal(hasCoreWebmasterAccess({
      vid: "123456", hasTrainingAccess: true, trainingStaffPosition: position,
    }), false, position);
  }
  assert.equal(hasCoreWebmasterAccess(null), false);
  assert.equal(hasCoreWebmasterAccess({ trainingStaffPosition: "TH-TC", hasTrainingAccess: true }), false);
  assert.equal(hasCoreWebmasterAccess({ vid: "123456", trainingStaffPosition: "TH-TC" }), false);
});

test("director roles enable login access without a training role and survive multiple positions", () => {
  for (const position of ["TH-DIR", "TH-ADIR"]) {
    const staffPositions = ["TH-TA1", position];
    const hasTrainingAccess = staffPositions.some(isCoreWebmasterPosition);
    assert.equal(hasTrainingAccess, true);
    assert.equal(hasCoreWebmasterAccess({
      vid: "123456", hasTrainingAccess, staffPositions, trainingStaffPosition: "TH-TA1",
    }), true);
  }
  assert.equal(["US-DIR", "TH-WM"].some(isCoreWebmasterPosition), false);
});
