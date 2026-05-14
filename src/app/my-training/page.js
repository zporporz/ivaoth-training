"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

import Navbar from "../../components/Navbar";
import Card from "../../components/ui/Card";
import { getClientSession } from "../../lib/authSession";
import { db } from "../../lib/firebase";

export default function MyTrainingPage() {
  const [session, setSession] = useState(null);
  const [allSessions, setAllSessions] = useState([]);

  useEffect(() => {
    setSession(getClientSession());

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
              official trainings
            </div>

            <div className="mt-3 text-5xl font-black text-[#16a34a]">
              {mySessions.filter((s) => s.status === "Official").length}
            </div>
          </Card>

          <Card>
            <div className="text-xs font-black uppercase text-[#8b8a84]">
              exams
            </div>

            <div className="mt-3 text-5xl font-black text-[#dc2626]">
              {mySessions.filter((s) => s.status === "Exam").length}
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
          <div className="mb-5 text-2xl font-black">
            Upcoming & past sessions
          </div>

          <div className="space-y-4">
            {mySessions.length === 0 ? (
              <div className="text-sm font-bold text-[#8b8a84]">
                No training sessions found for your VID.
              </div>
            ) : (
              mySessions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-[#ececea] bg-[#fbfbfa] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xl font-black">
                        {s.program} — {s.type}
                      </div>

                      <div className="mt-2 text-sm font-bold text-[#8b8a84]">
                        {s.date} · {s.time} · {s.position}
                      </div>
                    </div>

                    <div className="rounded-full bg-black px-4 py-2 text-xs font-black text-white">
                      {s.status}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-[#ececea] bg-white p-4">
                      <div className="text-[11px] font-black uppercase tracking-wide text-[#8b8a84]">
                        topic
                      </div>

                      <div className="mt-2 text-sm font-bold">
                        {s.topic}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#ececea] bg-white p-4">
                      <div className="text-[11px] font-black uppercase tracking-wide text-[#8b8a84]">
                        remarks / preparation
                      </div>

                      <div className="mt-2 text-sm font-bold">
                        {s.remarks || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </main>
  );
}
