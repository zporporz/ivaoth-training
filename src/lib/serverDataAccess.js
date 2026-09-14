import { FieldValue } from "@google-cloud/firestore";
import { NextResponse } from "next/server";

import { getAdminDb } from "./firebaseAdmin";
import { getRequestSession } from "./serverSession";

import { hasCoreWebmasterAccess } from "./coreWebmasterAccess";
export { CORE_WEBMASTER_VID } from "./coreWebmasterAccess";

export function errorResponse(message, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function requireTrainingStaff(request) {
  const session = getRequestSession(request);
  return session?.hasTrainingAccess ? session : null;
}

export function requireCoreWebmaster(request) {
  const session = getRequestSession(request);
  return hasCoreWebmasterAccess(session) ? session : null;
}

export async function isWebmaster(session) {
  const vid = String(session?.vid || "");
  if (!vid) return false;
  if (hasCoreWebmasterAccess(session)) return true;

  const snapshot = await getAdminDb().collection("webmasters").doc(vid).get();
  return snapshot.exists && snapshot.data()?.active !== false;
}

export function withTimestamps(payload, creating = false) {
  const data = {
    ...payload,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (creating) data.createdAt = FieldValue.serverTimestamp();
  return data;
}

export function cleanString(value, maxLength = 2000) {
  return String(value || "").trim().slice(0, maxLength);
}

export function cleanBoolean(value) {
  return value !== false;
}

export function cleanNumber(value, fallback = 9999) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
