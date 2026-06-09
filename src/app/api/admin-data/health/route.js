import { NextResponse } from "next/server";

import { getAdminDb } from "../../../../lib/firebaseAdmin";

function errorCode(error) {
  const message = String(error?.message || "").toLowerCase();

  if (message.includes("private key") || message.includes("pem")) {
    return "invalid-private-key";
  }
  if (message.includes("invalid_grant") || message.includes("credential")) {
    return "invalid-credentials";
  }
  if (message.includes("permission") || error?.code === 7) {
    return "service-account-permission";
  }
  if (message.includes("project") || message.includes("database")) {
    return "invalid-project";
  }
  return "firestore-unavailable";
}

export async function GET() {
  try {
    await getAdminDb().collection("trainingSessions").limit(1).get();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Firestore server health check failed", error);
    return NextResponse.json(
      { ok: false, error: errorCode(error) },
      { status: 503 },
    );
  }
}
