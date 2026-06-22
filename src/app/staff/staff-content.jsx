"use client";

import { useState } from "react";

import Navbar from "../../components/Navbar";
import Card from "../../components/ui/Card";
import ScheduleEntriesPanel from "../../components/staff/ScheduleEntriesPanel";
import SessionForm from "../../components/staff/SessionForm";
import TeachingSchedule from "../../components/staff/TeachingSchedule";
import TraineeHistoryPanel from "../../components/staff/TraineeHistoryPanel";
import useTrainingSessions, { trainerLabel } from "../../hooks/useTrainingSessions";
import { canManageWebmasters, canManualAddTraining } from "../../lib/permissions";

export default function OriginalStaffPage() {
  const [teachingTab, setTeachingTab] = useState("upcoming");
  const [entriesTab, setEntriesTab] = useState("upcoming");

  const {
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
  } = useTrainingSessions();

  const canOpenWebmasters = canManageWebmasters(loginSession);
  const canOpenManualTraining = canManualAddTraining(loginSession, canOpenWebmasters);
  const mySessions = loginSession?.vid
    ? sessions.filter(
        (session) => String(session.trainerVid || "") === String(loginSession.vid),
      )
    : [];

  return (
    <main className="relative z-10 min-h-screen px-4 py-4 sm:px-6 sm:py-6">
      <Navbar />

      <section className="mx-auto max-w-[1480px] py-6 sm:py-10">
        <div className="mb-8">
          <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
            ivao-th / training department / staff console
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
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
          onEdit={editSession}
          onDelete={deleteSession}
        />

        <TraineeHistoryPanel loading={loading} sessions={sessions} />

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SessionForm
            editingId={editingId}
            form={form}
            loginSession={loginSession}
            traineeLookupStatus={traineeLookupStatus}
            trainerLabel={trainerLabel}
            onChange={updateForm}
            onCancelEdit={cancelEdit}
            onSubmit={publishSession}
          />

          <ScheduleEntriesPanel
            loading={loading}
            sessions={sessions}
            tab={entriesTab}
            setTab={setEntriesTab}
            currentUser={loginSession}
            onEdit={editSession}
            onDelete={deleteSession}
            onClaim={claimSession}
          />
        </div>
      </section>
    </main>
  );
}
