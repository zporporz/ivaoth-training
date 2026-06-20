"use client";

import { useEffect, useRef, useState } from "react";
import Card from "./ui/Card";
import SessionDetailModal from "./SessionDetailModal";
import LoginRequiredModal from "./LoginRequiredModal";
import { getClientSession } from "../lib/authSession";

const monthNames = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const bangkokFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getBangkokParts() {
  const parts = bangkokFormatter.formatToParts(new Date());

  return {
    year: parts.find((part) => part.type === "year")?.value,
    month: parts.find((part) => part.type === "month")?.value,
    day: parts.find((part) => part.type === "day")?.value,
  };
}

function getBangkokTodayKey() {
  const { year, month, day } = getBangkokParts();
  return `${year}-${month}-${day}`;
}

function getBangkokNowDate() {
  const { year, month, day } = getBangkokParts();
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
}

function millisecondsUntilNextBangkokDay(now = Date.now()) {
  const dayMs = 24 * 60 * 60 * 1000;
  const bangkokOffsetMs = 7 * 60 * 60 * 1000;
  const bangkokNow = now + bangkokOffsetMs;
  const nextDay = (Math.floor(bangkokNow / dayMs) + 1) * dayMs;

  return nextDay - bangkokNow + 1000;
}

function cursorFromDateKey(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey || "")) return getBangkokNowDate();

  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function isValidDateKey(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey || "")) return false;

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function isSameMonth(date, dateKey) {
  if (!isValidDateKey(dateKey)) return false;

  const [year, month] = dateKey.split("-").map(Number);
  return date.getFullYear() === year && date.getMonth() === month - 1;
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildMonthGrid(cursor) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const firstDay = new Date(year, month, 1, 12, 0, 0);
  const start = new Date(firstDay);
  start.setDate(1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    return {
      date,
      key: toDateKey(date),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
    };
  });
}

function SessionChip({ session, programs, onClick }) {
  const program = programs.find((p) => p.code === session.program);

  const isExam = session.status === "Exam";
  const isOfficial = session.status === "Official";
  const isUnofficial = session.type?.includes("Unofficial");

  return (
    <button
      onClick={() => onClick(session)}
      className={`max-w-full cursor-pointer overflow-hidden rounded-md px-2 py-1 text-left text-[10px] font-black transition hover:-translate-y-0.5 hover:shadow-md ${
        isExam
          ? "border border-red-500 bg-red-50 shadow-sm"
          : isOfficial
          ? "border border-sky-500 bg-sky-50 shadow-sm"
          : isUnofficial
          ? "border border-zinc-300 bg-zinc-50"
          : "border border-[#dddbd6] bg-[#fbfbfa]"
      }`}
      style={{
        borderLeft: `4px solid ${isExam ? "#dc2626" : program?.color}`,
      }}
    >
      {(isExam || isOfficial || isUnofficial) && (
        <div className="mb-1">
          {isExam && (
            <span className="rounded bg-red-600 px-1.5 py-0.5 text-[8px] text-white">
              EXAM
            </span>
          )}

          {isOfficial && (
            <span className="rounded bg-sky-600 px-1.5 py-0.5 text-[8px] text-white">
              OFFICIAL
            </span>
          )}

          {isUnofficial && (
            <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-[8px] text-white">
              UNOFF
            </span>
          )}
        </div>
      )}

      <div className="truncate">
        <span>{session.time}</span>{" "}
        <span style={{ color: isExam ? "#dc2626" : program?.color }}>
          {session.program}
        </span>
      </div>

      <div className="truncate text-[9px] font-bold text-[#8b8a84]">
        {session.position}
      </div>
    </button>
  );
}

