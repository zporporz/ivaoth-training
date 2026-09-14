"use client";

import { useEffect, useState } from "react";

import { hasCoreWebmasterAccess } from "./coreWebmasterAccess";
export { CORE_WEBMASTER_VID, isCoreWebmasterVid } from "./coreWebmasterAccess";

export function useWebmasterAccess(session) {
  const [remoteAccess, setRemoteAccess] = useState({
    vid: "",
    isWebmaster: false,
    resolved: false,
  });
  const vid = String(session?.vid || "");
  const isCoreOwner = hasCoreWebmasterAccess(session);

  useEffect(() => {
    if (!vid || isCoreOwner) return;

    const controller = new AbortController();
    fetch("/api/admin-data/webmaster-access", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to check webmaster access");
        return response.json();
      })
      .then((data) => {
        setRemoteAccess({
          vid,
          isWebmaster: data.isWebmaster === true,
          resolved: true,
        });
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setRemoteAccess({ vid, isWebmaster: false, resolved: true });
      });

    return () => controller.abort();
  }, [isCoreOwner, vid]);

  const hasResolvedRemoteAccess = remoteAccess.vid === vid && remoteAccess.resolved;

  return {
    isWebmaster:
      isCoreOwner ||
      (hasResolvedRemoteAccess && remoteAccess.isWebmaster),
    loading: Boolean(vid && !isCoreOwner && !hasResolvedRemoteAccess),
  };
}
