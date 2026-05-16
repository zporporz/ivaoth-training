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
import { getClientSession } from "../../lib/authSession";
import { db } from "../../lib/firebase";
import { isCoreWebmasterVid } from "../../lib/useWebmasterAccess";

const emptyForm = {
  date: "",
  time: "",
  program: "ASx",
  type: "Theory Training",
  position: "",
  traineeVid: "",
  traineeName: "",
  topic: "",
  remarks: "",
};

function StatusBadge({ status }) {
  const style =
    status === "Exam"
      ? "bg-red-600 text-white"
      : status === "Official"
      ? "bg-sky-600 text-white"
      : "bg-[#e3f7ea] text-[#0b6e35]";

  return <span className={`rounded-full px-3 py-1 text-xs font-black ${style}`}>{status}</span>;
}

function cleanTrainerName(value) {
  if (!value) return "";
  return String(value).replace(/\s*\(?\d{4,}\)?\s*$/g, "").trim();
}

function getTrainerName(session) {
  return cleanTrainerName(session?.displayName || session?.name) || "-";
}

function getTrainerPosition(session) {
  return session?.trainingStaffPosition || session?.staffPosition || null;
}

function trainerLabel(session) {
  const name = getTrainerName(session);
  const meta = [session?.vid, getTrainerPosition(session)].filter(Boolean).join(" · ");
  return meta ? `${name} · ${meta}` : name;
}

function timeToPickerValue(value) {
  const match = String(value || "").match(/^(\d{2})(\d{2})Z?$/i);
  if (!match) return "";
  return `${match[1]}:${match[2]}`;
}

function pickerValueToZulu(value) {
  if (!value) return "";
  const [hour = "00", minute = "00"] = value.split(":");
  return `${hour.padStart(2, "0")}${minute.padStart(2, "0")}Z`;
}

