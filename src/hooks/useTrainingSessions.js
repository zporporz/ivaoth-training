"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { adminDataRequest } from "../lib/adminDataClient";
import { useClientSession } from "../lib/authSession";
import { notifyDiscordTraining } from "../lib/discordTrainingNotify";
import { db } from "../lib/firebase";
import {
  canClaimLegacySession,
  canDeleteSession,
  canEditSession,
} from "../lib/permissions";
import { isValidZuluTime } from "../lib/staffSessions";

export const emptyTrainingSessionForm = {
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

export function getTrainerName(session) {
  return cleanTrainerName(session?.displayName || session?.name) || "-";
}

export function getTrainerPosition(session) {
  return session?.trainingStaffPosition || session?.staffPosition || null;
}

export function trainerLabel(session) {
  const meta = [session?.vid, getTrainerPosition(session)].filter(Boolean).join(" · ");
  return meta ? `${getTrainerName(session)} · ${meta}` : getTrainerName(session);
}

export default function useTrainingSessions() {
  const [sessions, setSessions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyTrainingSessionForm);
  const loginSession = useClientSession();
  const [traineeLookupStatus, setTraineeLookupStatus] = useState("idle");

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
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
      const timeout = setTimeout(() => setTraineeLookupStatus("idle"), 0);
      return () => clearTimeout(timeout);
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

  async function publishSession() {
    if (
      !form.date ||
      !isValidZuluTime(form.time) ||
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
    };

    if (editingId) {
      const result = await adminDataRequest(`/sessions/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify(sessionData),
      });
      await notifyDiscordTraining("modified", result.session || sessionData);
      setEditingId(null);
    } else {
      const result = await adminDataRequest("/sessions", {
        method: "POST",
        body: JSON.stringify(sessionData),
      });
      await notifyDiscordTraining("new", result.session || sessionData);
    }

    setForm(emptyTrainingSessionForm);
    setTraineeLookupStatus("idle");
  }

  async function claimSession(session) {
    if (!canClaimLegacySession(loginSession, session)) {
      alert("Session นี้ claim ไม่ได้");
      return;
    }

    await adminDataRequest(`/sessions/${session.firestoreId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "claim" }),
    });
  }

  async function deleteSession(session) {
    if (!canDeleteSession(loginSession, session)) {
      alert("ลบได้เฉพาะ session ที่คุณเป็นคนสอนเท่านั้น");
      return;
    }

    await adminDataRequest(`/sessions/${session.firestoreId}`, {
      method: "DELETE",
    });
  }

  function editSession(session) {
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

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyTrainingSessionForm);
    setTraineeLookupStatus("idle");
  }

  return {
    sessions,
    editingId,
    loading,
    form,
    loginSession,
    traineeLookupStatus,
    updateForm,
    publishSession,
    claimSession,
    deleteSession,
    editSession,
    cancelEdit,
  };
}
