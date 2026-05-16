"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export const CORE_WEBMASTER_VID = "739898";

export function isCoreWebmasterVid(vid) {
  return String(vid || "") === CORE_WEBMASTER_VID;
}

export function useWebmasterAccess(session) {
  const [isWebmaster, setIsWebmaster] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const vid = String(session?.vid || "");

    if (!vid) {
      setIsWebmaster(false);
      setLoading(false);
      return;
    }

    if (isCoreWebmasterVid(vid)) {
      setIsWebmaster(true);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "webmasters", vid),
      (snapshot) => {
        setIsWebmaster(snapshot.exists() && snapshot.data()?.active !== false);
        setLoading(false);
      },
      () => {
        setIsWebmaster(false);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [session?.vid]);

  return { isWebmaster, loading };
}
