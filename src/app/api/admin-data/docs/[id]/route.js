import { NextResponse } from "next/server";

import { getAdminDb } from "../../../../../lib/firebaseAdmin";
import {
  cleanBoolean,
  cleanNumber,
  cleanString,
  errorResponse,
  requireTrainingStaff,
  withTimestamps,
} from "../../../../../lib/serverDataAccess";

function payload(body) {
  return {
    title: cleanString(body.title, 300),
    description: cleanString(body.description),
    type: cleanString(body.type, 30),
    url: cleanString(body.url),
    thumbnailUrl: cleanString(body.thumbnailUrl),
    order: cleanNumber(body.order),
    active: cleanBoolean(body.active),
  };
}

export async function PATCH(request, { params }) {
  try {
    if (!requireTrainingStaff(request)) return errorResponse("Access denied", 403);
    const { id } = await params;
    const data = payload(await request.json());
    if (!data.title || !data.url) return errorResponse("Title and URL are required");
    await getAdminDb().collection("trainingDocs").doc(id).update(withTimestamps(data));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update training doc failed", error);
    return errorResponse("Unable to update training doc", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!requireTrainingStaff(request)) return errorResponse("Access denied", 403);
    const { id } = await params;
    await getAdminDb().collection("trainingDocs").doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete training doc failed", error);
    return errorResponse("Unable to delete training doc", 500);
  }
}
