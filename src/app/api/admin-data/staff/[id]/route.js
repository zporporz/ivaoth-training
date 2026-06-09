import { NextResponse } from "next/server";

import { getAdminDb } from "../../../../../lib/firebaseAdmin";
import {
  cleanBoolean,
  cleanNumber,
  cleanString,
  errorResponse,
  requireCoreWebmaster,
  withTimestamps,
} from "../../../../../lib/serverDataAccess";

function staffPayload(body) {
  return {
    order: cleanNumber(body.order),
    vid: cleanString(body.vid, 20),
    name: cleanString(body.name, 300),
    position: cleanString(body.position, 100),
    division: cleanString(body.division, 20) || "TH",
    avatarUrl: cleanString(body.avatarUrl),
    bio: cleanString(body.bio),
    active: cleanBoolean(body.active),
  };
}

export async function PATCH(request, { params }) {
  try {
    if (!requireCoreWebmaster(request)) return errorResponse("Access denied", 403);
    const { id } = await params;
    const data = staffPayload(await request.json());
    if (!data.vid || !data.name) return errorResponse("VID and name are required");
    await getAdminDb().collection("trainingStaff").doc(id).update(withTimestamps(data));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update training staff failed", error);
    return errorResponse("Unable to update training staff", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!requireCoreWebmaster(request)) return errorResponse("Access denied", 403);
    const { id } = await params;
    await getAdminDb().collection("trainingStaff").doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete training staff failed", error);
    return errorResponse("Unable to delete training staff", 500);
  }
}
