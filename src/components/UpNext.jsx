"use client";

import { useEffect, useState } from "react";
import { getClientSession } from "../lib/authSession";
import Card from "./ui/Card";

function monthLabel(item) {
  const month = String(item.month || "").toUpperCase();
  return item.year ? `${month} ${item.year}` : month || "NO DATE";
}

function monthOptions(items) {
  return [...new Set(items.map(monthLabel))];
}

function filteredItems(items, month) {
  return month === "ALL" ? items : items.filter((item) => monthLabel(item) === month);
}

function groupedItems(items) {
  return items.reduce((groups, item) => {
    const label = monthLabel(item);
    const group = groups.find((entry) => entry.label === label);
    if (group) group.items.push(item);
    else groups.push({ label, items: [item] });
    return groups;
  }, []);
}

function MonthFilter({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-full border border-[#ececea] bg-white px-4 py-2 text-xs font-black text-[#4b4b48] outline-none"
    >
      <option value="ALL">ALL MONTHS</option>
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}

function SessionItem({ s, index, canViewDetails }) {
  return (
    <div
      key={`${s.mode || "session"}-${s.id || index}`}
      className={`flex gap-4 border-b border-[#ececea] px-6 py-4 ${s.mine ? "border-l-4 border-l-[#16a34a] bg-[#e3f7ea]" : ""} ${s.mode === "history" ? "bg-[#fbfbfa]/60" : ""}`}
    >
      <div className="min-w-12">
        <div className="text-2xl font-black" style={{ color: s.color }}>{s.day}</div>
        <div className="text-xs font-bold italic text-[#8b8a84]">{s.month} {s.time}</div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-md border px-2 py-1 text-xs font-black" style={{ color: s.color, borderColor: s.color }}>{s.type}</span>
          <span className="font-black">{s.pos}</span>
          {s.mode === "history" && <span className="ml-auto rounded-full bg-[#ececea] px-2 py-1 text-[10px] font-black uppercase text-[#6d6d68]">completed</span>}
          {s.mine && canViewDetails && s.mode !== "history" && <span className="ml-auto text-xs font-black italic text-[#16a34a]">you</span>}
        </div>

        {canViewDetails ? (
          <>
            <div className="font-black">{s.title}</div>
            <div className="mt-1 truncate text-sm font-semibold italic text-[#8b8a84]">{s.name}{s.vid ? ` (${s.vid})` : ""}</div>
            {s.trainerName && <div className="mt-1 truncate text-xs font-black uppercase text-[#b8b6ae]">trainer: {s.trainerName}</div>}
          </>
        ) : (
          <div className="mt-1 text-sm font-semibold italic text-[#8b8a84]">Login with IVAO to view session details</div>
        )}
      </div>
    </div>
  );
}

function SessionList({ items, canViewDetails, emptyText }) {
  if (items.length === 0) {
    return <div className="px-6 py-10 text-center text-sm font-bold text-[#8b8a84]">{emptyText}</div>;
  }

  return groupedItems(items).map((group) => (
    <div key={group.label}>
      <div className="sticky top-0 z-10 border-b border-[#ececea] bg-[#fbfbfa] px-6 py-3 text-xs font-black uppercase tracking-wide text-[#8b8a84]">{group.label}</div>
      {group.items.map((s, index) => <SessionItem key={`${s.mode || "session"}-${s.id || index}`} s={s} index={index} canViewDetails={canViewDetails} />)}
    </div>
  ));
}

export default function UpNext({ upNext, history = [] }) {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [activeMonth, setActiveMonth] = useState("ALL");

  useEffect(() => {
    setSession(getClientSession());
  }, []);

  const canViewDetails = Boolean(session);
  const sourceItems = activeTab === "history" ? history : upNext;
  const options = monthOptions(sourceItems);
  const activeItems = filteredItems(sourceItems, activeMonth);

  function switchTab(tab) {
    setActiveTab(tab);
    setActiveMonth("ALL");
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-[#ececea] px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="text-2xl font-black"><span className="font-normal italic text-[#8b8a84]">{activeTab === "history" ? "past/" : "up/"}</span>{activeTab === "history" ? "history" : "next"}</div>
          <div className="text-sm font-bold text-[#8b8a84]"><span className="text-[#ff5a1f]">{activeItems.length}</span> sessions</div>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_1.25fr] gap-3">
          <MonthFilter value={activeMonth} onChange={setActiveMonth} options={options} />
          <div className="grid grid-cols-2 rounded-full border border-[#ececea] bg-[#fbfbfa] p-1">
            <button onClick={() => switchTab("upcoming")} className={`rounded-full px-4 py-2 text-xs font-black transition ${activeTab === "upcoming" ? "bg-black text-white shadow-sm" : "text-[#8b8a84] hover:bg-white"}`}>Upcoming</button>
            <button onClick={() => switchTab("history")} className={`rounded-full px-4 py-2 text-xs font-black transition ${activeTab === "history" ? "bg-[#0a2342] text-white shadow-sm" : "text-[#8b8a84] hover:bg-white"}`}>History</button>
          </div>
        </div>
      </div>

      <div className="max-h-[720px] overflow-auto">
        <SessionList
          items={activeItems}
          canViewDetails={canViewDetails}
          emptyText={activeTab === "history" ? "No completed training sessions in this filter." : "No upcoming training sessions in this filter."}
        />
      </div>
    </Card>
  );
}
