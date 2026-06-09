import { NextResponse } from "next/server";
import { getRequestSession } from "../../../../../lib/serverSession";

const IVAO_TOKEN_URL = "https://api.ivao.aero/v2/oauth/token";
const IVAO_USER_URL = "https://api.ivao.aero/v2/users";

function cleanName(value) {
  if (!value) return "";
  return String(value).replace(/\s*\(?\d{4,}\)?\s*$/g, "").trim();
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function isGenericName(value, vid) {
  const name = cleanName(value).toLowerCase();
  const cleanVid = String(vid || "").toLowerCase();

  return (
    !name ||
    name === "user" ||
    name === "ivao user" ||
    name === "unknown" ||
    name === "unknown user" ||
    name === cleanVid ||
    name === `vid ${cleanVid}`
  );
}

function getFullName(user, vid) {
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

  const candidates = [
    [firstName, lastName].filter(Boolean).join(" ").trim(),
    user.fullName,
    user.full_name,
    user.realName,
    user.real_name,
    user.name,
    user.profile?.fullName,
    user.profile?.full_name,
    user.publicNickname,
    user.username,
  ];

  return candidates.map(cleanName).find((name) => !isGenericName(name, vid)) || null;
}

async function getClientCredentialsToken() {
  const clientId = process.env.IVAO_CLIENT_ID;
  const clientSecret = process.env.IVAO_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const response = await fetch(IVAO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: "no-store",
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.access_token || null;
}

async function fetchJson(url, token) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  return response.json();
}

function normalizeUserPayload(payload) {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload[0] || null;
  if (Array.isArray(payload.data)) return payload.data[0] || null;
  return payload.data || payload.user || payload;
}

export async function GET(request, { params }) {
  const loginSession = getRequestSession(request);
  if (!loginSession?.hasTrainingAccess) {
    return NextResponse.json(
      { error: "Training staff access required" },
      { status: 403 },
    );
  }

  const { vid } = await params;
  const cleanVid = String(vid || "").replace(/\D/g, "");

  if (!cleanVid) {
    return NextResponse.json({ error: "Missing VID" }, { status: 400 });
  }

  const token = await getClientCredentialsToken();
  const urls = [
    `${IVAO_USER_URL}/${cleanVid}`,
    `${IVAO_USER_URL}?id=${cleanVid}`,
    `${IVAO_USER_URL}?vid=${cleanVid}`,
  ];

  for (const url of urls) {
    const payload = await fetchJson(url, token);
    const user = normalizeUserPayload(payload);
    const name = getFullName(user || {}, cleanVid);

    if (name) {
      return NextResponse.json({
        vid: cleanVid,
        name,
      });
    }
  }

  return NextResponse.json(
    { error: "User name is not available from IVAO API" },
    { status: 404 }
  );
}
