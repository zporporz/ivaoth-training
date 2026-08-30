const PRACTICAL_SESSION_TYPES = new Set([
  "Official Practical",
  "Unofficial Practical",
]);

const PRACTICAL_SESSION_GAP_MINUTES = 120;

function zuluTimeToMinutes(value) {
  const match = String(value || "").match(/^(\d{2})(\d{2})Z$/);
  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
}

function minutesToZuluTime(minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return `${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}Z`;
}

function isAvailablePracticalTime(candidateMinutes, existingTimes) {
  if (candidateMinutes < 0 || candidateMinutes >= 24 * 60) return false;

  return existingTimes.every(
    (minutes) =>
      Math.abs(minutes - candidateMinutes) >= PRACTICAL_SESSION_GAP_MINUTES,
  );
}

function suggestedPracticalTimes(requestedMinutes, existingTimes) {
  const nearbyCandidates = existingTimes.flatMap((minutes) => [
    minutes - PRACTICAL_SESSION_GAP_MINUTES,
    minutes + PRACTICAL_SESSION_GAP_MINUTES,
  ]);

  return [...new Set(nearbyCandidates)]
    .filter((minutes) => isAvailablePracticalTime(minutes, existingTimes))
    .sort((a, b) => Math.abs(a - requestedMinutes) - Math.abs(b - requestedMinutes))
    .slice(0, 2)
    .map(minutesToZuluTime);
}

export function isPracticalSessionType(type) {
  return PRACTICAL_SESSION_TYPES.has(String(type || ""));
}

export function practicalConflictMessage(conflict) {
  const session = conflict?.session || {};
  const time = session.time || "-";
  const type = session.type || "practical session";
  const program = session.program ? ` ${session.program}` : "";
  const position = session.position ? ` at ${session.position}` : "";
  const suggestions = conflict?.suggestions?.length
    ? ` เวลาที่แนะนำ: ${conflict.suggestions.join(" หรือ ")}`
    : "";

  return `Practical session ต้องห่างกันอย่างน้อย 2 ชั่วโมงในวันเดียวกัน ชนกับ ${time} ${type}${program}${position}.${suggestions}`;
}

export async function findPracticalSessionConflict(db, data, options = {}) {
  if (!isPracticalSessionType(data?.type)) return null;

  const requestedMinutes = zuluTimeToMinutes(data.time);
  if (requestedMinutes === null || !data.date) return null;

  const query = db.collection("trainingSessions").where("date", "==", data.date);
  const snapshot = options.transaction
    ? await options.transaction.get(query)
    : await query.get();

  const existingSessions = snapshot.docs
    .filter((item) => item.id !== options.excludeId)
    .map((item) => ({ firestoreId: item.id, ...item.data() }))
    .filter((session) => isPracticalSessionType(session.type))
    .map((session) => ({
      session,
      minutes: zuluTimeToMinutes(session.time),
    }))
    .filter(({ minutes }) => minutes !== null);
  const existingTimes = existingSessions.map(({ minutes }) => minutes);
  const conflicts = existingSessions
    .map(({ session, minutes }) => ({
      session,
      gapMinutes: Math.abs(minutes - requestedMinutes),
    }))
    .filter(({ gapMinutes }) => gapMinutes < PRACTICAL_SESSION_GAP_MINUTES)
    .sort((a, b) => a.gapMinutes - b.gapMinutes);

  if (!conflicts[0]) return null;

  return {
    ...conflicts[0],
    suggestions: suggestedPracticalTimes(requestedMinutes, existingTimes),
  };
}
