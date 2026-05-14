export function decodeSession(value) {
  try {
    return JSON.parse(atob(value.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export function getCookie(name) {
  if (typeof document === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }

  return null;
}

export function getClientSession() {
  const cookie = getCookie("ivao_session");
  return cookie ? decodeSession(cookie) : null;
}
