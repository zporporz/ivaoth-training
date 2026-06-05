"use client";

import { useState } from "react";

import Card from "../ui/Card";
import {
  canClaimLegacySession,
  canDeleteSession,
  canEditSession,
} from "../../lib/permissions";
import {
  filterByMonth,
  getMonthOptions,
  groupByMonth,
  splitSessionsByTime,
} from "../../lib/staffSessions";
import MonthSelect from "./MonthSelect";
import StatusBadge from "./StatusBadge";

function ScheduleEntryRow({
  s,
  completed,
  canEdit,
  canDelete,
  canClaim,
  onEdit,
  onDelete,
  onClaim,
}) {
  return (
    <div className="grid grid-cols-[90px_120px_80px_1fr_220px] items-center gap-4 border-b border-[#ececea] px-6 py-5 last:border-b-0">
      <div className="text-sm font-black text-[#8b8a84]">
        {s.firestoreId.slice(0, 7)}
      </div>

      <div>
        <div className="font-black">{s.date}</div>
        <div className="text-sm font-bold italic text-[#8b8a84]">{s.time}</div>
      </div>

      <div className="font-black">{s.program}</div>

      <div>
        <div className="font-black">{s.type}</div>
        <div className="mt-1 text-sm font-semibold text-[#4b4b48]">{s.topic}</div>
        <div className="mt-1 text-sm font-semibold italic text-[#8b8a84]">
          {s.position} · {s.traineeName || s.trainee}{" "}
          {s.traineeVid ? `(${s.traineeVid})` : ""}
        </div>
        <div className="mt-1 text-xs font-black uppercase text-[#8b8a84]">
          trainer: {s.trainerName || "Legacy session"}
          {s.trainerStaffPosition ? ` · ${s.trainerStaffPosition}` : ""}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <StatusBadge
          status={completed && s.status === "Scheduled" ? "Completed" : s.status}
        />

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

        {!canEdit && !canDelete && canClaim && (
          <button
            onClick={() => onClaim(s)}
            className="cursor-pointer rounded-full border border-[#0a2342] bg-[#0a2342] px-3 py-1 text-xs font-black text-white hover:bg-[#163b6d]"
          >
            claim
          </button>
        )}

        {!canEdit && !canDelete && !canClaim && (
          <span className="rounded-full border border-[#ececea] bg-[#fbfbfa] px-3 py-1 text-xs font-black text-[#8b8a84]">
            view only
          </span>
        )}
      </div>
    </div>
  );
}

export default function ScheduleEntriesPanel({
  loading,
  sessions,
  tab,
  setTab,
  currentUser,
  onEdit,
  onDelete,
  onClaim,
}) {
  const [month, setMonth] = useState("ALL");
  const { upcoming, completed } = splitSessionsByTime(sessions);
  const source = tab === "completed" ? completed : upcoming;
  const options = getMonthOptions(source);
  const active = filterByMonth(source, month);
  const groups = groupByMonth(active);

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-4 border-b border-[#ececea] px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div className="text-2xl font-black">
          <span className="font-normal italic text-[#8b8a84]">training/</span>schedule
          entries
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
        </div>
      </div>

      <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
        {loading ? (
          <div className="px-6 py-8 text-sm font-bold text-[#8b8a84]">
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-6 py-8 text-sm font-bold text-[#8b8a84]">No sessions yet.</div>
        ) : active.length === 0 ? (
          <div className="px-6 py-8 text-sm font-bold text-[#8b8a84]">
            No sessions in this filter.
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              <div className="sticky top-0 z-10 border-b border-[#ececea] bg-[#fbfbfa] px-6 py-3 text-xs font-black uppercase tracking-wide text-[#8b8a84]">
                {group.label}
              </div>

              {group.items.map((s) => (
                <ScheduleEntryRow
                  key={s.firestoreId}
                  s={s}
                  completed={tab === "completed"}
                  canEdit={canEditSession(currentUser, s)}
                  canDelete={canDeleteSession(currentUser, s)}
                  canClaim={canClaimLegacySession(currentUser, s)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onClaim={onClaim}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
