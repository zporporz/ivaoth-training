"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

import Navbar from "../../components/Navbar";
import Card from "../../components/ui/Card";
import { useClientSession } from "../../lib/authSession";
import { db } from "../../lib/firebase";

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

function TrainingSessionCard({ item, mode }) {
  const statusStyle =
    item.status === "Exam"
      ? "bg-red-600 text-white"
      : item.status === "Official"
      ? "bg-sky-600 text-white"
      : mode === "past"
      ? "bg-[#ececea] text-[#4b4b48]"
      : "bg-black text-white";

  return (
    <div className="rounded-2xl border border-[#ececea] bg-[#fbfbfa] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-black">
            {item.program} — {item.type}
          </div>

          <div className="mt-2 text-sm font-bold text-[#8b8a84]">
            {item.date} · {item.time} · {item.position}
          </div>
        </div>

        <div className={`rounded-full px-4 py-2 text-xs font-black ${statusStyle}`}>
          {mode === "past" && item.status === "Scheduled" ? "Completed" : item.status}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#ececea] bg-white p-4">
          <div className="text-[11px] font-black uppercase tracking-wide text-[#8b8a84]">
            topic
          </div>

          <div className="mt-2 text-sm font-bold">
            {item.topic}
          </div>
        </div>

        <div className="rounded-2xl border border-[#ececea] bg-white p-4">
          <div className="text-[11px] font-black uppercase tracking-wide text-[#8b8a84]">
            remarks / preparation
          </div>

          <div className="mt-2 text-sm font-bold">
            {item.remarks || "-"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyTrainingPage() {
  const session = useClientSession();
  const [allSessions, setAllSessions] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    const q = query(
      collection(db, "trainingSessions"),
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAllSessions(data);
    });

    return () => unsubscribe();
  }, []);

  const mySessions = useMemo(() => {
    if (!session?.vid) return [];

    return allSessions.filter(
      (s) => String(s.traineeVid) === String(session.vid)
    );
  }, [allSessions, session]);

  const { upcomingSessions, pastSessions } = useMemo(() => {
    const now = new Date();
    const withDates = mySessions
      .map((item) => ({ ...item, sessionDate: sessionToDate(item) }))
      .filter((item) => item.sessionDate);

    return {
      upcomingSessions: withDates
        .filter((item) => item.sessionDate >= now)
        .sort((a, b) => a.sessionDate.getTime() - b.sessionDate.getTime()),
      pastSessions: withDates
        .filter((item) => item.sessionDate < now)
        .sort((a, b) => b.sessionDate.getTime() - a.sessionDate.getTime()),
    };
  }, [mySessions]);

  const activeSessions = activeTab === "past" ? pastSessions : upcomingSessions;

  if (!session) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] px-6 py-6">
        <Navbar />

        <section className="mx-auto flex max-w-[1480px] items-center justify-center py-32">
          <Card className="max-w-xl text-center">
            <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
              login required
            </div>

            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">
              Please login with IVAO
              <span className="text-[#ff5a1f]">.</span>
            </h1>

            <a
              href="/api/auth/login"
              className="mt-6 inline-flex rounded-full bg-[#0a2342] px-5 py-3 text-sm font-black text-white"
            >
              Login with IVAO
            </a>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-6 py-6">
      <Navbar />

      <section className="mx-auto max-w-[1480px] py-10">
        <div className="mb-8">
          <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
            trainee portal / personal training dashboard
          </div>

          <h1 className="mt-3 text-5xl font-black tracking-[-0.04em]">
            My training
            <span className="text-[#ff5a1f]">.</span>
          </h1>

          <div className="mt-3 text-lg font-bold text-[#8b8a84]">
            {session.name} · VID {session.vid}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-4">
          <Card>
            <div className="text-xs font-black uppercase text-[#8b8a84]">
              total sessions
            </div>

            <div className="mt-3 text-5xl font-black text-[#2563eb]">
              {mySessions.length}
            </div>
          </Card>

          <Card>
            <div className="text-xs font-black uppercase text-[#8b8a84]">
              upcoming
            </div>

            <div className="mt-3 text-5xl font-black text-[#16a34a]">
              {upcomingSessions.length}
            </div>
          </Card>

          <Card>
            <div className="text-xs font-black uppercase text-[#8b8a84]">
              completed
            </div>

            <div className="mt-3 text-5xl font-black text-[#4b4b48]">
              {pastSessions.length}
            </div>
          </Card>

          <Card>
            <div className="text-xs font-black uppercase text-[#8b8a84]">
              current rating
            </div>

            <div className="mt-3 text-3xl font-black text-[#7c3aed]">
              {session.atcRating || "Member"}
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-2xl font-black">
              Training sessions
            </div>

            <div className="grid grid-cols-2 rounded-full border border-[#ececea] bg-[#fbfbfa] p-1">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`rounded-full px-5 py-2 text-xs font-black transition ${
                  activeTab === "upcoming"
                    ? "bg-black text-white shadow-sm"
                    : "text-[#8b8a84] hover:bg-white"
                }`}
              >
                Upcoming ({upcomingSessions.length})
              </button>

              <button
                onClick={() => setActiveTab("past")}
                className={`rounded-full px-5 py-2 text-xs font-black transition ${
                  activeTab === "past"
                    ? "bg-[#0a2342] text-white shadow-sm"
                    : "text-[#8b8a84] hover:bg-white"
                }`}
              >
                Past ({pastSessions.length})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {activeSessions.length === 0 ? (
              <div className="rounded-2xl border border-[#ececea] bg-[#fbfbfa] px-6 py-10 text-center text-sm font-bold text-[#8b8a84]">
                {activeTab === "past"
                  ? "No completed training sessions yet."
                  : "No upcoming training sessions found for your VID."}
              </div>
            ) : (
              activeSessions.map((item) => (
                <TrainingSessionCard key={item.id} item={item} mode={activeTab} />
              ))
            )}
          </div>
        </Card>
      </section>
    </main>
  );
}
