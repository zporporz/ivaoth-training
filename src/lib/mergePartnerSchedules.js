function normalized(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toUpperCase();
}

export function sessionKey(session) {
  const date = normalized(session.date);
  const time = normalized(session.time).replace(/[:Z]/g, "");
  const program = normalized(session.program);
  const traineeVid = normalized(session.traineeVid);
  const trainee = traineeVid
    ? `vid:${traineeVid}`
    : `name:${normalized(session.traineeName || session.trainee)}`;
  if (!date || !/^\d{4}$/.test(time) || !program || trainee === "name:") return null;
  const type = normalized(session.type);
  const exam = session.status === "Exam" || type.endsWith(" EXAM");
  const mode = type.includes("THEORY") ? "theory" : "practical";
  return JSON.stringify([date, time, program, trainee, exam ? "exam" : "training", mode]);
}

export function mergePartnerSchedules(localSessions, partnerSessions) {
  const nativeSessions = localSessions.filter((session) => session.source !== "thtraining");
  const imported = [...localSessions.filter((session) => session.source === "thtraining"), ...partnerSessions];
  const localKeys = new Set(nativeSessions.map(sessionKey).filter(Boolean));
  const seenIds = new Set();
  return [...nativeSessions, ...imported.filter((session) => {
    if (session.duplicateOf) return false;
    const id = session.firestoreId || session.id;
    if (id && seenIds.has(id)) return false;
    if (id) seenIds.add(id);
    const key = sessionKey(session);
    return !key || !localKeys.has(key);
  })];
}