export default function OriginalStaffPage() {
  const [sessions, setSessions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [loginSession, setLoginSession] = useState(null);
  const [traineeLookupStatus, setTraineeLookupStatus] = useState("idle");

  const isCoreOwner = isCoreWebmasterVid(loginSession?.vid);

  function canManageSession(session) {
  if (!loginSession?.vid) return false;

  return (
    String(session.trainerVid || "") === String(loginSession.vid) ||
    isCoreWebmasterVid(loginSession?.vid)
  );
}

  useEffect(() => {
    setLoginSession(getClientSession());
    setLoading(true);

    const q = query(collection(db, "trainingSessions"), orderBy("date", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSessions(snapshot.docs.map((item) => ({ firestoreId: item.id, ...item.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const traineeVid = form.traineeVid.trim();

    if (traineeVid.length < 5) {
      setTraineeLookupStatus("idle");
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setTraineeLookupStatus("loading");
        const response = await fetch(`/api/ivao/user/${traineeVid}`, { signal: controller.signal });

        if (!response.ok) {
          setTraineeLookupStatus("not-found");
          return;
        }

        const data = await response.json();
        setForm((prev) => {
          if (prev.traineeVid !== traineeVid) return prev;
          return { ...prev, traineeName: data.name || prev.traineeName };
        });
        setTraineeLookupStatus("found");
      } catch (error) {
        if (error.name !== "AbortError") setTraineeLookupStatus("error");
      }
    }, 600);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [form.traineeVid]);

  async function handlePublish() {
    if (!form.date || !form.time || !form.position || !form.traineeName || !form.traineeVid || !form.topic) {
      alert("กรอก Date, Time, Position, Trainee Name, Trainee VID และ Topic ก่อน");
      return;
    }

    if (!loginSession?.vid) {
      alert("กรุณา login ใหม่ก่อนสร้าง session");
      return;
    }

    const editingSession = sessions.find((s) => s.firestoreId === editingId);

    if (editingId && !canManageSession(editingSession || {})) {
      alert("แก้ไขได้เฉพาะ session ที่คุณเป็นคนสอนเท่านั้น");
      return;
    }

    const isExam = form.type.includes("Exam");
    const isOfficial = form.type.includes("Official");
    const trainerName = editingSession?.trainerName || getTrainerName(loginSession);
    const trainerStaffPosition = editingSession?.trainerStaffPosition || getTrainerPosition(loginSession);

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
      trainerName,
      trainerVid: editingSession?.trainerVid || loginSession.vid,
      trainerStaffPosition,
      status: isExam ? "Exam" : isOfficial ? "Official" : "Scheduled",
      updatedAt: serverTimestamp(),
    };

    if (editingId) {
      await updateDoc(doc(db, "trainingSessions", editingId), sessionData);
      setEditingId(null);
    } else {
      await addDoc(collection(db, "trainingSessions"), { ...sessionData, createdAt: serverTimestamp() });
    }

    setForm(emptyForm);
    setTraineeLookupStatus("idle");
  }

  async function handleClaimSession(session) {
    if (!loginSession?.vid) {
      alert("กรุณา login ใหม่ก่อน claim session");
      return;
    }

    if (session.trainerVid) {
      alert("Session นี้มี trainer แล้ว");
      return;
    }

    await updateDoc(doc(db, "trainingSessions", session.firestoreId), {
      trainerName: getTrainerName(loginSession),
      trainerVid: loginSession.vid,
      trainerStaffPosition: getTrainerPosition(loginSession),
      updatedAt: serverTimestamp(),
    });
  }

  async function handleDelete(session) {
    if (!canManageSession(session)) {
      alert("ลบได้เฉพาะ session ที่คุณเป็นคนสอนเท่านั้น");
      return;
    }

    await deleteDoc(doc(db, "trainingSessions", session.firestoreId));
  }

  function handleEdit(session) {
    if (!canManageSession(session)) {
      alert("แก้ไขได้เฉพาะ session ที่คุณเป็นคนสอนเท่านั้น");
      return;
    }

    setEditingId(session.firestoreId);
    setTraineeLookupStatus("idle");
    setForm({
      date: session.date || "",
      time: session.time || "",
      program: session.program || "ASx",
      type: session.type || "Theory Training",
      position: session.position || "",
      traineeVid: session.traineeVid || "",
      traineeName: session.traineeName || session.trainee || "",
      topic: session.topic || "",
      remarks: session.remarks || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setTraineeLookupStatus("idle");
  }

  const mySessions = loginSession?.vid
    ? sessions.filter((session) => String(session.trainerVid || "") === String(loginSession.vid))
    : [];

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
            console — manage schedule<span className="text-[#ff5a1f]">.</span>
          </h1>
        </div>

        {isCoreOwner && (
          <Card className="mb-6 border-[#0a2342]/20 bg-[#0a2342]/[0.03]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">core webmaster tools</div>
                <div className="mt-1 text-2xl font-black">
                  <span className="font-normal italic text-[#8b8a84]">system/</span>access control
                </div>
                <div className="mt-2 text-sm font-semibold text-[#4b4b48]">
                  Manage additional webmasters. Core VID 739898 is protected and cannot be removed.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
  <a
    href="/staff/webmasters"
    className="inline-flex items-center justify-center rounded-full bg-[#0a2342] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#163b6d] hover:shadow-lg"
  >
    Manage Webmasters
  </a>

  <a
    href="/staff/manual-training"
    className="inline-flex items-center justify-center rounded-full border border-[#0a2342] bg-white px-5 py-3 text-sm font-black text-[#0a2342] transition hover:-translate-y-0.5 hover:bg-[#f3f6fb] hover:shadow-lg"
  >
    Manual Add Training
  </a>
</div>
            </div>
          </Card>
        )}

        <Card className="mb-6 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[#ececea] px-6 py-5">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">personal trainer view</div>
              <div className="mt-1 text-2xl font-black">
                <span className="font-normal italic text-[#8b8a84]">my/</span>teaching schedule
              </div>
            </div>
            <div className="rounded-full bg-black px-4 py-2 text-sm font-black text-white">{mySessions.length} sessions</div>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-sm font-bold text-[#8b8a84]">Loading your sessions...</div>
          ) : mySessions.length === 0 ? (
            <div className="px-6 py-8 text-sm font-bold text-[#8b8a84]">You do not have any assigned teaching sessions yet.</div>
          ) : (
            <div className="divide-y divide-[#ececea]">
              {mySessions.map((s) => (
                <div key={`mine-${s.firestoreId}`} className="grid grid-cols-[120px_90px_1fr_210px] items-center gap-4 px-6 py-5">
                  <div>
                    <div className="font-black">{s.date}</div>
                    <div className="text-sm font-bold italic text-[#8b8a84]">{s.time}</div>
                  </div>
                  <div>
                    <div className="font-black">{s.program}</div>
                    <div className="mt-1 text-xs font-black uppercase text-[#8b8a84]">{s.position}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-black">{s.type}</div>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold text-[#4b4b48]">{s.topic}</div>
                    <div className="mt-1 text-sm font-semibold italic text-[#8b8a84]">
                      {s.traineeName || s.trainee} {s.traineeVid ? `(${s.traineeVid})` : ""}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleEdit(s)} className="cursor-pointer rounded-full border border-[#dddbd6] bg-white px-3 py-1 text-xs font-black text-[#4b4b48] hover:bg-[#f3f3f1]">edit</button>
                    <button onClick={() => handleDelete(s)} className="cursor-pointer rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-600 hover:bg-red-100">delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase text-[#8b8a84]">{editingId ? "Edit Session" : "Create Session"}</div>
              {editingId && (
                <button onClick={handleCancelEdit} className="cursor-pointer rounded-full border border-[#dddbd6] bg-white px-3 py-1 text-xs font-black text-[#4b4b48] hover:bg-[#f3f3f1]">cancel edit</button>
              )}
            </div>

            <div className="mt-3 rounded-2xl border border-[#ececea] bg-[#fbfbfa] px-4 py-3 text-sm font-bold text-[#8b8a84]">
              Trainer: {loginSession ? trainerLabel(loginSession) : "-"}
            </div>

            <div className="mt-5 space-y-4">
              <input type="date" value={form.date} onChange={(e) => updateForm("date", e.target.value)} className="w-full cursor-pointer rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none" />

              <div className="relative">
                <input type="time" step="300" value={timeToPickerValue(form.time)} onChange={(e) => updateForm("time", pickerValueToZulu(e.target.value))} className="w-full cursor-pointer rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 pr-16 font-bold outline-none" />
                <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-[#8b8a84]">Z</span>
              </div>

              <select value={form.program} onChange={(e) => updateForm("program", e.target.value)} className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none">
                <option>ASx</option><option>FSx</option><option>ADC</option><option>APC</option><option>ACC</option><option>SEC</option><option>GCA</option>
              </select>

              <select value={form.type} onChange={(e) => updateForm("type", e.target.value)} className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none">
                <option>Theory Training</option><option>Unofficial Practical</option><option>Official Practical</option><option>Theory Exam</option><option>Practical Exam</option>
              </select>

              <input value={form.position} onChange={(e) => updateForm("position", e.target.value)} placeholder="Position e.g. VTBS_TWR" className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold uppercase outline-none" />

              <div>
                <input value={form.traineeVid} onChange={(e) => updateForm("traineeVid", e.target.value.replace(/\D/g, ""))} placeholder="Trainee VID *" inputMode="numeric" className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none" />
                {traineeLookupStatus !== "idle" && (
                  <div className={`mt-2 text-xs font-black ${traineeLookupStatus === "found" ? "text-[#16a34a]" : traineeLookupStatus === "loading" ? "text-[#8b8a84]" : "text-red-600"}`}>
                    {traineeLookupStatus === "loading" && "Looking up IVAO profile..."}
                    {traineeLookupStatus === "found" && "Trainee name filled from IVAO profile."}
                    {traineeLookupStatus === "not-found" && "Could not find this VID. You can still type the name manually."}
                    {traineeLookupStatus === "error" && "Could not lookup VID right now. You can still type the name manually."}
                  </div>
                )}
              </div>

              <input value={form.traineeName} onChange={(e) => updateForm("traineeName", e.target.value)} placeholder="Trainee name *" className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none" />

              <textarea value={form.topic} onChange={(e) => updateForm("topic", e.target.value)} placeholder="Session topic / what will be trained today" rows={4} className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none" />
              <textarea value={form.remarks} onChange={(e) => updateForm("remarks", e.target.value)} placeholder="Remarks / preparation / frequency / notes" rows={3} className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none" />

              <button onClick={handlePublish} className="w-full cursor-pointer rounded-2xl bg-black px-5 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-[#16a34a] hover:shadow-lg active:translate-y-0">
                {editingId ? "Update Session" : "Publish Session"}
              </button>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-[#ececea] px-6 py-5">
              <div className="text-2xl font-black"><span className="font-normal italic text-[#8b8a84]">training/</span>schedule entries</div>
            </div>

            <div>
              {loading ? (
                <div className="px-6 py-8 text-sm font-bold text-[#8b8a84]">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="px-6 py-8 text-sm font-bold text-[#8b8a84]">No sessions yet.</div>
              ) : (
                sessions.map((s) => {
                  const canManage = canManageSession(s);
                  const isLegacy = !s.trainerVid;

                  return (
                    <div key={s.firestoreId} className="grid grid-cols-[90px_120px_80px_1fr_220px] items-center gap-4 border-b border-[#ececea] px-6 py-5">
                      <div className="text-sm font-black text-[#8b8a84]">{s.firestoreId.slice(0, 7)}</div>
                      <div><div className="font-black">{s.date}</div><div className="text-sm font-bold italic text-[#8b8a84]">{s.time}</div></div>
                      <div className="font-black">{s.program}</div>
                      <div>
                        <div className="font-black">{s.type}</div>
                        <div className="mt-1 text-sm font-semibold text-[#4b4b48]">{s.topic}</div>
                        <div className="mt-1 text-sm font-semibold italic text-[#8b8a84]">{s.position} · {s.traineeName || s.trainee} {s.traineeVid ? `(${s.traineeVid})` : ""}</div>
                        <div className="mt-1 text-xs font-black uppercase text-[#8b8a84]">trainer: {s.trainerName || "Legacy session"}{s.trainerStaffPosition ? ` · ${s.trainerStaffPosition}` : ""}</div>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <StatusBadge status={s.status} />
                        {canManage ? (
                          <>
                            <button onClick={() => handleEdit(s)} className="cursor-pointer rounded-full border border-[#dddbd6] bg-white px-3 py-1 text-xs font-black text-[#4b4b48] hover:bg-[#f3f3f1]">edit</button>
                            <button onClick={() => handleDelete(s)} className="cursor-pointer rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-600 hover:bg-red-100">delete</button>
                          </>
                        ) : isLegacy ? (
                          <button onClick={() => handleClaimSession(s)} className="cursor-pointer rounded-full border border-[#0a2342] bg-[#0a2342] px-3 py-1 text-xs font-black text-white hover:bg-[#163b6d]">claim</button>
                        ) : (
                          <span className="rounded-full border border-[#ececea] bg-[#fbfbfa] px-3 py-1 text-xs font-black text-[#8b8a84]">view only</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
