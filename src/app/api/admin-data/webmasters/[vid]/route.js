import { NextResponse } from "next/server";

import { getAdminDb } from "../../../../../lib/firebaseAdmin";
import {
  CORE_WEBMASTER_VID,
  errorResponse,
  requireCoreWebmaster,
} from "../../../../../lib/serverDataAccess";

export async function DELETE(request, { params }) {
  try {
    if (!requireCoreWebmaster(request)) return errorResponse("Access denied", 403);
    const { vid } = await params;
    if (String(vid) === CORE_WEBMASTER_VID) {
      return errorResponse("Core webmaster cannot be removed", 400);
    }
    await getAdminDb().collection("webmasters").doc(String(vid)).delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete webmaster failed", error);
    return errorResponse("Unable to delete webmaster", 500);
  }
}
