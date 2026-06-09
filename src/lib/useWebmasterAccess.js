"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export const CORE_WEBMASTER_VID = "739898";

export function isCoreWebmasterVid(vid) {
  return String(vid || "") === CORE_WEBMASTER_VID;
}

export function useWebmasterAccess(session) {
  const [remoteAccess, setRemoteAccess] = useState({
    vid: "",
    isWebmaster: false,
    resolved: false,
  });
  const vid = String(session?.vid || "");
  const isCoreOwner = isCoreWebmasterVid(vid);

  useEffect(() => {
    if (!vid || isCoreOwner) return;

    const unsubscribe = onSnapshot(
      doc(db, "webmasters", vid),
      (snapshot) => {
        setRemoteAccess({
          vid,
          isWebmaster: snapshot.exists() && snapshot.data()?.active !== false,
          resolved: true,
        });
      },
      () => {
        setRemoteAccess({ vid, isWebmaster: false, resolved: true });
      }
    );

    return () => unsubscribe();
  }, [isCoreOwner, vid]);

  const hasResolvedRemoteAccess = remoteAccess.vid === vid && remoteAccess.resolved;

  return {
    isWebmaster:
      isCoreOwner ||
      (hasResolvedRemoteAccess && remoteAccess.isWebmaster),
    loading: Boolean(vid && !isCoreOwner && !hasResolvedRemoteAccess),
  };
}
