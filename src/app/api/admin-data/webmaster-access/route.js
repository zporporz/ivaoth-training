import { NextResponse } from "next/server";

import { errorResponse, isWebmaster } from "../../../../lib/serverDataAccess";
import { getRequestSession } from "../../../../lib/serverSession";

export async function GET(request) {
  try {
    const session = getRequestSession(request);
    if (!session?.vid) return errorResponse("Login required", 401);
    return NextResponse.json({
      ok: true,
      isWebmaster: await isWebmaster(session),
    });
  } catch (error) {
    console.error("Check webmaster access failed", error);
    return errorResponse("Unable to check webmaster access", 500);
  }
}
