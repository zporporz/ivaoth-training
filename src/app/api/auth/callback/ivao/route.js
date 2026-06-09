import { NextResponse } from "next/server";
import { encodeSession } from "../../../../../lib/serverSession";

const IVAO_TOKEN_URL = "https://api.ivao.aero/v2/oauth/token";
const IVAO_USERINFO_URL = "https://api.ivao.aero/v2/users/me";

function getRedirectUri(request) {
  return (
    process.env.IVAO_REDIRECT_URI ||
    `${request.nextUrl.origin}/api/auth/callback/ivao`
  );
}

function cleanName(value) {
  if (!value) return "";
  return String(value).replace(/\s*\(?\d{4,}\)?\s*$/g, "").trim();
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function getFullName(user) {
  const firstName = pickFirst(
    user.firstName,
    user.first_name,
    user.firstname,
    user.firstNames,
    user.first_names,
    user.firstnames,
    user.givenName,
    user.given_name,
    user.profile?.firstName,
    user.profile?.first_name,
    user.personal?.firstName,
    user.personal?.first_name
  );

  const lastName = pickFirst(
    user.lastName,
    user.last_name,
    user.lastname,
    user.surname,
    user.familyName,
    user.family_name,
    user.profile?.lastName,
    user.profile?.last_name,
    user.personal?.lastName,
    user.personal?.last_name
  );

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return (
    cleanName(fullName) ||
    cleanName(user.fullName) ||
    cleanName(user.full_name) ||
    cleanName(user.realName) ||
    cleanName(user.real_name) ||
    cleanName(user.name) ||
    cleanName(user.profile?.fullName) ||
    cleanName(user.profile?.full_name) ||
    cleanName(user.publicNickname) ||
    `VID ${user.id}`
  );
}

function getStaffPositionName(position) {
  const staffPosition = position?.staffPosition || position?.staff_position || position;
  const departmentTeam =
    staffPosition?.departmentTeam ||
    staffPosition?.department_team ||
    position?.departmentTeam ||
    position?.department_team;
  const division = position?.division || position?.divisionStaffPosition?.division;

  const code = pickFirst(
    staffPosition?.shortName,
    staffPosition?.short_name,
    staffPosition?.name,
    staffPosition?.id,
    staffPosition?.code,
    position?.shortName,
    position?.short_name,
    position?.name,
    position?.id,
    position?.code
  );

  const divisionId = pickFirst(
    division?.id,
    division?.code,
    position?.divisionId,
    position?.division_id
  );

  if (code && divisionId && !String(code).includes(String(divisionId))) {
    return `${divisionId}-${code}`;
  }

  return code || null;
}

function isTrainingStaffPosition(position) {
  const staffPosition = position?.staffPosition || position?.staff_position || position;
  const departmentTeam =
    staffPosition?.departmentTeam ||
    staffPosition?.department_team ||
    position?.departmentTeam ||
    position?.department_team;
  const department = departmentTeam?.department || position?.department;
  const departmentId = String(department?.id || department?.code || "").toUpperCase();
  const teamName = String(departmentTeam?.name || departmentTeam?.id || "").toUpperCase();
  const positionName = String(getStaffPositionName(position) || "").toUpperCase();

  return (
    departmentId === "TRA" ||
    departmentId.includes("TRAIN") ||
    teamName.includes("TRAIN") ||
    positionName.includes("TRAIN") ||
    positionName.includes("TH-T") ||
    positionName.includes("TRA")
  );
}

export async function GET(request) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const savedState = request.cookies.get("ivao_oauth_state")?.value;

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL("/?login=failed", request.nextUrl.origin));
  }

  const clientId = process.env.IVAO_CLIENT_ID;
  const clientSecret = process.env.IVAO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Missing IVAO OAuth environment variables" },
      { status: 500 }
    );
  }

  const tokenResponse = await fetch(IVAO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(request),
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(new URL("/?login=token_failed", request.nextUrl.origin));
  }

  const tokenData = await tokenResponse.json();

  const userResponse = await fetch(IVAO_USERINFO_URL, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  if (!userResponse.ok) {
    return NextResponse.redirect(new URL("/?login=user_failed", request.nextUrl.origin));
  }

  const user = await userResponse.json();

  const allStaffPositions = user.userStaffPositions || [];
  const trainingStaffPositions = allStaffPositions.filter(isTrainingStaffPosition);
  const visibleStaffPositions = trainingStaffPositions.length
    ? trainingStaffPositions
    : allStaffPositions;

  const trainingStaffPosition =
    visibleStaffPositions.map(getStaffPositionName).filter(Boolean).join(", ") || null;

  const hasTrainingAccess = trainingStaffPositions.length > 0;
  const displayName = getFullName(user);

  const session = {
    id: user.id,
    vid: String(user.id),
    name: displayName,
    displayName,
    publicNickname: user.publicNickname || null,
    divisionId: user.divisionId || user.division?.id || null,
    countryId: user.countryId || user.country?.id || null,
    atcRating: user.rating?.atcRating?.shortName || null,
    pilotRating: user.rating?.pilotRating?.shortName || null,
    isStaff: Boolean(user.isStaff || allStaffPositions.length),
    hasTrainingAccess,
    trainingStaffPosition,
    createdAt: new Date().toISOString(),
  };

  const response = NextResponse.redirect(new URL("/", request.nextUrl.origin));

  response.cookies.delete("ivao_oauth_state");
  response.cookies.set("ivao_session", encodeSession(session), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}

