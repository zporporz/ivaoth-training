import { NextResponse } from "next/server";
import crypto from "crypto";

const IVAO_AUTHORIZE_URL = "https://sso.ivao.aero/authorize";

function getRedirectUri(request) {
  return (
    process.env.IVAO_REDIRECT_URI ||
    `${request.nextUrl.origin}/api/auth/callback/ivao`
  );
}

export async function GET(request) {
  const clientId = process.env.IVAO_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "Missing IVAO_CLIENT_ID environment variable" },
      { status: 500 }
    );
  }

  const state = crypto.randomBytes(24).toString("hex");
  const redirectUri = getRedirectUri(request);

  const authorizeUrl = new URL(IVAO_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "openid profile");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);

  response.cookies.set("ivao_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });

  return response;
}
