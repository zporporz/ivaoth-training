import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { SourceTextModule, SyntheticModule } from "node:vm";

async function loadAccessModules(records = {}, trainingSessions = {}) {
  const lookups = [];
  const writes = [];
  const core = new SourceTextModule(await readFile(new URL("./coreWebmasterAccess.js", import.meta.url), "utf8"));
  await core.link(() => { throw new Error("Unexpected core dependency"); });
  await core.evaluate();
  const database = {
    collection(name) {
      if (name === "trainingSessions") {
        return { doc(id) {
          return {
            async get() {
              return { exists: Object.hasOwn(trainingSessions, id), data: () => trainingSessions[id] };
            },
            async update(data) { writes.push({ method: "PATCH", id, data }); },
            async delete() { writes.push({ method: "DELETE", id }); },
          };
        } };
      }
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
    "@google-cloud/firestore": { FieldValue: { serverTimestamp: () => "timestamp" } },
    "next/server": { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
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
  const route = new SourceTextModule(await readFile(new URL("../app/api/admin-data/sessions/[id]/route.js", import.meta.url), "utf8"));
  await route.link((specifier) => {
    if (specifier.endsWith("/serverDataAccess")) return server;
    const exports = dependencies[specifier.endsWith("/firebaseAdmin") ? "./firebaseAdmin" : specifier];
    if (!exports) throw new Error(`Unexpected route dependency: ${specifier}`);
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    });
  });
  await route.evaluate();
  return { server: server.namespace, client: client.namespace, route: route.namespace, lookups, writes };
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

const assignedSession = { trainerVid: "123456", trainerName: "Original trainer" };
const editPayload = {
  date: "2026-10-25", time: "1300Z", program: "ADC", type: "Official Practical",
  topic: "Updated topic", position: "VTBD_TWR", traineeVid: "654321", traineeName: "Trainee",
};

test("registered webmaster without training role can edit and delete another trainer's session", async () => {
  const { route, client, server, writes } = await loadAccessModules(
    { "660519": { active: true } }, { assigned: assignedSession },
  );
  const session = { vid: "660519", hasTrainingAccess: false };
  const allowed = await server.isWebmaster(session);
  assert.equal(client.canEditSession(session, assignedSession, allowed), true);
  assert.equal(client.canDeleteSession(session, assignedSession, allowed), true);
  const request = { session, json: async () => editPayload };
  const params = { params: Promise.resolve({ id: "assigned" }) };
  const updated = await route.PATCH(request, params);
  assert.equal(updated.status, 200);
  assert.equal(updated.body.session.trainerVid, "123456");
  assert.equal(updated.body.session.trainerName, "Original trainer");
  assert.equal((await route.DELETE(request, params)).status, 200);
  assert.deepEqual(writes.map(({ method }) => method), ["PATCH", "DELETE"]);
});

test("ordinary trainers can change their own sessions but not another trainer's", async () => {
  for (const vid of ["123456", "555555"]) {
    const { route, client, writes } = await loadAccessModules({}, { assigned: assignedSession });
    const session = { vid, hasTrainingAccess: true };
    const owns = vid === assignedSession.trainerVid;
    assert.equal(client.canEditSession(session, assignedSession, false), owns);
    assert.equal(client.canDeleteSession(session, assignedSession, false), owns);
    const request = { session, json: async () => editPayload };
    const params = { params: Promise.resolve({ id: "assigned" }) };
    assert.equal((await route.PATCH(request, params)).status, owns ? 200 : 403);
    assert.equal((await route.DELETE(request, params)).status, owns ? 200 : 403);
    assert.equal(writes.length, owns ? 2 : 0);
  }
});

test("revoked webmasters and unauthenticated users cannot mutate sessions", async () => {
  for (const session of [null, { vid: "660519", hasTrainingAccess: false }, { vid: "660519", hasTrainingAccess: true }]) {
    const { route, writes } = await loadAccessModules(
      { "660519": { active: false } }, { assigned: assignedSession },
    );
    const request = { session, json: async () => editPayload };
    const params = { params: Promise.resolve({ id: "assigned" }) };
    assert.equal((await route.PATCH(request, params)).status, 403);
    assert.equal((await route.DELETE(request, params)).status, 403);
    assert.equal(writes.length, 0);
  }
});
