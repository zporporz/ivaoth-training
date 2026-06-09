import { useMemo, useSyncExternalStore } from "react";

export function decodeSession(value) {
  try {
    const [payload, signature] = value.split(".");
    if (!payload || !signature) return null;

    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
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

function subscribeSession() {
  return () => {};
}

function getSessionSnapshot() {
  return getCookie("ivao_session") || "";
}

export function useClientSession() {
  const cookie = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    () => "",
  );

  return useMemo(() => (cookie ? decodeSession(cookie) : null), [cookie]);
}

export function useClientReady() {
  return useSyncExternalStore(subscribeSession, () => true, () => false);
}
