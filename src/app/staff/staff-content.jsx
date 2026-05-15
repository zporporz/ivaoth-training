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
  const [loginSession, setLoginSession] = useState(null);
  const [traineeLookupStatus, setTraineeLookupStatus] = useState("idle");

  function canManageSession(session) {
    if (!loginSession?.vid) return false;
    return String(session.trainerVid || "") === String(loginSession.vid);
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    setLoginSession(getClientSession());
    setLoading(true);

    const q = query(collection(db, "trainingSessions"), orderBy("date", "asc"));

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

        setForm((prev) => {
          if (prev.traineeVid !== traineeVid) return prev;
          return {
            ...prev,
            traineeName: data.name || prev.traineeName,
          };
        });

        setTraineeLookupStatus("found");
      } catch (error) {
        if (error.name !== "AbortError") {
          setTraineeLookupStatus("error");
        }
      }
    }, 600);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [form.traineeVid]);

  async function handlePublish() { return null; }

  return <div />;
}
