import crypto from "crypto";

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getSessionSecret() {
  return process.env.SESSION_SECRET || process.env.IVAO_CLIENT_SECRET || "";
}

function sign(payload) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Missing SESSION_SECRET or IVAO_CLIENT_SECRET");

  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function encodeSession(session) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token) {
  try {
    const [payload, signature] = String(token || "").split(".");
    if (!payload || !signature) return null;

    const expected = Buffer.from(sign(payload));
    const actual = Buffer.from(signature);
    if (
      expected.length !== actual.length ||
      !crypto.timingSafeEqual(expected, actual)
    ) {
      return null;
    }

    const session = JSON.parse(Buffer.from(payload, "base64url").toString());
    const createdAt = new Date(session.createdAt).getTime();
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > SESSION_MAX_AGE_MS) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function getRequestSession(request) {
  return verifySessionToken(request.cookies.get("ivao_session")?.value);
}
