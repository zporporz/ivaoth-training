"use client";

import { useMemo, useState } from "react";

import programs from "../../data/programs";
import { sessionToDate } from "../../lib/staffSessions";
import Card from "../ui/Card";
import StatusBadge from "./StatusBadge";

const programGroupByCode = new Map(programs.map((program) => [program.code, program.group]));

const recordFilters = [
  { key: "ALL", label: "All" },
  { key: "ATC", label: "ATC" },
  { key: "Pilot", label: "Pilot" },
];

function traineeKeyFor(session) {
  return String(
    session.traineeVid || session.traineeName || session.trainee || "unknown-trainee",
  );
}

function trainerKeyFor(session) {
  return String(session.trainerVid || session.trainerName || "legacy-trainer");
}

function displayDate(session) {
  return [session.date, session.time].filter(Boolean).join(" ");
}

function sortByNewest(a, b) {
  const dateA = sessionToDate(a)?.getTime() || 0;
  const dateB = sessionToDate(b)?.getTime() || 0;

  return dateB - dateA;
}

function sessionMatchesFilter(session, filter) {
  return filter === "ALL" || programGroupByCode.get(session.program) === filter;
}

function buildHistory(sessions) {
  const trainerMap = new Map();

  sessions.forEach((session) => {
    const trainerKey = trainerKeyFor(session);
    const traineeKey = traineeKeyFor(session);

    if (!trainerMap.has(trainerKey)) {
      trainerMap.set(trainerKey, {
        key: trainerKey,
        name: session.trainerName || "Legacy trainer",
        vid: session.trainerVid || "",
        staffPosition: session.trainerStaffPosition || "",
        sessions: [],
        traineeMap: new Map(),
      });
    }

    const trainer = trainerMap.get(trainerKey);
    trainer.sessions.push(session);

    if (!trainer.traineeMap.has(traineeKey)) {
      trainer.traineeMap.set(traineeKey, {
        key: traineeKey,
        name: session.traineeName || session.trainee || "Unknown trainee",
        vid: session.traineeVid || "",
        sessions: [],
      });
    }

    trainer.traineeMap.get(traineeKey).sessions.push(session);
  });

  return Array.from(trainerMap.values())
    .map((trainer) => {
      const sortedSessions = [...trainer.sessions].sort(sortByNewest);
      const trainees = Array.from(trainer.traineeMap.values())
        .map((trainee) => {
          const traineeSessions = [...trainee.sessions].sort(sortByNewest);
          const programs = [...new Set(traineeSessions.map((s) => s.program).filter(Boolean))];

          return {
            ...trainee,
            sessions: traineeSessions,
            programs,
            latestSession: traineeSessions[0],
          };
        })
        .sort((a, b) => b.sessions.length - a.sessions.length || a.name.localeCompare(b.name));

      return {
        ...trainer,
        sessions: sortedSessions,
        trainees,
        latestSession: sortedSessions[0],
      };
    })
    .sort((a, b) => b.sessions.length - a.sessions.length || a.name.localeCompare(b.name));
}

function buildTraineeIndex(sessions) {
  const traineeMap = new Map();

  sessions.forEach((session) => {
    const traineeKey = traineeKeyFor(session);
    const trainerKey = trainerKeyFor(session);

    if (!traineeMap.has(traineeKey)) {
      traineeMap.set(traineeKey, {
        key: traineeKey,
        name: session.traineeName || session.trainee || "Unknown trainee",
        vid: session.traineeVid || "",
        sessions: [],
        trainerMap: new Map(),
      });
    }

    const trainee = traineeMap.get(traineeKey);
    trainee.sessions.push(session);

    if (!trainee.trainerMap.has(trainerKey)) {
      trainee.trainerMap.set(trainerKey, {
        key: trainerKey,
        name: session.trainerName || "Legacy trainer",
        vid: session.trainerVid || "",
        staffPosition: session.trainerStaffPosition || "",
        sessions: [],
      });
    }

    trainee.trainerMap.get(trainerKey).sessions.push(session);
  });

  return Array.from(traineeMap.values())
    .map((trainee) => {
      const sortedSessions = [...trainee.sessions].sort(sortByNewest);
      const programs = [...new Set(sortedSessions.map((s) => s.program).filter(Boolean))];
      const trainers = Array.from(trainee.trainerMap.values())
        .map((trainer) => ({
          ...trainer,
          sessions: [...trainer.sessions].sort(sortByNewest),
        }))
        .sort((a, b) => b.sessions.length - a.sessions.length || a.name.localeCompare(b.name));

      return {
        ...trainee,
        sessions: sortedSessions,
        trainers,
        programs,
        latestSession: sortedSessions[0],
        searchText: [
          trainee.name,
          trainee.vid,
          ...sortedSessions.map((session) => session.trainee || ""),
        ]
          .join(" ")
          .toLowerCase(),
      };
    })
    .sort((a, b) => b.sessions.length - a.sessions.length || a.name.localeCompare(b.name));
}

