function normalized(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toUpperCase();
}

function sessionKey(session) {
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
  const localKeys = new Set(localSessions.map(sessionKey).filter(Boolean));
  return [...localSessions, ...partnerSessions.filter((session) => {
    const key = sessionKey(session);
    return !key || !localKeys.has(key);
  })];
}
