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
import ScheduleEntriesPanel from "../../components/staff/ScheduleEntriesPanel";
import SessionForm from "../../components/staff/SessionForm";
import TeachingSchedule from "../../components/staff/TeachingSchedule";
import { getClientSession } from "../../lib/authSession";
import { notifyDiscordTraining } from "../../lib/discordTrainingNotify";
import { db } from "../../lib/firebase";
import {
  canClaimLegacySession,
  canDeleteSession,
  canEditSession,
  canManageWebmasters,
  canManualAddTraining,
} from "../../lib/permissions";

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

function cleanTrainerName(value) {
  return value
    ? String(value)
        .replace(/\s*\(?\d{4,}\)?\s*$/g, "")
        .trim()
    : "";
}

function getTrainerName(session) {
  return cleanTrainerName(session?.displayName || session?.name) || "-";
}

function getTrainerPosition(session) {
  return session?.trainingStaffPosition || session?.staffPosition || null;
}

function trainerLabel(session) {
  const meta = [session?.vid, getTrainerPosition(session)].filter(Boolean).join(" · ");
  return meta ? `${getTrainerName(session)} · ${meta}` : getTrainerName(session);
}

export default function OriginalStaffPage() {
  const [sessions, setSessions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [loginSession, setLoginSession] = useState(null);
  const [traineeLookupStatus, setTraineeLookupStatus] = useState("idle");
  const [teachingTab, setTeachingTab] = useState("upcoming");
  const [entriesTab, setEntriesTab] = useState("upcoming");

  const canOpenWebmasters = canManageWebmasters(loginSession);
  const canOpenManualTraining = canManualAddTraining(loginSession, canOpenWebmasters);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    setLoginSession(getClientSession());
    setLoading(true);

    const q = query(collection(db, "trainingSessions"), orderBy("date", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSessions(
        snapshot.docs.map((item) => ({
          firestoreId: item.id,
          ...item.data(),
        })),
      );
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
        const response = await fetch(`/api/ivao/user/${traineeVid}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          setTraineeLookupStatus("not-found");
          return;
        }

        const data = await response.json();
        setForm((prev) =>
          prev.traineeVid !== traineeVid
            ? prev
            : { ...prev, traineeName: data.name || prev.traineeName },
        );
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

    if (!loginSession?.vid) {
      alert("กรุณา login ใหม่ก่อนสร้าง session");
      return;
    }

    const editingSession = sessions.find((session) => session.firestoreId === editingId);

    if (editingId && !canEditSession(loginSession, editingSession || {})) {
      alert("แก้ไขได้เฉพาะ session ที่คุณเป็นคนสอนเท่านั้น");
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
      trainerName: editingSession?.trainerName || getTrainerName(loginSession),
      trainerVid: editingSession?.trainerVid || loginSession.vid,
      trainerStaffPosition:
        editingSession?.trainerStaffPosition || getTrainerPosition(loginSession),
      status: isExam ? "Exam" : isOfficial ? "Official" : "Scheduled",
      updatedAt: serverTimestamp(),
    };

    if (editingId) {
      await updateDoc(doc(db, "trainingSessions", editingId), sessionData);
      await notifyDiscordTraining("modified", sessionData);
      setEditingId(null);
    } else {
      await addDoc(collection(db, "trainingSessions"), {
        ...sessionData,
        createdAt: serverTimestamp(),
      });
      await notifyDiscordTraining("new", sessionData);
    }

    setForm(emptyForm);
    setTraineeLookupStatus("idle");
  }

  async function handleClaimSession(session) {
    if (!canClaimLegacySession(loginSession, session)) {
      alert("Session นี้ claim ไม่ได้");
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
    if (!canDeleteSession(loginSession, session)) {
      alert("ลบได้เฉพาะ session ที่คุณเป็นคนสอนเท่านั้น");
      return;
    }

    await deleteDoc(doc(db, "trainingSessions", session.firestoreId));
  }

  function handleEdit(session) {
    if (!canEditSession(loginSession, session)) {
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
    ? sessions.filter(
        (session) => String(session.trainerVid || "") === String(loginSession.vid),
      )
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
            <span className="font-normal italic text-[#4b4b48]">Staff</span> console —
            manage schedule<span className="text-[#ff5a1f]">.</span>
          </h1>
        </div>

        {(canOpenWebmasters || canOpenManualTraining) && (
          <Card className="mb-6 border-[#0a2342]/20 bg-[#0a2342]/[0.03]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
                  core webmaster tools
                </div>
                <div className="mt-1 text-2xl font-black">
                  <span className="font-normal italic text-[#8b8a84]">system/</span>access
                  control
                </div>
                <div className="mt-2 text-sm font-semibold text-[#4b4b48]">
                  Manage elevated access and manually add legacy training sessions.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {canOpenWebmasters && (
                  <a
                    href="/staff/webmasters"
                    className="inline-flex items-center justify-center rounded-full bg-[#0a2342] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#163b6d] hover:shadow-lg"
                  >
                    Manage Webmasters
                  </a>
                )}

                {canOpenManualTraining && (
                  <a
                    href="/staff/manual-training"
                    className="inline-flex items-center justify-center rounded-full border border-[#0a2342] bg-white px-5 py-3 text-sm font-black text-[#0a2342] transition hover:-translate-y-0.5 hover:bg-[#f3f6fb] hover:shadow-lg"
                  >
                    Manual Add Training
                  </a>
                )}
              </div>
            </div>
          </Card>
        )}

        <TeachingSchedule
          loading={loading}
          sessions={mySessions}
          tab={teachingTab}
          setTab={setTeachingTab}
          currentUser={loginSession}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SessionForm
            editingId={editingId}
            form={form}
            loginSession={loginSession}
            traineeLookupStatus={traineeLookupStatus}
            trainerLabel={trainerLabel}
            onChange={updateForm}
            onCancelEdit={handleCancelEdit}
            onSubmit={handlePublish}
          />

          <ScheduleEntriesPanel
            loading={loading}
            sessions={sessions}
            tab={entriesTab}
            setTab={setEntriesTab}
            currentUser={loginSession}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onClaim={handleClaimSession}
          />
        </div>
      </section>
    </main>
  );
}
