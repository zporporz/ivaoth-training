"use client";

import { useEffect, useState } from "react";
import { useClientSession } from "../lib/authSession";

const REMINDER_WINDOWS = [
  { id: "30m", label: "30 minutes", minutes: 30, windowMinutes: 30 },
  { id: "1h", label: "1 hour", minutes: 60, windowMinutes: 60 },
  { id: "1d", label: "1 day", minutes: 24 * 60, windowMinutes: 24 * 60 },
];

function parseSessionDate(session) {
  if (!session?.date || !session?.time) return null;
  const cleanTime = String(session.time).replace(/\D/g, "");
  if (cleanTime.length < 4) return null;
  const hour = cleanTime.slice(0, 2);
  const minute = cleanTime.slice(2, 4);
  const date = new Date(`${session.date}T${hour}:${minute}:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getReminderKey(session, reminder) {
  return `training-reminder-dismissed-${session.id || session.firestoreId}-${reminder.id}`;
}

function getActiveReminder(diffMinutes) {
  return REMINDER_WINDOWS.find(
    (reminder) =>
      diffMinutes >= 0 &&
      diffMinutes <= reminder.minutes &&
      diffMinutes >= reminder.minutes - reminder.windowMinutes
  );
}

export default function TrainingReminder({ sessions = [] }) {
  const [visible, setVisible] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [activeReminder, setActiveReminder] = useState(null);
  const [dismissed, setDismissed] = useState([]);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);

  const loginSession = useClientSession();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const timeout = window.setTimeout(() => {
      const savedDismissed = Object.keys(localStorage).filter((key) =>
        key.startsWith("training-reminder-dismissed-")
      );
      setDismissed(savedDismissed);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!loginSession?.vid) return;

    function checkSessions() {
      const now = new Date();
      const mySessions = sessions.filter(
        (s) => String(s.traineeVid) === String(loginSession.vid)
      );

      for (const session of mySessions) {
        const sessionDate = parseSessionDate(session);
        if (!sessionDate) continue;

        const diffMinutes = Math.floor((sessionDate.getTime() - now.getTime()) / 60000);
        const reminder = getActiveReminder(diffMinutes);
        if (!reminder) continue;

        const reminderKey = getReminderKey(session, reminder);
        if (!dismissed.includes(reminderKey)) {
          setActiveSession(session);
          setActiveReminder(reminder);
          setDoNotShowAgain(false);
          setVisible(true);
          break;
        }
      }
    }

    checkSessions();
    const interval = setInterval(checkSessions, 60000);
    return () => clearInterval(interval);
  }, [sessions, loginSession, dismissed]);

  if (!visible || !activeSession || !activeReminder) return null;

  const reminderKey = getReminderKey(activeSession, activeReminder);

  function closeReminder(goToMyTraining = false) {
    if (doNotShowAgain && typeof window !== "undefined") {
      localStorage.setItem(reminderKey, "true");
    }

    setDismissed((prev) =>
      prev.includes(reminderKey) ? prev : [...prev, reminderKey]
    );

    if (goToMyTraining) {
      window.location.href = "/my-training";
      return;
    }

    setVisible(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/20 bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="text-sm font-black uppercase tracking-[0.2em] text-[#8b8a84]">
          upcoming training
        </div>

        <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-[#0a2342]">
          {activeSession.program} Practical
          <span className="text-[#ff5a1f]">.</span>
        </h2>

        <div className="mt-5 rounded-3xl border border-[#ececea] bg-[#fbfbfa] p-5">
          <div className="text-2xl font-black text-[#242421]">
            Starts in {activeReminder.label}
          </div>
          <div className="mt-3 text-lg font-bold text-[#4b4b48]">
            {activeSession.position} · {activeSession.time}
          </div>
          <div className="mt-2 text-sm font-bold text-[#8b8a84]">
            {activeSession.topic}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#ececea] bg-[#fbfbfa] p-4">
            <div className="text-[10px] font-black uppercase tracking-wide text-[#8b8a84]">
              trainee
            </div>
            <div className="mt-1 text-sm font-black">{activeSession.traineeName}</div>
          </div>

          <div className="rounded-2xl border border-[#ececea] bg-[#fbfbfa] p-4">
            <div className="text-[10px] font-black uppercase tracking-wide text-[#8b8a84]">
              trainer
            </div>
            <div className="mt-1 text-sm font-black">{activeSession.trainerName || "-"}</div>
          </div>
        </div>

        <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-2xl border border-[#ececea] bg-[#fbfbfa] px-4 py-3 text-sm font-bold text-[#4b4b48]">
          <input
            type="checkbox"
            checked={doNotShowAgain}
            onChange={(e) => setDoNotShowAgain(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-[#0a2342]"
          />
          Hide this {activeReminder.label} reminder for this session
        </label>

        <div className="mt-7 flex items-center justify-end gap-3">
          <button
            onClick={() => closeReminder(false)}
            className="rounded-full border border-[#dddbd6] bg-white px-5 py-3 text-sm font-black text-[#4b4b48] transition hover:bg-[#f3f3f1]"
          >
            Dismiss
          </button>

          <button
            onClick={() => closeReminder(true)}
            className="rounded-full bg-[#0a2342] px-5 py-3 text-sm font-black text-white transition hover:bg-[#163b6d]"
          >
            Open My Training
          </button>
        </div>
      </div>
    </div>
  );
}