export default function TrainingCalendar({ sessions, programs }) {
  const [cursor, setCursor] = useState(() => getBangkokNowDate());
  const [todayKey, setTodayKey] = useState(() => getBangkokTodayKey());
  const todayKeyRef = useRef(todayKey);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    let ignore = false;
    let midnightTimeout;

    function applyTodayKey(nextTodayKey) {
      if (ignore || !isValidDateKey(nextTodayKey)) return;

      const previousTodayKey = todayKeyRef.current;

      setCursor((previousCursor) => {
        const isViewingTodayMonth = isSameMonth(
          previousCursor,
          previousTodayKey,
        );

        return isViewingTodayMonth
          ? cursorFromDateKey(nextTodayKey)
          : previousCursor;
      });
      todayKeyRef.current = nextTodayKey;
      setTodayKey(nextTodayKey);
    }

    function syncTodayFromClient() {
      applyTodayKey(getBangkokTodayKey());
    }

    async function syncTodayFromServer() {
      syncTodayFromClient();

      try {
        const response = await fetch("/api/time/today", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load the current date");

        const data = await response.json();
        applyTodayKey(data?.todayKey);
      } catch {
        applyTodayKey(getBangkokTodayKey());
      }
    }

    function syncWhenVisible() {
      if (document.visibilityState === "visible") syncTodayFromServer();
    }

    function scheduleMidnightSync() {
      window.clearTimeout(midnightTimeout);
      midnightTimeout = window.setTimeout(() => {
        syncTodayFromServer();
        scheduleMidnightSync();
      }, millisecondsUntilNextBangkokDay());
    }

    syncTodayFromServer();
    scheduleMidnightSync();

    const interval = window.setInterval(syncTodayFromClient, 30 * 1000);
    window.addEventListener("focus", syncTodayFromServer);
    window.addEventListener("pageshow", syncTodayFromServer);
    window.addEventListener("online", syncTodayFromServer);
    window.addEventListener("pointerdown", syncTodayFromClient);
    document.addEventListener("visibilitychange", syncWhenVisible);

    return () => {
      ignore = true;
      window.clearInterval(interval);
      window.clearTimeout(midnightTimeout);
      window.removeEventListener("focus", syncTodayFromServer);
      window.removeEventListener("pageshow", syncTodayFromServer);
      window.removeEventListener("online", syncTodayFromServer);
      window.removeEventListener("pointerdown", syncTodayFromClient);
      document.removeEventListener("visibilitychange", syncWhenVisible);
    };
  }, []);

  const grid = buildMonthGrid(cursor);

  function handleSessionClick(session) {
    const loginSession = getClientSession();

    if (!loginSession) {
      setShowLoginModal(true);
      return;
    }

    setSelectedSession(session);
  }

  function moveMonth(step) {
    setCursor((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + step);
      return next;
    });
  }

  async function goToday() {
    try {
      const response = await fetch("/api/time/today", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load the current date");

      const data = await response.json();
      const nextTodayKey = isValidDateKey(data?.todayKey)
        ? data.todayKey
        : getBangkokTodayKey();

      todayKeyRef.current = nextTodayKey;
      setTodayKey(nextTodayKey);
      setCursor(cursorFromDateKey(nextTodayKey));
    } catch {
      const fallbackTodayKey = getBangkokTodayKey();
      todayKeyRef.current = fallbackTodayKey;
      setTodayKey(fallbackTodayKey);
      setCursor(cursorFromDateKey(fallbackTodayKey));
    }
  }

  const monthLabel = `${monthNames[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const selectedProgram = programs.find(
    (p) => p.code === selectedSession?.program
  );

  return (
    <>
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-4 border-b border-[#ececea] px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-2xl font-black">
            <span className="font-normal italic text-[#8b8a84]">the/</span>
            schedule

            <span className="ml-3 text-sm font-bold text-[#8b8a84]">
              {monthLabel}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => moveMonth(-1)}
              className="cursor-pointer rounded-lg border border-[#dddbd6] bg-white px-3 py-2 font-black"
            >
              ‹
            </button>

            <button
              onClick={goToday}
              className="cursor-pointer rounded-lg bg-black px-4 py-2 text-sm font-black text-white"
            >
              today
            </button>

            <button
              onClick={() => moveMonth(1)}
              className="cursor-pointer rounded-lg border border-[#dddbd6] bg-white px-3 py-2 font-black"
            >
              ›
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[720px] sm:min-w-0">
            <div className="grid grid-cols-7 bg-[#fbfbfa] text-xs font-black italic text-[#8b8a84]">
              {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((d) => (
                <div key={d} className="border-b border-[#ececea] px-4 py-3">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {grid.map((item) => {
                const daySessions = sessions.filter((s) => s.date === item.key);
                const visibleSessions = daySessions.slice(0, 3);
                const hiddenCount = daySessions.length - visibleSessions.length;
                const isToday = item.key === todayKey;

                return (
                  <div
                    key={item.key}
                    data-date-key={item.key}
                    aria-current={isToday ? "date" : undefined}
                    className={`min-h-[112px] border-b border-r border-[#ececea] p-2 sm:min-h-[128px] ${
                      isToday ? "bg-[#e3f7ea]" : "bg-white/40"
                    } ${!item.isCurrentMonth ? "opacity-40" : ""}`}
                  >
                    <div
                      className={`mb-2 text-lg font-black ${
                        isToday ? "text-[#16a34a]" : "text-[#b8b6ae]"
                      }`}
                    >
                      {item.day}
                    </div>

                    <div className="space-y-1 overflow-hidden">
                      {visibleSessions.map((session) => (
                        <SessionChip
                          key={session.id}
                          session={session}
                          programs={programs}
                          onClick={handleSessionClick}
                        />
                      ))}

                      {hiddenCount > 0 && (
                        <div className="rounded-md bg-black px-2 py-1 text-[10px] font-black text-white">
                          +{hiddenCount} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <SessionDetailModal
        session={selectedSession}
        program={selectedProgram}
        onClose={() => setSelectedSession(null)}
      />

      <LoginRequiredModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}
