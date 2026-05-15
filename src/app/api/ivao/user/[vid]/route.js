import { NextResponse } from "next/server";

const IVAO_USER_URL = "https://api.ivao.aero/v2/users";

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
    null
  );
}

export async function GET(_request, { params }) {
  const { vid } = await params;
  const cleanVid = String(vid || "").replace(/\D/g, "");

  if (!cleanVid) {
    return NextResponse.json({ error: "Missing VID" }, { status: 400 });
  }

  const response = await fetch(`${IVAO_USER_URL}/${cleanVid}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "User not found" }, { status: response.status });
  }

  const user = await response.json();
  const name = getFullName(user);

  if (!name) {
    return NextResponse.json({ error: "User name not available" }, { status: 404 });
  }

  return NextResponse.json({
    vid: cleanVid,
    name,
  });
}
