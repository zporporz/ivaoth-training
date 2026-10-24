import assert from "node:assert/strict";
import test from "node:test";
import { hasCoreWebmasterAccess, isCoreWebmasterPosition } from "./coreWebmasterAccess.js";
import { getIvaoCorePosition } from "./ivaoCorePosition.js";

test("core owner and Thai training coordinators have core access", () => {
  assert.equal(hasCoreWebmasterAccess({ vid: "739898" }), true);
  for (const position of [
    "TH-TC", "TH-TAC", " th-tac ", "TH-TA1, TH-TC",
    "TH-Division Training Coordinator",
    "TH-Division Training Assistant Coordinator",
    "TH-Training Coordinator", "TH-Training Assistant Coordinator",
    "TH-Director", "TH-Assistant Director",
    "TH-DIR", "TH-ADIR", " th-adir ",
    "TH-Division Director", "TH-Division Assistant Director",
  ]) {
    assert.equal(hasCoreWebmasterAccess({
      vid: "123456", hasTrainingAccess: true, trainingStaffPosition: position,
    }), true, position);
  }
});

test("IVAO role IDs resolve to Thai core positions even when names omit Division", () => {
  for (const [id, name] of [
    ["-TC", "Training Coordinator"],
    ["-TAC", "Training Assistant Coordinator"],
    ["-DIR", "Director"],
    ["-ADIR", "Assistant Director"],
  ]) {
    const code = getIvaoCorePosition({ divisionId: "TH", staffPosition: { id, name } });
    assert.equal(code, `TH${id}`);
    assert.equal(hasCoreWebmasterAccess({
      vid: "123456", hasTrainingAccess: true, staffPositions: [code],
    }), true);
  }
  assert.equal(getIvaoCorePosition({ division: { id: "TH" }, staffPosition: { id: "-TAC" } }), "TH-TAC");
  assert.equal(getIvaoCorePosition({ divisionId: "US", staffPosition: { id: "TH-TC" } }), null);
  assert.equal(getIvaoCorePosition({ staffPosition: { id: "-TC" } }), null);
  assert.equal(isCoreWebmasterPosition(getIvaoCorePosition({ divisionId: "US", staffPosition: { id: "-TC" } })), false);
});

test("legacy role names still work when the session role list is empty", () => {
  assert.equal(hasCoreWebmasterAccess({
    vid: "123456", hasTrainingAccess: true, staffPositions: [],
    trainingStaffPosition: "TH-Training Assistant Coordinator",
  }), true);
  assert.equal(hasCoreWebmasterAccess({
    vid: "123456", hasTrainingAccess: true, trainingStaffPosition: "US-Training Coordinator",
  }), false);
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
