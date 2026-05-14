"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import Navbar from "../../components/Navbar";
import Card from "../../components/ui/Card";
import { db } from "../../lib/firebase";

function StatusBadge({ status }) {
  const style =
    status === "Exam"
      ? "bg-red-600 text-white"
      : status === "Official"
      ? "bg-sky-600 text-white"
      : "bg-[#e3f7ea] text-[#0b6e35]";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${style}`}>
      {status}
    </span>
  );
}

const emptyForm = {
  date: "",
  time: "",
  program: "ASx",
  type: "Theory Training",
  position: "",
  traineeName: "",
  traineeVid: "",
  topic: "",
  remarks: "",
};

export default function OriginalStaffPage() {
  const [sessions, setSessions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);

  function updateForm(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  useEffect(() => {
    setLoading(true);

    const q = query(
      collection(db, "trainingSessions"),
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        firestoreId: item.id,
        ...item.data(),
      }));

      setSessions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function handlePublish() {
    if (
      !form.date ||
      !form.time ||
      !form.position ||
      !form.traineeName ||
      !form.traineeVid ||
      !form.topic
    ) {
      alert("กรอก Date, Time, Position, Trainee Name, Trainee VID และ Topic ก่อน");
      return;
    }

    const isExam = form.type.includes("Exam");
    const isOfficial = form.type.includes("Official");

    const sessionData = {
      date: form.date,
      time: form.time,
      program: form.program,
      type: form.type,
      topic: form.topic,
      remarks: form.remarks,
      position: form.position.toUpperCase(),
      traineeName: form.traineeName.trim(),
      traineeVid: form.traineeVid.trim(),
      status: isExam ? "Exam" : isOfficial ? "Official" : "Scheduled",
      updatedAt: serverTimestamp(),
    };

    if (editingId) {
      await updateDoc(doc(db, "trainingSessions", editingId), sessionData);
      setEditingId(null);
    } else {
      await addDoc(collection(db, "trainingSessions"), {
        ...sessionData,
        createdAt: serverTimestamp(),
      });
    }

    setForm(emptyForm);
  }

  async function handleDelete(session) {
    await deleteDoc(doc(db, "trainingSessions", session.firestoreId));
  }

  function handleEdit(session) {
    setEditingId(session.firestoreId);

    setForm({
      date: session.date || "",
      time: session.time || "",
      program: session.program || "ASx",
      type: session.type || "Theory Training",
      position: session.position || "",
      traineeName: session.traineeName || session.trainee || "",
      traineeVid: session.traineeVid || "",
      topic: session.topic || "",
      remarks: session.remarks || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <main className="relative z-10 min-h-screen px-6 py-6">
      <Navbar />

      <section className="mx-auto max-w-[1480px] py-10">
        <div className="mb-8">
          <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
            ivao-th / training department / staff console
          </div>

          <h1 className="mt-3 text-5xl font-black tracking-[-0.04em]">
            <span className="font-normal italic text-[#4b4b48]">Staff</span>{" "}
            console — manage schedule
            <span className="text-[#ff5a1f]">.</span>
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase text-[#8b8a84]">
                {editingId ? "Edit Session" : "Create Session"}
              </div>

              {editingId && (
                <button
                  onClick={handleCancelEdit}
                  className="cursor-pointer rounded-full border border-[#dddbd6] bg-white px-3 py-1 text-xs font-black text-[#4b4b48] hover:bg-[#f3f3f1]"
                >
                  cancel edit
                </button>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <input
                type="date"
                value={form.date}
                onChange={(e) => updateForm("date", e.target.value)}
                className="w-full cursor-pointer rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <input
                value={form.time}
                onChange={(e) => updateForm("time", e.target.value)}
                placeholder="Time e.g. 1300Z"
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <select
                value={form.program}
                onChange={(e) => updateForm("program", e.target.value)}
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              >
                <option>ASx</option>
                <option>ADC</option>
                <option>APC</option>
                <option>ACC</option>
                <option>SEC</option>
                <option>GCA</option>
              </select>

              <select
                value={form.type}
                onChange={(e) => updateForm("type", e.target.value)}
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              >
                <option>Theory Training</option>
                <option>Unofficial Practical</option>
                <option>Official Practical</option>
                <option>Knowledge Check-up</option>
                <option>Practical Exam</option>
              </select>

              <input
                value={form.position}
                onChange={(e) => updateForm("position", e.target.value)}
                placeholder="Position e.g. VTBS_TWR"
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold uppercase outline-none"
              />

              <input
                value={form.traineeName}
                onChange={(e) => updateForm("traineeName", e.target.value)}
                placeholder="Trainee name *"
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <input
                value={form.traineeVid}
                onChange={(e) => updateForm("traineeVid", e.target.value.replace(/\D/g, ""))}
                placeholder="Trainee VID *"
                inputMode="numeric"
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <textarea
                value={form.topic}
                onChange={(e) => updateForm("topic", e.target.value)}
                placeholder="Session topic / what will be trained today"
                rows={4}
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <textarea
                value={form.remarks}
                onChange={(e) => updateForm("remarks", e.target.value)}
                placeholder="Remarks / preparation / frequency / notes"
                rows={3}
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <button
                onClick={handlePublish}
                className="w-full cursor-pointer rounded-2xl bg-black px-5 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-[#16a34a] hover:shadow-lg active:translate-y-0"
              >
                {editingId ? "Update Session" : "Publish Session"}
              </button>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-[#ececea] px-6 py-5">
              <div className="text-2xl font-black">
                <span className="font-normal italic text-[#8b8a84]">
                  training/
                </span>
                schedule entries
              </div>
            </div>

            <div>
              {loading ? (
                <div className="px-6 py-8 text-sm font-bold text-[#8b8a84]">
                  Loading sessions...
                </div>
              ) : sessions.length === 0 ? (
                <div className="px-6 py-8 text-sm font-bold text-[#8b8a84]">
                  No sessions yet.
                </div>
              ) : (
                sessions.map((s) => (
                  <div
                    key={s.firestoreId}
                    className="grid grid-cols-[90px_120px_80px_1fr_220px] items-center gap-4 border-b border-[#ececea] px-6 py-5"
                  >
                    <div className="text-sm font-black text-[#8b8a84]">
                      {s.firestoreId.slice(0, 7)}
                    </div>

                    <div>
                      <div className="font-black">{s.date}</div>
                      <div className="text-sm font-bold italic text-[#8b8a84]">
                        {s.time}
                      </div>
                    </div>

                    <div className="font-black">{s.program}</div>

                    <div>
                      <div className="font-black">{s.type}</div>
                      <div className="mt-1 text-sm font-semibold text-[#4b4b48]">
                        {s.topic}
                      </div>
                      <div className="mt-1 text-sm font-semibold italic text-[#8b8a84]">
                        {s.position} · {s.traineeName || s.trainee} {s.traineeVid ? `(${s.traineeVid})` : ""}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <StatusBadge status={s.status} />

                      <button
                        onClick={() => handleEdit(s)}
                        className="cursor-pointer rounded-full border border-[#dddbd6] bg-white px-3 py-1 text-xs font-black text-[#4b4b48] hover:bg-[#f3f3f1]"
                      >
                        edit
                      </button>

                      <button
                        onClick={() => handleDelete(s)}
                        className="cursor-pointer rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-600 hover:bg-red-100"
                      >
                        delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
