import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { SourceTextModule, SyntheticModule } from "node:vm";

async function loadAccessModules(records = {}) {
  const lookups = [];
  const core = new SourceTextModule(await readFile(new URL("./coreWebmasterAccess.js", import.meta.url), "utf8"));
  await core.link(() => { throw new Error("Unexpected core dependency"); });
  await core.evaluate();
  const database = {
    collection(name) {
      assert.equal(name, "webmasters");
      return { doc(vid) {
        return { async get() {
          lookups.push(vid);
          return { exists: Object.hasOwn(records, vid), data: () => records[vid] };
        } };
      } };
    },
  };
  const dependencies = {
    "@google-cloud/firestore": { FieldValue: {} },
    "next/server": { NextResponse: {} },
    "./firebaseAdmin": { getAdminDb: () => database },
    "./serverSession": { getRequestSession: (request) => request.session || null },
  };
  const server = new SourceTextModule(await readFile(new URL("./serverDataAccess.js", import.meta.url), "utf8"));
  await server.link((specifier) => {
    if (specifier === "./coreWebmasterAccess") return core;
    const exports = dependencies[specifier];
    if (!exports) throw new Error(`Unexpected dependency: ${specifier}`);
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    });
  });
  await server.evaluate();
  const client = new SourceTextModule(await readFile(new URL("./permissions.js", import.meta.url), "utf8"));
  await client.link((specifier) => {
    assert.equal(specifier, "./coreWebmasterAccess");
    return core;
  });
  await client.evaluate();
  return { server: server.namespace, client: client.namespace, lookups };
}

test("registered webmaster can use tools without training role, but cannot delegate core access", async () => {
  const { server, client } = await loadAccessModules({ "660519": { active: true } });
  const session = { vid: "660519", hasTrainingAccess: false };
  const allowed = await server.isWebmaster(session);
  assert.equal(await server.requireWebmaster({ session }), session);
  assert.equal(client.canManualAddTraining(session, allowed), true);
  assert.equal(client.canManageStaffList(session, allowed), true);
  assert.equal(client.canManageWebmasters(session), false);
  assert.equal(server.requireCoreWebmaster({ session }), null);
});

test("disabled, removed and unauthenticated accounts cannot use webmaster tools", async () => {
  const { server, client, lookups } = await loadAccessModules({ "660519": { active: false } });
  for (const session of [null, { vid: "660519" }, { vid: "123456", hasTrainingAccess: true }]) {
    const allowed = await server.isWebmaster(session);
    assert.equal(allowed, false);
    assert.equal(await server.requireWebmaster({ session }), null);
    assert.equal(client.canManualAddTraining(session, allowed), false);
    assert.equal(client.canManageStaffList(session, allowed), false);
  }
  assert.equal(lookups.includes(""), false);
});

test("TC and TAC retain core tools without database grants", async () => {
  const { server, client, lookups } = await loadAccessModules();
  for (const position of ["TH-TC", "TH-TAC"]) {
    const session = { vid: "123456", hasTrainingAccess: true, staffPositions: [position] };
    assert.equal(await server.requireWebmaster({ session }), session);
    assert.equal(server.requireCoreWebmaster({ session }), session);
    assert.equal(client.canManageWebmasters(session), true);
  }
  assert.equal(lookups.length, 0);
});
