import { NextResponse } from "next/server";

import { getAdminDb } from "../../../../lib/firebaseAdmin";
import {
  cleanBoolean,
  cleanNumber,
  cleanString,
  errorResponse,
  requireCoreWebmaster,
  withTimestamps,
} from "../../../../lib/serverDataAccess";

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

export async function POST(request) {
  try {
    if (!requireCoreWebmaster(request)) return errorResponse("Access denied", 403);
    const data = staffPayload(await request.json());
    if (!data.vid || !data.name) return errorResponse("VID and name are required");

    const reference = await getAdminDb()
      .collection("trainingStaff")
      .add(withTimestamps(data, true));
    return NextResponse.json({ ok: true, id: reference.id });
  } catch (error) {
    console.error("Create training staff failed", error);
    return errorResponse("Unable to create training staff", 500);
  }
}
