export const CORE_WEBMASTER_VID = "739898";

export function isCoreWebmasterVid(vid) {
  return String(vid || "") === CORE_WEBMASTER_VID;
}

const CORE_POSITIONS = new Set([
  "TH-TC",
  "TH-TAC",
  "TH-DIR",
  "TH-ADIR",
  "TH-DIVISION DIRECTOR",
  "TH-DIVISION ASSISTANT DIRECTOR",
  "TH-DIVISION TRAINING COORDINATOR",
  "TH-DIVISION TRAINING ASSISTANT COORDINATOR",
]);

export function isCoreWebmasterPosition(position) {
  return CORE_POSITIONS.has(String(position || "").trim().replace(/\s+/g, " ").toUpperCase());
}

export function hasCoreWebmasterAccess(session) {
  if (!session?.vid) return false;
  if (isCoreWebmasterVid(session.vid)) return true;
  if (!session.hasTrainingAccess) return false;

  const positions = Array.isArray(session.staffPositions)
    ? session.staffPositions
    : String(session.trainingStaffPosition || "").split(",");
  return positions.some(isCoreWebmasterPosition);
}
