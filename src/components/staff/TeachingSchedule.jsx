"use client";

import { useState } from "react";

import Card from "../ui/Card";
import { canDeleteSession, canEditSession } from "../../lib/permissions";
import {
  filterByMonth,
  getMonthOptions,
  groupByMonth,
  splitSessionsByTime,
} from "../../lib/staffSessions";
import MonthSelect from "./MonthSelect";
import StatusBadge from "./StatusBadge";

function TeachingRow({ s, completed, canEdit, canDelete, onEdit, onDelete }) {
  return (
    <div className="grid gap-3 border-b border-[#ececea] px-4 py-5 last:border-b-0 sm:px-6 xl:grid-cols-[120px_90px_1fr_210px] xl:items-center xl:gap-4">
      <div>
        <div className="font-black">{s.date}</div>
        <div className="text-sm font-bold italic text-[#8b8a84]">{s.time}</div>
      </div>

      <div>
        <div className="font-black">{s.program}</div>
        <div className="mt-1 text-xs font-black uppercase text-[#8b8a84]">
          {s.position}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-black">{s.type}</div>
          <StatusBadge
            status={completed && s.status === "Scheduled" ? "Completed" : s.status}
          />
        </div>

        <div className="mt-1 truncate text-sm font-semibold text-[#4b4b48]">
          {s.topic}
        </div>

        <div className="mt-1 text-sm font-semibold italic text-[#8b8a84]">
          {s.traineeName || s.trainee} {s.traineeVid ? `(${s.traineeVid})` : ""}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
        {canEdit && (
          <button
            onClick={() => onEdit(s)}
            className="cursor-pointer rounded-full border border-[#dddbd6] bg-white px-3 py-1 text-xs font-black text-[#4b4b48] hover:bg-[#f3f3f1]"
          >
            edit
          </button>
        )}

        {canDelete && (
          <button
            onClick={() => onDelete(s)}
            className="cursor-pointer rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-600 hover:bg-red-100"
          >
            delete
          </button>
        )}
      </div>
    </div>
  );
}

export default function TeachingSchedule({
  loading,
  sessions,
  tab,
  setTab,
  currentUser,
  onEdit,
  onDelete,
}) {
  const [month, setMonth] = useState("ALL");
  const { upcoming, completed } = splitSessionsByTime(sessions);
  const source = tab === "completed" ? completed : upcoming;
  const options = getMonthOptions(source);
  const active = filterByMonth(source, month);
  const groups = groupByMonth(active);

  return (
    <Card className="mb-6 overflow-hidden p-0">
      <div className="flex flex-col gap-4 border-b border-[#ececea] px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
            personal trainer view
          </div>
          <div className="mt-1 text-2xl font-black">
            <span className="font-normal italic text-[#8b8a84]">my/</span>teaching schedule
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <MonthSelect value={month} onChange={setMonth} options={options} />

          <div className="grid grid-cols-2 rounded-full border border-[#ececea] bg-[#fbfbfa] p-1">
            <button
              onClick={() => setTab("upcoming")}
              className={`rounded-full px-4 py-2 text-xs font-black transition ${
                tab === "upcoming" ? "bg-black text-white" : "text-[#8b8a84] hover:bg-white"
              }`}
            >
              Upcoming ({upcoming.length})
            </button>

            <button
              onClick={() => setTab("completed")}
              className={`rounded-full px-4 py-2 text-xs font-black transition ${
                tab === "completed"
                  ? "bg-[#0a2342] text-white"
                  : "text-[#8b8a84] hover:bg-white"
              }`}
            >
              Completed ({completed.length})
            </button>
          </div>

          <div className="rounded-full bg-black px-4 py-2 text-sm font-black text-white">
            {sessions.length} sessions
          </div>
        </div>
      </div>

      {loading ? (
        <div className="px-4 py-8 text-sm font-bold text-[#8b8a84] sm:px-6">
          Loading your sessions...
        </div>
      ) : sessions.length === 0 ? (
        <div className="px-4 py-8 text-sm font-bold text-[#8b8a84] sm:px-6">
          You do not have any assigned teaching sessions yet.
        </div>
      ) : active.length === 0 ? (
        <div className="px-4 py-8 text-sm font-bold text-[#8b8a84] sm:px-6">
          No sessions in this filter.
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.label}>
            <div className="border-b border-[#ececea] bg-[#fbfbfa] px-4 py-3 text-xs font-black uppercase tracking-wide text-[#8b8a84] sm:px-6">
              {group.label}
            </div>

            {group.items.map((s) => (
              <TeachingRow
                key={`mine-${s.firestoreId}`}
                s={s}
                completed={tab === "completed"}
                canEdit={canEditSession(currentUser, s)}
                canDelete={canDeleteSession(currentUser, s)}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        ))
      )}
    </Card>
  );
}
