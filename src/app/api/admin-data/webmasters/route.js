import { NextResponse } from "next/server";

import { getAdminDb } from "../../../../lib/firebaseAdmin";
import {
  cleanString,
  errorResponse,
  requireCoreWebmaster,
  withTimestamps,
} from "../../../../lib/serverDataAccess";

export async function GET(request) {
  try {
    if (!requireCoreWebmaster(request)) return errorResponse("Access denied", 403);
    const snapshot = await getAdminDb().collection("webmasters").orderBy("vid").get();
    const webmasters = snapshot.docs.map((item) => ({
      firestoreId: item.id,
      ...item.data(),
    }));
    return NextResponse.json({ ok: true, webmasters });
  } catch (error) {
    console.error("List webmasters failed", error);
    return errorResponse("Unable to list webmasters", 500);
  }
}

export async function POST(request) {
  try {
    const loginSession = requireCoreWebmaster(request);
    if (!loginSession) return errorResponse("Access denied", 403);

    const body = await request.json();
    const vid = cleanString(body.vid, 20).replace(/\D/g, "");
    const name = cleanString(body.name, 300);
    if (!vid || !name) return errorResponse("VID and name are required");

    await getAdminDb()
      .collection("webmasters")
      .doc(vid)
      .set(
        withTimestamps(
          {
            vid,
            name,
            note: cleanString(body.note),
            active: true,
            addedBy: String(loginSession.vid),
          },
          true,
        ),
      );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Create webmaster failed", error);
    return errorResponse("Unable to create webmaster", 500);
  }
}
