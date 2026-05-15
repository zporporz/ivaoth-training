import { NextResponse } from "next/server";

const IVAO_TOKEN_URL = "https://api.ivao.aero/v2/oauth/token";
const IVAO_USERINFO_URL = "https://api.ivao.aero/v2/users/me";

function getRedirectUri(request) {
  return (
    process.env.IVAO_REDIRECT_URI ||
    `${request.nextUrl.origin}/api/auth/callback/ivao`
  );
}

function encodeSession(data) {
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

function cleanName(value) {
  if (!value) return "";
  return String(value).replace(/\s*\(?\d{4,}\)?\s*$/g, "").trim();
}

function getFullName(user) {
  const firstName = user.firstName || user.first_name || user.firstname;
  const lastName = user.lastName || user.last_name || user.lastname;
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return (
    cleanName(fullName) ||
    cleanName(user.name) ||
    cleanName(user.fullName) ||
    cleanName(user.publicNickname) ||
    `VID ${user.id}`
  );
}

function getStaffPositionName(position) {
  const staffPosition = position?.staffPosition || position;

  return (
    staffPosition?.shortName ||
    staffPosition?.name ||
    staffPosition?.id ||
    position?.shortName ||
    position?.name ||
    null
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

  const trainingStaffPositions =
    user.userStaffPositions?.filter(
      (position) =>
        position?.staffPosition?.departmentTeam?.department?.id === "TRA"
    ) || [];

  const trainingStaffPosition =
    trainingStaffPositions.map(getStaffPositionName).filter(Boolean).join(", ") || null;

  const hasTrainingAccess = trainingStaffPositions.length > 0;
  const displayName = getFullName(user);

  const session = {
    id: user.id,
    vid: String(user.id),
    name: displayName,
    displayName,
    publicNickname: user.publicNickname || null,
    divisionId: user.divisionId || null,
    countryId: user.countryId || null,
    atcRating: user.rating?.atcRating?.shortName || null,
    pilotRating: user.rating?.pilotRating?.shortName || null,
    isStaff: Boolean(user.isStaff),
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
