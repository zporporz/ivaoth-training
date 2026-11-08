import { createHash } from "node:crypto";
import { sessionKey } from "./mergePartnerSchedules.js";
import { queueTrainingNotification } from "./discordTrainingOutbox.js";

export function partnerFingerprint(session) {
  return createHash("sha256").update(JSON.stringify(session)).digest("hex");
}

export async function syncPartnerSchedules(db, sessions, now = new Date().toISOString()) {
  // Bound writes so an unexpectedly large feed fails without partial imports.
  if (sessions.length > 200) throw new Error("Partner feed exceeds sync limit");
  if (sessions.some((session) => session.source !== "thtraining" || !/^partner-thtraining-\d+$/.test(session.firestoreId))) {
    throw new Error("Invalid partner session identity");
  }
  return db.runTransaction(async (transaction) => {
    const collection = db.collection("trainingSessions");
    const links = db.collection("partnerScheduleLinks");
    const linkSnapshots = sessions.length
      ? await transaction.getAll(...sessions.map((session) => links.doc(session.firestoreId)))
      : [];
    const ids = new Set(sessions.map((session) => session.firestoreId));
    for (const link of linkSnapshots) {
      if (link.exists) ids.add(link.data().localSessionId);
    }
    const saved = ids.size ? await transaction.getAll(...[...ids].map((id) => collection.doc(id))) : [];
    const byId = new Map(saved.filter((doc) => doc.exists).map((doc) => [doc.id, { ...doc.data(), firestoreId: doc.id }]));
    // Read only dates in this feed, not the entire growing history collection.
    const nativeByKey = new Map();
    for (const date of new Set(sessions.map((session) => session.date))) {
      const snapshot = await transaction.get(collection.where("date", "==", date));
      for (const doc of snapshot.docs) {
        const row = { ...doc.data(), firestoreId: doc.id };
        if (row.source !== "thtraining" && sessionKey(row)) nativeByKey.set(sessionKey(row), row);
      }
    }
    const result = { created: 0, updated: 0, unchanged: 0, localPreferred: 0 };
    sessions.forEach((session, index) => {
      const reference = collection.doc(session.firestoreId);
      const existing = byId.get(session.firestoreId);
      const link = linkSnapshots[index];
      const linkedLocal = link.exists ? byId.get(link.data().localSessionId) : null;
      const native = linkedLocal && linkedLocal.source !== "thtraining"
        ? linkedLocal : nativeByKey.get(sessionKey(session));
      if (native) {
        if (!link.exists || link.data().localSessionId !== native.firestoreId) {
          transaction.set(links.doc(session.firestoreId), { localSessionId: native.firestoreId, externalId: session.externalId, linkedAt: now });
        }
        if (existing && existing.source === "thtraining" && existing.duplicateOf !== native.firestoreId) {
          transaction.set(reference, { duplicateOf: native.firestoreId, updatedAt: now }, { merge: true });
        }
        result.localPreferred++;
        return;
      }
      const fingerprint = partnerFingerprint(session);
      if (existing?.partnerFingerprint === fingerprint && !existing.duplicateOf) {
        result.unchanged++;
        return;
      }
      if (existing && existing.source !== "thtraining") throw new Error("Partner ID collides with local session");
      transaction.set(reference, {
        ...session,
        status: existing?.localCancelled ? "Cancelled" : session.status,
        partnerFingerprint: fingerprint,
        importedAt: existing?.importedAt || now,
        createdAt: existing?.createdAt || now,
        duplicateOf: null,
        updatedAt: now,
      }, { merge: true });
      result[existing ? "updated" : "created"]++;
      if (!existing) {
        queueTrainingNotification(transaction, db, `new-${session.firestoreId}`, "new", session);
      }
    });
    return result;
  });
}
