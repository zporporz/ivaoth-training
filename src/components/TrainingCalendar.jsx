"use client";

import { useState } from "react";
import Card from "./ui/Card";
import SessionDetailModal from "./SessionDetailModal";

const monthNames = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildMonthGrid(cursor) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const firstDay = new Date(year, month, 1);
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
  const [cursor, setCursor] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null);

  const grid = buildMonthGrid(cursor);
  const todayKey = toDateKey(new Date());

  function moveMonth(step) {
    setCursor((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + step);
      return next;
    });
  }

  function goToday() {
    setCursor(new Date());
  }

  const monthLabel = `${monthNames[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const selectedProgram = programs.find(
    (p) => p.code === selectedSession?.program
  );

  return (
    <>
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-[#ececea] px-6 py-5">
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
                className={`min-h-[128px] border-b border-r border-[#ececea] p-2 ${
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
                      onClick={setSelectedSession}
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
      </Card>

      <SessionDetailModal
        session={selectedSession}
        program={selectedProgram}
        onClose={() => setSelectedSession(null)}
      />
    </>
  );
}
