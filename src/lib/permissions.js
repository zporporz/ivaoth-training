import { isCoreWebmasterVid } from "./useWebmasterAccess";

function vidOf(user) {
  return String(user?.vid || "");
}

export function isTrainingStaff(user) {
  return Boolean(user?.hasTrainingAccess);
}

export function isCoreOwner(user) {
  return isCoreWebmasterVid(vidOf(user));
}

export function isWebmasterUser(user, isWebmaster = false) {
  return isCoreOwner(user) || Boolean(isWebmaster);
}

export function canUseStaffConsole(user) {
  return isTrainingStaff(user);
}

export function canManageDocs(user) {
  return isTrainingStaff(user);
}

export function canManageStaffList(user, isWebmaster = false) {
  return isWebmasterUser(user, isWebmaster);
}

export function canManageWebmasters(user) {
  return isCoreOwner(user);
}

export function canManualAddTraining(user, isWebmaster = false) {
  return isWebmasterUser(user, isWebmaster);
}

export function canCreateSession(user) {
  return isTrainingStaff(user);
}

export function canClaimLegacySession(user, session) {
  return isTrainingStaff(user) && !session?.trainerVid;
}

export function canEditSession(user, session, isWebmaster = false) {
  if (!user?.vid || !session) return false;
  return isWebmasterUser(user, isWebmaster) || String(session.trainerVid || "") === vidOf(user);
}

export const canDeleteSession = canEditSession;
