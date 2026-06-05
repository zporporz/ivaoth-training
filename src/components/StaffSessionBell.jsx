"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";

function getSessionTimestamp(session) {
  const value = session?.createdAt || session?.updatedAt;

  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;

  if (session?.date) {
    const cleanTime = String(session?.time || "0000").replace(/\D/g, "");
    const hour = cleanTime.slice(0, 2) || "00";
    const minute = cleanTime.slice(2, 4) || "00";
    const parsed = new Date(`${session.date}T${hour}:${minute}:00Z`).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function storageKey(vid) {
  return `staff-session-bell-last-seen-${vid}`;
}

function newIdsKey(vid) {
  return `staff-session-bell-new-ids-${vid}`;
}

export default function StaffSessionBell({ session }) {
  const [sessions, setSessions] = useState([]);
  const [lastSeen, setLastSeen] = useState(0);

  const vid = String(session?.vid || "");
  const enabled = Boolean(session?.hasTrainingAccess && vid);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    setLastSeen(Number(localStorage.getItem(storageKey(vid)) || 0));
  }, [enabled, vid]);

  useEffect(() => {
    if (!enabled) return;

    const q = query(collection(db, "trainingSessions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSessions(snapshot.docs.map((item) => ({ firestoreId: item.id, ...item.data() })));
    });

    return () => unsubscribe();
  }, [enabled]);

  const latestTimestamp = useMemo(() => {
    return sessions.reduce((latest, item) => Math.max(latest, getSessionTimestamp(item)), 0);
  }, [sessions]);

  const newSessions = useMemo(() => {
    if (!lastSeen) return [];
    return sessions.filter((item) => getSessionTimestamp(item) > lastSeen);
  }, [sessions, lastSeen]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (!lastSeen && latestTimestamp) {
      localStorage.setItem(storageKey(vid), String(latestTimestamp));
      setLastSeen(latestTimestamp);
    }
  }, [enabled, latestTimestamp, lastSeen, vid]);

  if (!enabled) return null;

  function openNewSessions() {
    if (typeof window === "undefined") return;

    const ids = newSessions.map((item) => item.firestoreId);
    sessionStorage.setItem(newIdsKey(vid), JSON.stringify(ids));

    if (latestTimestamp) {
      localStorage.setItem(storageKey(vid), String(latestTimestamp));
      setLastSeen(latestTimestamp);
    }

    window.location.href = "/staff?new=1";
  }

  const count = newSessions.length;

  return (
    <button
      type="button"
      onClick={openNewSessions}
      title={count ? `${count} new training session${count > 1 ? "s" : ""}` : "No new training sessions"}
      className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border font-black transition ${
        count
          ? "border-[#ff5a1f] bg-[#fff3ed] text-[#ff5a1f] shadow-sm hover:-translate-y-0.5 hover:shadow-md"
          : "border-[#dddbd6] bg-white text-[#8b8a84] hover:bg-[#f3f3f1]"
      }`}
    >
      <Bell size={19} strokeWidth={2.8} />

      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#ff5a1f] px-1.5 text-[10px] font-black leading-none text-white shadow-sm">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
