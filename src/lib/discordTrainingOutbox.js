import { sendTrainingNotification } from "./discordTrainingServer.js";

export function queueTrainingNotification(transaction, db, eventId, action, session) {
  transaction.set(db.collection("discordTrainingOutbox").doc(eventId), {
    action, session, status: "pending", retryAt: 0, createdAt: new Date().toISOString(),
  });
}

export async function flushTrainingNotifications(db, sender = sendTrainingNotification) {
  if (sender === sendTrainingNotification && !process.env.DISCORD_TRAINING_WEBHOOK_URL) return;
  const pending = await db.collection("discordTrainingOutbox").where("status", "==", "pending").limit(10).get();
  for (const doc of pending.docs) {
    const reference = db.collection("discordTrainingOutbox").doc(doc.id);
    const event = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const data = snapshot.data();
      if (!snapshot.exists || data.status !== "pending" || data.retryAt > Date.now()) return null;
      // Keep failed/abandoned claims retryable, while preventing concurrent sends.
      transaction.update(reference, { retryAt: Date.now() + 60000 });
      return data;
    });
    if (!event) continue;
    try {
      await sender(event.action, event.session);
      await reference.update({ status: "sent", sentAt: new Date().toISOString() });
    } catch {
      console.warn("Discord notification pending retry", doc.id);
    }
  }
}

export async function tryFlushTrainingNotifications(db) {
  try {
    await flushTrainingNotifications(db);
  } catch {
    console.warn("Discord notification queue could not be processed");
  }
}
