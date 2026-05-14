"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

import Navbar from "../components/Navbar";
import ProgramCard from "../components/ProgramCard";
import TrainingCalendar from "../components/TrainingCalendar";
import UpNext from "../components/UpNext";

import programs from "../data/programs";
import calendarDays from "../data/calendarDays";
import { db } from "../lib/firebase";

function buildCalendarDaysFromSessions(sessions) {
  const baseDays = [
    ["26", "", "", ""], ["27", "", "", ""], ["28", "", "", ""], ["29", "", "", ""], ["30", "", "", ""], ["1", "", "", ""], ["2", "", "", ""],
    ["3", "", "", ""], ["4", "", "", ""], ["5", "", "", ""], ["6", "", "", ""], ["7", "", "", ""], ["8", "", "", ""], ["9", "", "", ""],
    ["10", "", "", ""], ["11", "", "", ""], ["12", "", "", ""], ["13", "", "", ""], ["14", "", "", ""], ["15", "", "", ""], ["16", "", "", ""],
    ["17", "", "", ""], ["18", "", "", ""], ["19", "", "", ""], ["20", "", "", ""], ["21", "", "", ""], ["22", "", "", ""], ["23", "", "", ""],
    ["24", "", "", ""], ["25", "", "", ""], ["26", "", "", ""], ["27", "", "", ""], ["28", "", "", ""], ["29", "", "", ""], ["30", "", "", ""],
  ];

function buildUpNextFromSessions(sessions) {
  return sessions.map((session) => {
    const day = session.date?.split("-")[2]?.replace(/^0/, "") || "-";

    const program = programs.find((p) => p.code === session.program);

    return {
      day,
      type: session.program,
      pos: session.position,
      title: `${session.type} · ${session.topic}`,
      name: session.trainee,
      color: program?.color || "#0a0a0a",
      mine: false,
    };
  });
}  
  sessions.forEach((session) => {
    const day = session.date?.split("-")[2]?.replace(/^0/, "");
    const index = baseDays.findIndex((item) => item[0] === day);

    if (index !== -1) {
      const sessionType =
        session.status === "Exam"
          ? "exam"
          : session.status === "Official"
          ? "official"
          : session.type?.includes("Unofficial")
          ? "unofficial"
          : "theory";

      baseDays[index] = [
        day,
        session.time,
        session.program,
        session.position,
        sessionType,
      ];
    }
  });

  return baseDays;
}

export default function Home() {
  const [dbSessions, setDbSessions] = useState([]);
  const liveCalendarDays = buildCalendarDaysFromSessions(dbSessions);
  const liveUpNext = buildUpNextFromSessions(dbSessions);

  useEffect(() => {
    async function loadSessions() {
      const q = query(
        collection(db, "trainingSessions"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setDbSessions(data);
    }

    loadSessions();
  }, []);

  return (
    <main className="relative z-10 min-h-screen px-6 py-6">
      <Navbar />

      <section className="mx-auto max-w-[1480px] py-10">
        <div className="mb-7">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
              ivao-th / training department / training schedule
            </div>

            <h1 className="mt-3 text-5xl font-black tracking-[-0.04em]">
              <span className="font-normal italic text-[#4b4b48]">
                Training
              </span>{" "}
              schedule — sessions, check-ups, and exams
              <span className="text-[#ff5a1f]">.</span>
            </h1>
          </div>
        </div>

        <div className="mb-7 flex flex-col items-center">
          <div className="mb-4 flex items-baseline justify-center gap-4">
            <h2 className="text-2xl font-black">
              <span className="font-normal italic">Training</span> programs
            </h2>

            <span className="text-sm font-semibold italic text-[#8b8a84]">
              training, check-up, and examination overview
            </span>
          </div>

          <div className="grid max-w-[1080px] grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {programs.map((p) => (
              <ProgramCard key={p.code} p={p} />
            ))}
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-[#ececea] bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase text-[#8b8a84]">
            Live sessions from Firestore
          </div>

          <div className="mt-3 space-y-2">
            {dbSessions.length === 0 ? (
              <div className="text-sm font-bold text-[#8b8a84]">
                No live sessions yet.
              </div>
            ) : (
              dbSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center gap-2 text-sm font-bold"
                >
                  <span>{s.date}</span>
                  <span>·</span>
                  <span>{s.time}</span>
                  <span>·</span>
                  <span>{s.program}</span>
                  <span>·</span>
                  <span>{s.type}</span>
                  <span>·</span>
                  <span>{s.position}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mb-5 flex items-center gap-8 border-b border-[#dddbd6]">
          <button className="border-b-4 border-[#ff5a1f] pb-3 text-base font-black">
            schedule{" "}
            <span className="ml-2 rounded-full bg-black px-2 py-1 text-xs text-white">
              25
            </span>
          </button>

          <button className="pb-3 text-base font-black italic text-[#8b8a84]">
            my training <span className="ml-2 text-xs text-black">4</span>
          </button>

          <button className="pb-3 text-base font-black italic text-[#8b8a84]">
            my sessions <span className="ml-2 text-xs text-black">1</span>
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <TrainingCalendar calendarDays={liveCalendarDays} programs={programs} />

          <UpNext upNext={liveUpNext} />
        </div>
      </section>
    </main>
  );
}