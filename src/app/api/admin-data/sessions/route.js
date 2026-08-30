import { NextResponse } from "next/server";

import { getAdminDb } from "../../../../lib/firebaseAdmin";
import {
  cleanString,
  errorResponse,
  requireCoreWebmaster,
  requireTrainingStaff,
  withTimestamps,
} from "../../../../lib/serverDataAccess";
import {
  findPracticalSessionConflict,
  practicalConflictMessage,
} from "../../../../lib/trainingSessionConflicts";

function sessionPayload(body) {
  const type = cleanString(body.type, 100);
  return {
    date: cleanString(body.date, 10),
    time: cleanString(body.time, 10),
    program: cleanString(body.program, 30),
    type,
    topic: cleanString(body.topic),
    remarks: cleanString(body.remarks),
    position: cleanString(body.position, 50).toUpperCase(),
    traineeName: cleanString(body.traineeName, 200),
    traineeVid: cleanString(body.traineeVid, 20),
    trainerName: cleanString(body.trainerName, 200),
    trainerVid: cleanString(body.trainerVid, 20),
    trainerStaffPosition: cleanString(body.trainerStaffPosition, 200),
    status: type.includes("Exam")
      ? "Exam"
      : type.includes("Official")
        ? "Official"
        : "Scheduled",
  };
}

function hasRequiredFields(data) {
  return Boolean(
    data.date &&
      /^([01]\d|2[0-3])[0-5]\dZ$/.test(data.time) &&
      data.position &&
      data.traineeName &&
      data.traineeVid &&
      data.trainerName &&
      data.trainerVid &&
      data.topic,
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    const manual = body?.manual === true;
    const loginSession = manual
      ? requireCoreWebmaster(request)
      : requireTrainingStaff(request);

    if (!loginSession) return errorResponse("Access denied", 403);

    const data = sessionPayload(
      manual
        ? body
        : {
            ...body,
            trainerName: loginSession.displayName || loginSession.name,
            trainerVid: loginSession.vid,
            trainerStaffPosition: loginSession.trainingStaffPosition,
          },
    );

    if (!hasRequiredFields(data)) {
      return errorResponse("Missing required training session fields");
    }

    if (manual) data.createdByWebmaster = String(loginSession.vid);

    const db = getAdminDb();
    const reference = db.collection("trainingSessions").doc();

    const conflict = await findPracticalSessionConflict(db, data);
    if (conflict) {
      return errorResponse(practicalConflictMessage(conflict), 409);
    }

    await reference.set(withTimestamps(data, true));

    return NextResponse.json({ ok: true, id: reference.id, session: data });
  } catch (error) {
    console.error("Create training session failed", error);
    return errorResponse("Unable to create training session", 500);
  }
}
