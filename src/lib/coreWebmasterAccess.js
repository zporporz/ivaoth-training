export const CORE_WEBMASTER_VID = "739898";

export function isCoreWebmasterVid(vid) {
  return String(vid || "") === CORE_WEBMASTER_VID;
}

const CORE_POSITIONS = new Set([
  "TH-TC",
  "TH-TAC",
  "TH-DIVISION TRAINING COORDINATOR",
  "TH-DIVISION TRAINING ASSISTANT COORDINATOR",
]);

export function hasCoreWebmasterAccess(session) {
  if (!session?.vid) return false;
  if (isCoreWebmasterVid(session.vid)) return true;
  if (!session.hasTrainingAccess) return false;

  return String(session.trainingStaffPosition || "")
    .split(",")
    .some((position) => CORE_POSITIONS.has(position.trim().replace(/\s+/g, " ").toUpperCase()));
}
