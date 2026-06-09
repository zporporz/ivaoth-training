import { NextResponse } from "next/server";

import { getAdminDb } from "../../../../lib/firebaseAdmin";
import {
  cleanBoolean,
  cleanNumber,
  cleanString,
  errorResponse,
  requireTrainingStaff,
  withTimestamps,
} from "../../../../lib/serverDataAccess";

export async function POST(request) {
  try {
    if (!requireTrainingStaff(request)) return errorResponse("Access denied", 403);
    const body = await request.json();
    const data = {
      title: cleanString(body.title, 300),
      description: cleanString(body.description),
      type: cleanString(body.type, 30),
      url: cleanString(body.url),
      thumbnailUrl: cleanString(body.thumbnailUrl),
      order: cleanNumber(body.order),
      active: cleanBoolean(body.active),
    };
    if (!data.title || !data.url) return errorResponse("Title and URL are required");

    const reference = await getAdminDb()
      .collection("trainingDocs")
      .add(withTimestamps(data, true));
    return NextResponse.json({ ok: true, id: reference.id });
  } catch (error) {
    console.error("Create training doc failed", error);
    return errorResponse("Unable to create training doc", 500);
  }
}
