"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

import Navbar from "../components/Navbar";
import ProgramCard from "../components/ProgramCard";
import TrainingCalendar from "../components/TrainingCalendar";
import TrainingReminder from "../components/TrainingReminder";
import UpNext from "../components/UpNext";

import programs from "../data/programs";
import { db } from "../lib/firebase";
import { getClientSession } from "../lib/authSession";
import { ArrowUpRight } from "lucide-react";

const monthNames = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

function sessionToDate(session) {
  const rawDate = String(session?.date || "").trim();
  const rawTime = String(session?.time || "").replace(/\D/g, "");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate) || rawTime.length < 4) {
    return null;
  }

  const hour = rawTime.slice(0, 2);
  const minute = rawTime.slice(2, 4);
  const date = new Date(`${rawDate}T${hour}:${minute}:00Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function buildSessionList(sessions, mode = "upcoming") {
  const now = new Date();

  return sessions
    .map((session) => ({ ...session, sessionDate: sessionToDate(session) }))
    .filter((session) => {
      if (!session.sessionDate) return false;

      return mode === "history"
        ? session.sessionDate < now
        : session.sessionDate >= now;
    })
    .sort((a, b) => {
      return mode === "history"
        ? b.sessionDate.getTime() - a.sessionDate.getTime()
        : a.sessionDate.getTime() - b.sessionDate.getTime();
    })
    .map((session) => {
      const parts = session.date?.split("-") || [];
      const monthIndex = Number(parts[1]) - 1;
      const day = parts[2]?.replace(/^0/, "") || "-";
      const month = monthNames[monthIndex] || "";
      const program = programs.find((p) => p.code === session.program);

      return {
        id: session.id,
        mode,
        day,
        month,
        time: session.time || "-",
        type: session.program,
        pos: session.position,
        title: `${session.type} · ${session.topic}`,
        name: session.traineeName || session.trainee || "Unknown trainee",
        trainerName: session.trainerName || "",
        vid: session.traineeVid || "",
        color: program?.color || "#0a0a0a",
        mine: false,
      };
    });
}

export default function Home() {
  const [dbSessions, setDbSessions] = useState([]);
  const [activeGroup, setActiveGroup] = useState("ATC");
  const [session, setSession] = useState(null);

  const liveUpNext = buildSessionList(dbSessions, "upcoming");
  const historySessions = buildSessionList(dbSessions, "history");
  const atcCount = dbSessions.filter((s) => {
  const program = programs.find((p) => p.code === s.program);
  return program?.group === "ATC";
}).length;

const pilotCount = dbSessions.filter((s) => {
  const program = programs.find((p) => p.code === s.program);
  return program?.group === "Pilot";
}).length;

  useEffect(() => {
    setSession(getClientSession());

    const q = query(collection(db, "trainingSessions"), orderBy("date", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setDbSessions(data);
    });

    return () => unsubscribe();
  }, []);

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => p.group === activeGroup);
  }, [activeGroup]);

  return (
    <main className="relative z-10 min-h-screen px-6 py-6">
      <Navbar />
      <TrainingReminder sessions={dbSessions} />

      <section className="mx-auto max-w-[1480px] py-10">
        <div className="mb-7 flex items-start justify-between gap-8">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
              ivao-th / training department / training schedule
            </div>

            <h1 className="mt-3 text-5xl font-black tracking-[-0.04em]">
              <span className="font-normal italic text-[#4b4b48]">Training</span>{" "}
              schedule — sessions, check-ups, and exams
              <span className="text-[#ff5a1f]">.</span>
            </h1>
          </div>

          {session && (
            <a
              href="https://ivao.aero/training/training/"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-5 inline-flex items-center gap-3 rounded-full bg-[#ff5a1f] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_14px_35px_rgba(255,90,31,0.28)] transition duration-300 hover:-translate-y-1 hover:bg-[#f04f18] hover:shadow-[0_18px_45px_rgba(255,90,31,0.42)]"
            >
              REQUEST TRAINING
              <ArrowUpRight
                size={18}
                className="transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </a>
          )}
        </div>

        <div className="mb-7 flex flex-col items-center">
          <div className="mb-5 flex items-center gap-3 rounded-full border border-[#ececea] bg-white p-1 shadow-sm">
            <button
              onClick={() => setActiveGroup("ATC")}
              className={`rounded-full px-5 py-2 text-sm font-black transition ${
                activeGroup === "ATC"
                  ? "bg-black text-white"
                  : "text-[#8b8a84] hover:bg-[#f3f3f1]"
              }`}
            >
              ATC
            </button>

            <button
              onClick={() => setActiveGroup("Pilot")}
              className={`rounded-full px-5 py-2 text-sm font-black transition ${
                activeGroup === "Pilot"
                  ? "bg-[#0a2342] text-white"
                  : "text-[#8b8a84] hover:bg-[#f3f3f1]"
              }`}
            >
              PILOT
            </button>
          </div>

          <div className="mb-4 flex items-baseline justify-center gap-4">
            <h2 className="text-2xl font-black">
              <span className="font-normal italic">Training</span> programs
            </h2>

            <span className="text-sm font-semibold italic text-[#8b8a84]">
              {activeGroup} training, check-up, and examination overview
            </span>
          </div>

          <div
            className={`grid w-full gap-4 ${
              activeGroup === "ATC"
                ? "grid-cols-6"
                : "grid-cols-5"
            }`}
          >
            {filteredPrograms.map((p) => (
              <ProgramCard key={p.code} p={p} sessions={dbSessions} />
            ))}
          </div>
        </div>

        <div className="mb-5 flex items-center gap-8 border-b border-[#dddbd6]">
  <button className="border-b-4 border-[#ff5a1f] pb-3 text-base font-black">
    all sessions{" "}
    <span className="ml-2 rounded-full bg-black px-2 py-1 text-xs text-white">
      {dbSessions.length}
    </span>

    <span className="ml-3 text-xs font-bold text-[#8b8a84]">
      ATC {atcCount} · Pilot {pilotCount}
    </span>
  </button>
</div>

        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <TrainingCalendar sessions={dbSessions} programs={programs} />
          <UpNext upNext={liveUpNext} history={historySessions} />
        </div>
      </section>
    </main>
  );
}


