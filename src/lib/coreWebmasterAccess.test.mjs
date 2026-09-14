import assert from "node:assert/strict";
import test from "node:test";
import { hasCoreWebmasterAccess } from "./coreWebmasterAccess.js";

test("core owner and Thai training coordinators have core access", () => {
  assert.equal(hasCoreWebmasterAccess({ vid: "739898" }), true);
  for (const position of [
    "TH-TC", "TH-TAC", " th-tac ", "TH-TA1, TH-TC",
    "TH-Division Training Coordinator",
    "TH-Division Training Assistant Coordinator",
  ]) {
    assert.equal(hasCoreWebmasterAccess({
      vid: "123456", hasTrainingAccess: true, trainingStaffPosition: position,
    }), true, position);
  }
});

test("other staff and unauthenticated users do not gain core access", () => {
  for (const position of ["TH-TA1", "TH-T01", "US-TC", "TC", "TH-TC1", "", "TH-TC assistant"]) {
    assert.equal(hasCoreWebmasterAccess({
      vid: "123456", hasTrainingAccess: true, trainingStaffPosition: position,
    }), false, position);
  }
  assert.equal(hasCoreWebmasterAccess(null), false);
  assert.equal(hasCoreWebmasterAccess({ trainingStaffPosition: "TH-TC", hasTrainingAccess: true }), false);
  assert.equal(hasCoreWebmasterAccess({ vid: "123456", trainingStaffPosition: "TH-TC" }), false);
});
