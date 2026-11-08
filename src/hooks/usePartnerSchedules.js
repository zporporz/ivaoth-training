"use client";

import { useEffect, useMemo, useState } from "react";
import { mergePartnerSchedules } from "../lib/mergePartnerSchedules";

export default function usePartnerSchedules(localSessions) {
  const [partnerSessions, setPartnerSessions] = useState([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    async function refresh() {
      if (pending || controller.signal.aborted) return;
      pending = true;
      try {
        const response = await fetch("/api/partner-schedules", { signal: controller.signal });
        if (!response.ok) throw new Error("Partner schedules unavailable");
        const data = await response.json();
        if (!Array.isArray(data.sessions)) throw new Error("Invalid partner schedules");
        setPartnerSessions(data.sessions);
        setError(false);
      } catch (failure) {
        if (failure.name !== "AbortError") setError(true);
      } finally {
        pending = false;
      }
    }
    refresh();
    const timer = setInterval(refresh, 300000);
    window.addEventListener("focus", refresh);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  const sessions = useMemo(() => mergePartnerSchedules(localSessions, partnerSessions), [localSessions, partnerSessions]);
  return { sessions, partnerError: error };
}