export default function TraineeHistoryPanel({ loading, sessions }) {
  const [selectedTrainerKey, setSelectedTrainerKey] = useState("");
  const [selectedTraineeKey, setSelectedTraineeKey] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSearchTraineeKey, setSelectedSearchTraineeKey] = useState("");
  const [recordFilter, setRecordFilter] = useState("ALL");

  const filteredSessions = useMemo(
    () => sessions.filter((session) => sessionMatchesFilter(session, recordFilter)),
    [recordFilter, sessions],
  );
  const trainers = useMemo(() => buildHistory(filteredSessions), [filteredSessions]);
  const traineeIndex = useMemo(() => buildTraineeIndex(filteredSessions), [filteredSessions]);
  const searchTerm = searchQuery.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!searchTerm) return [];

    return traineeIndex.filter((trainee) => trainee.searchText.includes(searchTerm));
  }, [searchTerm, traineeIndex]);
  const selectedTrainer =
    trainers.find((trainer) => trainer.key === selectedTrainerKey) || trainers[0];
  const selectedTrainee =
    selectedTrainer?.trainees.find((trainee) => trainee.key === selectedTraineeKey) ||
    selectedTrainer?.trainees[0];
  const selectedSearchTrainee =
    searchResults.find((trainee) => trainee.key === selectedSearchTraineeKey) ||
    searchResults[0];

  function selectTrainer(trainerKey) {
    setSelectedTrainerKey(trainerKey);
    setSelectedTraineeKey("");
  }

  function selectRecordFilter(filter) {
    setRecordFilter(filter);
    setSelectedTrainerKey("");
    setSelectedTraineeKey("");
    setSelectedSearchTraineeKey("");
  }

  const detailTrainee = searchTerm ? selectedSearchTrainee : selectedTrainee;

  return (
    <Card className="mb-6 overflow-hidden p-0">
      <div className="flex flex-col gap-4 border-b border-[#ececea] px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
            staff training record
          </div>
          <div className="mt-1 text-2xl font-black">
            <span className="font-normal italic text-[#8b8a84]">trainee/</span>history
          </div>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-[#4b4b48]">
            Search trainee VID/name across all trainers, or pick a trainer manually to inspect
            training history.
          </p>
        </div>

        <div className="w-full lg:max-w-[560px]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="block text-xs font-black uppercase tracking-wide text-[#8b8a84]">
              search trainee
            </label>

            <div className="grid grid-cols-3 rounded-full border border-[#ececea] bg-[#fbfbfa] p-1">
              {recordFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => selectRecordFilter(filter.key)}
                  className={`cursor-pointer rounded-full px-3 py-2 text-[11px] font-black transition ${
                    recordFilter === filter.key
                      ? filter.key === "Pilot"
                        ? "bg-[#ff5a1f] text-white"
                        : "bg-black text-white"
                      : "text-[#8b8a84] hover:bg-white"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 flex gap-2">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="VID or trainee name"
              className="min-w-0 flex-1 rounded-2xl border border-[#dddbd6] bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-[#0a2342] focus:ring-2 focus:ring-[#0a2342]/10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSearchTraineeKey("");
                }}
                className="cursor-pointer rounded-2xl border border-[#dddbd6] bg-white px-4 py-3 text-xs font-black text-[#4b4b48] hover:bg-[#f3f3f1]"
              >
                clear
              </button>
            )}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-[#ececea] bg-[#fbfbfa] px-3 py-3">
              <div className="text-xl font-black">{trainers.length}</div>
              <div className="text-[10px] font-black uppercase text-[#8b8a84]">trainers</div>
            </div>
            <div className="rounded-2xl border border-[#ececea] bg-[#fbfbfa] px-3 py-3">
              <div className="text-xl font-black">{filteredSessions.length}</div>
              <div className="text-[10px] font-black uppercase text-[#8b8a84]">sessions</div>
            </div>
            <div className="rounded-2xl border border-[#ececea] bg-[#fbfbfa] px-3 py-3">
              <div className="text-xl font-black">
                {new Set(filteredSessions.map(traineeKeyFor)).size}
              </div>
              <div className="text-[10px] font-black uppercase text-[#8b8a84]">trainees</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="px-4 py-8 text-sm font-bold text-[#8b8a84] sm:px-6">
          Loading trainee history...
        </div>
      ) : sessions.length === 0 ? (
        <div className="px-4 py-8 text-sm font-bold text-[#8b8a84] sm:px-6">
          No training sessions yet.
        </div>
      ) : trainers.length === 0 ? (
        <div className="px-4 py-8 text-sm font-bold text-[#8b8a84] sm:px-6">
          No {recordFilter === "Pilot" ? "Pilot / PP" : recordFilter} records in this filter.
        </div>
      ) : searchTerm ? (
        <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr_1.25fr]">
          <div className="border-b border-[#ececea] p-4 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
                search results
              </div>
              <div className="rounded-full bg-black px-3 py-1 text-xs font-black text-white">
                {searchResults.length} found
              </div>
            </div>

            {searchResults.length === 0 ? (
              <div className="rounded-2xl border border-[#ececea] bg-[#fbfbfa] p-4 text-sm font-bold text-[#8b8a84]">
                No trainee matches &quot;{searchQuery}&quot;.
              </div>
            ) : (
              <div className="grid gap-2">
                {searchResults.map((trainee) => (
                  <button
                    key={trainee.key}
                    type="button"
                    onClick={() => setSelectedSearchTraineeKey(trainee.key)}
                    className={`cursor-pointer rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                      selectedSearchTrainee?.key === trainee.key
                        ? "border-[#ff5a1f] bg-[#fff3ec]"
                        : "border-[#ececea] bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black">{trainee.name}</div>
                        <div className="mt-1 text-xs font-bold text-[#8b8a84]">
                          {trainee.vid ? `VID ${trainee.vid}` : "No VID"}
                        </div>
                      </div>
                      <div className="rounded-full bg-[#0a2342] px-3 py-1 text-xs font-black text-white">
                        {trainee.sessions.length}
                      </div>
                    </div>

                    <div className="mt-2 text-xs font-bold text-[#4b4b48]">
                      {trainee.programs.length ? trainee.programs.join(", ") : "No program"}
                    </div>
                    <div className="mt-1 text-xs font-semibold italic text-[#8b8a84]">
                      taught by {trainee.trainers.length} trainer
                      {trainee.trainers.length === 1 ? "" : "s"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-b border-[#ececea] p-4 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="mb-3 text-xs font-black uppercase tracking-wide text-[#8b8a84]">
              trainers involved
            </div>

            <div className="grid gap-2">
              {selectedSearchTrainee?.trainers.map((trainer) => (
                <div
                  key={trainer.key}
                  className="rounded-2xl border border-[#ececea] bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black">{trainer.name}</div>
                      <div className="mt-1 text-xs font-bold text-[#8b8a84]">
                        {trainer.vid ? `VID ${trainer.vid}` : "Legacy session"}
                      </div>
                    </div>
                    <div className="rounded-full bg-black px-3 py-1 text-xs font-black text-white">
                      {trainer.sessions.length}
                    </div>
                  </div>

                  {trainer.staffPosition && (
                    <div className="mt-2 text-xs font-bold text-[#8b8a84]">
                      {trainer.staffPosition}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <HistoryDetail trainee={detailTrainee} />
          </div>
        </div>
      ) : (
        <div className="grid gap-0 lg:grid-cols-[0.85fr_1fr_1.25fr]">
          <div className="border-b border-[#ececea] p-4 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="mb-3 text-xs font-black uppercase tracking-wide text-[#8b8a84]">
              trainers
            </div>

            <div className="grid gap-2">
              {trainers.map((trainer) => (
                <button
                  key={trainer.key}
                  type="button"
                  onClick={() => selectTrainer(trainer.key)}
                  className={`cursor-pointer rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    selectedTrainer?.key === trainer.key
                      ? "border-[#0a2342] bg-[#0a2342] text-white"
                      : "border-[#ececea] bg-white text-black"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black">{trainer.name}</div>
                      <div
                        className={`mt-1 text-xs font-bold ${
                          selectedTrainer?.key === trainer.key
                            ? "text-white/75"
                            : "text-[#8b8a84]"
                        }`}
                      >
                        {trainer.vid ? `VID ${trainer.vid}` : "Legacy session"}
                      </div>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        selectedTrainer?.key === trainer.key
                          ? "bg-white text-[#0a2342]"
                          : "bg-[#fbfbfa] text-[#4b4b48]"
                      }`}
                    >
                      {trainer.sessions.length}
                    </div>
                  </div>

                  {trainer.staffPosition && (
                    <div
                      className={`mt-2 text-xs font-bold ${
                        selectedTrainer?.key === trainer.key
                          ? "text-white/75"
                          : "text-[#8b8a84]"
                      }`}
                    >
                      {trainer.staffPosition}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="border-b border-[#ececea] p-4 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
                trainees
              </div>
              <div className="rounded-full bg-black px-3 py-1 text-xs font-black text-white">
                {selectedTrainer?.trainees.length || 0} people
              </div>
            </div>

            <div className="grid gap-2">
              {selectedTrainer?.trainees.map((trainee) => (
                <button
                  key={trainee.key}
                  type="button"
                  onClick={() => setSelectedTraineeKey(trainee.key)}
                  className={`cursor-pointer rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    selectedTrainee?.key === trainee.key
                      ? "border-[#ff5a1f] bg-[#fff3ec]"
                      : "border-[#ececea] bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black">{trainee.name}</div>
                      <div className="mt-1 text-xs font-bold text-[#8b8a84]">
                        {trainee.vid ? `VID ${trainee.vid}` : "No VID"}
                      </div>
                    </div>
                    <div className="rounded-full bg-[#0a2342] px-3 py-1 text-xs font-black text-white">
                      {trainee.sessions.length}
                    </div>
                  </div>

                  <div className="mt-2 text-xs font-bold text-[#4b4b48]">
                    {trainee.programs.length ? trainee.programs.join(", ") : "No program"}
                  </div>

                  {trainee.latestSession && (
                    <div className="mt-1 truncate text-xs font-semibold italic text-[#8b8a84]">
                      latest: {trainee.latestSession.program} {trainee.latestSession.type}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <HistoryDetail trainee={detailTrainee} />
          </div>
        </div>
      )}
    </Card>
  );
}

function HistoryDetail({ trainee }) {
  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
            detail
          </div>
          <div className="mt-1 text-xl font-black">
            {trainee?.name || "Select trainee"}
          </div>
          {trainee?.vid && (
            <div className="text-sm font-bold text-[#8b8a84]">VID {trainee.vid}</div>
          )}
        </div>

        {trainee && (
          <div className="rounded-full bg-[#ff5a1f] px-4 py-2 text-sm font-black text-white">
            {trainee.sessions.length} sessions
          </div>
        )}
      </div>

      <div className="grid gap-3">
        {trainee?.sessions.map((session) => (
          <div
            key={`history-${session.firestoreId}`}
            className="rounded-2xl border border-[#ececea] bg-white p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-black">{displayDate(session)}</div>
              <StatusBadge status={session.status} />
              <span className="rounded-full bg-[#fbfbfa] px-3 py-1 text-xs font-black text-[#4b4b48]">
                {session.program}
              </span>
            </div>

            <div className="mt-3 text-sm font-black">{session.type}</div>
            <div className="mt-1 text-sm font-semibold text-[#4b4b48]">
              {session.topic || "No topic"}
            </div>

            <div className="mt-2 text-xs font-black uppercase text-[#8b8a84]">
              position: {session.position || "-"}
            </div>

            {session.trainerName && (
              <div className="mt-1 text-xs font-black uppercase text-[#8b8a84]">
                trainer: {session.trainerName}
                {session.trainerVid ? ` (${session.trainerVid})` : ""}
              </div>
            )}

            {session.remarks && (
              <div className="mt-3 rounded-xl bg-[#fbfbfa] p-3 text-sm font-semibold text-[#4b4b48]">
                {session.remarks}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
