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
import { isValidZuluTime, sessionToDate } from "../lib/staffSessions";

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

function findKnownTrainee(sessions, traineeVid) {
  const cleanVid = String(traineeVid || "").trim();
  if (!cleanVid) return null;

  return sessions
    .filter((session) => String(session.traineeVid || "").trim() === cleanVid)
    .filter((session) => session.traineeName || session.trainee)
    .sort((a, b) => {
      const dateA = sessionToDate(a)?.getTime() || 0;
      const dateB = sessionToDate(b)?.getTime() || 0;

      return dateB - dateA;
    })[0];
}

export default function useTrainingSessions() {
  const [sessions, setSessions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyTrainingSessionForm);
  const loginSession = useClientSession();
  const [traineeLookupStatus, setTraineeLookupStatus] = useState("idle");
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (submitStatus !== "idle") {
      setSubmitStatus("idle");
      setSubmitMessage("");
    }
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

    const knownTrainee = findKnownTrainee(sessions, traineeVid);
    const knownName = knownTrainee?.traineeName || knownTrainee?.trainee || "";
    const historyTimeout = setTimeout(() => {
      if (!knownName) return;

      setForm((prev) => {
        if (prev.traineeVid !== traineeVid || prev.traineeName) return prev;
        return { ...prev, traineeName: knownName };
      });
      setTraineeLookupStatus("history-found");
    }, 0);

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setTraineeLookupStatus("loading");
        const response = await fetch(`/api/ivao/user/${traineeVid}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          setTraineeLookupStatus(knownName ? "history-found" : "not-found");
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
        if (error.name !== "AbortError") {
          setTraineeLookupStatus(knownName ? "history-found" : "error");
        }
      }
    }, 600);

    return () => {
      clearTimeout(historyTimeout);
      clearTimeout(timeout);
      controller.abort();
    };
  }, [form.traineeName, form.traineeVid, sessions]);

  async function publishSession() {
    if (isSubmitting) return;

    if (
      !form.date ||
      !isValidZuluTime(form.time) ||
      !form.position ||
      !form.traineeName ||
      !form.traineeVid ||
      !form.topic
    ) {
      setSubmitStatus("error");
      setSubmitMessage("กรอก Date, Time, Position, Trainee Name, Trainee VID และ Topic ก่อน");
      return;
    }

    if (!loginSession?.vid) {
      setSubmitStatus("error");
      setSubmitMessage("กรุณา login ใหม่ก่อนสร้าง session");
      return;
    }

    const editingSession = sessions.find((session) => session.firestoreId === editingId);

    if (editingId && !canEditSession(loginSession, editingSession || {})) {
      setSubmitStatus("error");
      setSubmitMessage("แก้ไขได้เฉพาะ session ที่คุณเป็นคนสอนเท่านั้น");
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

    const wasEditing = Boolean(editingId);
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setSubmitMessage("");

    try {
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
      setSubmitStatus("success");
      setSubmitMessage(
        wasEditing
          ? "แก้ไข session เรียบร้อยแล้ว"
          : "สร้าง session เรียบร้อยแล้ว",
      );
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage(error.message || "บันทึก session ไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
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
    setSubmitStatus("idle");
    setSubmitMessage("");
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
    setSubmitStatus("idle");
    setSubmitMessage("");
  }

  return {
    sessions,
    editingId,
    loading,
    form,
    loginSession,
    traineeLookupStatus,
    submitStatus,
    submitMessage,
    isSubmitting,
    updateForm,
    publishSession,
    claimSession,
    deleteSession,
    editSession,
    cancelEdit,
  };
}
