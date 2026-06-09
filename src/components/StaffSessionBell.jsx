"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";

function getTimestampValue(value) {
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  return 0;
}

function getCreatedTimestamp(session) {
  const created = getTimestampValue(session?.createdAt);
  if (created) return created;

  if (session?.date) {
    const cleanTime = String(session?.time || "0000").replace(/\D/g, "");
    const hour = cleanTime.slice(0, 2) || "00";
    const minute = cleanTime.slice(2, 4) || "00";
    const parsed = new Date(`${session.date}T${hour}:${minute}:00Z`).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function getUpdatedTimestamp(session) {
  return getTimestampValue(session?.updatedAt) || getCreatedTimestamp(session);
}

function storageKey(vid) {
  return `staff-session-bell-last-seen-${vid}`;
}

function noticeKey(vid) {
  return `staff-session-bell-notices-${vid}`;
}

export default function StaffSessionBell({ session }) {
  const [sessions, setSessions] = useState([]);
  const [lastSeen, setLastSeen] = useState(0);

  const vid = String(session?.vid || "");
  const enabled = Boolean(session?.hasTrainingAccess && vid);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const timeout = window.setTimeout(() => {
      setLastSeen(Number(localStorage.getItem(storageKey(vid)) || 0));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [enabled, vid]);

  useEffect(() => {
    if (!enabled) return;

    const q = query(collection(db, "trainingSessions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSessions(snapshot.docs.map((item) => ({ firestoreId: item.id, ...item.data() })));
    });

    return () => unsubscribe();
  }, [enabled]);

  const latestActivity = useMemo(() => {
    return sessions.reduce((latest, item) => Math.max(latest, getCreatedTimestamp(item), getUpdatedTimestamp(item)), 0);
  }, [sessions]);

  const newSessions = useMemo(() => {
    if (!lastSeen) return [];
    return sessions.filter((item) => getCreatedTimestamp(item) > lastSeen);
  }, [sessions, lastSeen]);

  const modifiedSessions = useMemo(() => {
    if (!lastSeen) return [];

    return sessions.filter((item) => {
      const created = getCreatedTimestamp(item);
      const updated = getUpdatedTimestamp(item);
      return created <= lastSeen && updated > lastSeen;
    });
  }, [sessions, lastSeen]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (!lastSeen && latestActivity) {
      localStorage.setItem(storageKey(vid), String(latestActivity));
      const timeout = window.setTimeout(() => setLastSeen(latestActivity), 0);
      return () => window.clearTimeout(timeout);
    }
  }, [enabled, latestActivity, lastSeen, vid]);

  if (!enabled) return null;

  function openNotices() {
    if (typeof window === "undefined") return;

    sessionStorage.setItem(
      noticeKey(vid),
      JSON.stringify({
        newIds: newSessions.map((item) => item.firestoreId),
        modifiedIds: modifiedSessions.map((item) => item.firestoreId),
      })
    );

    if (latestActivity) {
      localStorage.setItem(storageKey(vid), String(latestActivity));
      setLastSeen(latestActivity);
    }

    window.location.href = "/staff?notice=1";
  }

  const newCount = newSessions.length;
  const modifiedCount = modifiedSessions.length;
  const count = newCount + modifiedCount;
  const hasNew = newCount > 0;
  const hasModified = !hasNew && modifiedCount > 0;

  return (
    <button
      type="button"
      onClick={openNotices}
      title={
        hasNew
          ? `${newCount} new training session${newCount > 1 ? "s" : ""}`
          : hasModified
          ? `${modifiedCount} modified training session${modifiedCount > 1 ? "s" : ""}`
          : "No new or modified training sessions"
      }
      className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border font-black transition ${
        hasNew
          ? "border-[#ff5a1f] bg-[#fff3ed] text-[#ff5a1f] shadow-sm hover:-translate-y-0.5 hover:shadow-md"
          : hasModified
          ? "border-[#16a34a] bg-[#e3f7ea] text-[#16a34a] shadow-sm hover:-translate-y-0.5 hover:shadow-md"
          : "border-[#dddbd6] bg-white text-[#8b8a84] hover:bg-[#f3f3f1]"
      }`}
    >
      <Bell size={19} strokeWidth={2.8} />

      {count > 0 && (
        <span
          className={`absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black leading-none text-white shadow-sm ${
            hasNew ? "bg-[#ff5a1f]" : "bg-[#16a34a]"
          }`}
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
