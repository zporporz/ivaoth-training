import { sessionToDate } from "./staffSessions";

export function findKnownTrainee(sessions, traineeVid) {
  const cleanVid = String(traineeVid || "").trim();
  if (!cleanVid) return null;

  return sessions
    .filter((session) => String(session.traineeVid || "").trim() === cleanVid)
    .filter((session) => session.traineeName || session.trainee)
    .sort((a, b) => {
      const dateA = sessionToDate(a)?.getTime() || 0;
      const dateB = sessionToDate(b)?.getTime() || 0;
      return dateB - dateA;
    })[0];
}
