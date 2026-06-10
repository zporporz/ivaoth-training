import { NextResponse } from "next/server";

import { getAdminDb } from "../../../../../lib/firebaseAdmin";
import {
  cleanString,
  errorResponse,
  isWebmaster,
  requireTrainingStaff,
  withTimestamps,
} from "../../../../../lib/serverDataAccess";

async function ownedSession(request, id) {
  const loginSession = requireTrainingStaff(request);
  if (!loginSession) return {};

  const reference = getAdminDb().collection("trainingSessions").doc(id);
  const snapshot = await reference.get();
  if (!snapshot.exists) return { loginSession, reference, missing: true };

  const data = snapshot.data();
  const allowed =
    String(data.trainerVid || "") === String(loginSession.vid) ||
    (await isWebmaster(loginSession));

  return { loginSession, reference, data, allowed };
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const access = await ownedSession(request, id);
    if (!access.loginSession) return errorResponse("Access denied", 403);
    if (access.missing) return errorResponse("Training session not found", 404);

    const body = await request.json();

    if (body.action === "claim") {
      if (access.data.trainerVid) return errorResponse("Session is already claimed", 409);

      await access.reference.update(
        withTimestamps({
          trainerName: cleanString(
            access.loginSession.displayName || access.loginSession.name,
            200,
          ),
          trainerVid: String(access.loginSession.vid),
          trainerStaffPosition: cleanString(
            access.loginSession.trainingStaffPosition,
            200,
          ),
        }),
      );
      return NextResponse.json({ ok: true });
    }

    if (!access.allowed) return errorResponse("Access denied", 403);

    const type = cleanString(body.type, 100);
    const update = {
      date: cleanString(body.date, 10),
      time: cleanString(body.time, 10),
      program: cleanString(body.program, 30),
      type,
      topic: cleanString(body.topic),
      remarks: cleanString(body.remarks),
      position: cleanString(body.position, 50).toUpperCase(),
      traineeName: cleanString(body.traineeName, 200),
      traineeVid: cleanString(body.traineeVid, 20),
      status: type.includes("Exam")
        ? "Exam"
        : type.includes("Official")
          ? "Official"
          : "Scheduled",
    };

    if (
      !update.date ||
      !/^([01]\d|2[0-3])[0-5]\dZ$/.test(update.time) ||
      !update.position ||
      !update.topic
    ) {
      return errorResponse("Missing required training session fields");
    }

    await access.reference.update(withTimestamps(update));
    return NextResponse.json({
      ok: true,
      session: { ...access.data, ...update },
    });
  } catch (error) {
    console.error("Update training session failed", error);
    return errorResponse("Unable to update training session", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const access = await ownedSession(request, id);
    if (!access.loginSession) return errorResponse("Access denied", 403);
    if (access.missing) return errorResponse("Training session not found", 404);
    if (!access.allowed) return errorResponse("Access denied", 403);

    await access.reference.delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete training session failed", error);
    return errorResponse("Unable to delete training session", 500);
  }
}
