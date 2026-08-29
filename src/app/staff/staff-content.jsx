"use client";

import { useState } from "react";

import Navbar from "../../components/Navbar";
import ScheduleEntriesPanel from "../../components/staff/ScheduleEntriesPanel";
import SessionForm from "../../components/staff/SessionForm";
import TeachingSchedule from "../../components/staff/TeachingSchedule";
import TraineeHistoryPanel from "../../components/staff/TraineeHistoryPanel";
import Card from "../../components/ui/Card";
import useTrainingSessions, { trainerLabel } from "../../hooks/useTrainingSessions";
import {
  canManageDocs,
  canManageStaffList,
  canManageWebmasters,
  canManualAddTraining,
} from "../../lib/permissions";

function ToolCard({ title, eyebrow, description, active, href, onClick, variant = "default" }) {
  const isPrimary = variant === "primary";
  const activeClass = isPrimary
    ? "border-[#ff5a1f] bg-[#ff5a1f] text-white shadow-[0_18px_45px_rgba(255,90,31,0.28)]"
    : "border-[#0a2342] bg-[#0a2342] text-white";
  const inactiveClass = isPrimary
    ? "border-[#ff5a1f]/25 bg-gradient-to-br from-[#ffefe7] via-white to-white text-black shadow-[0_16px_38px_rgba(255,90,31,0.12)] hover:border-[#ff5a1f]/70"
    : "border-[#ececea] bg-white/80 text-black";
  const className = `min-h-[132px] rounded-[26px] border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
    active ? activeClass : inactiveClass
  }`;

  const content = (
    <>
      <div
        className={`text-[11px] font-black uppercase tracking-wide ${
          active ? "text-white/70" : "text-[#8b8a84]"
        }`}
      >
        {eyebrow}
      </div>
      <div className="mt-2 text-xl font-black">{title}</div>
      <div
        className={`mt-2 text-sm font-semibold ${
          active ? "text-white/75" : "text-[#4b4b48]"
        }`}
      >
        {description}
      </div>
      {isPrimary && (
        <div
          className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-black ${
            active ? "bg-white text-[#ff5a1f]" : "bg-[#ff5a1f] text-white"
          }`}
        >
          Start here
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`cursor-pointer ${className}`}>
      {content}
    </button>
  );
}

export default function OriginalStaffPage() {
  const [teachingTab, setTeachingTab] = useState("upcoming");
  const [entriesTab, setEntriesTab] = useState("upcoming");
  const [activeTool, setActiveTool] = useState("create");

  const {
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
  } = useTrainingSessions();

  const canOpenWebmasters = canManageWebmasters(loginSession);
  const canOpenManualTraining = canManualAddTraining(loginSession, canOpenWebmasters);
  const canOpenStaffList = canManageStaffList(loginSession, canOpenWebmasters);
  const canOpenDocsManager = canManageDocs(loginSession);
  const mySessions = loginSession?.vid
    ? sessions.filter(
        (session) => String(session.trainerVid || "") === String(loginSession.vid),
      )
    : [];

  function handleEditSession(session) {
    editSession(session);
    setActiveTool("create");
  }

  return (
    <main className="relative z-10 min-h-screen px-4 py-4 sm:px-6 sm:py-6">
      <Navbar />

      <section className="mx-auto max-w-[1480px] py-6 sm:py-10">
        <div className="mb-8">
          <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
            ivao-th / training department / staff console
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
            <span className="font-normal italic text-[#4b4b48]">Staff</span> console -
            tools hub<span className="text-[#ff5a1f]">.</span>
          </h1>
        </div>

        <Card className="mb-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
                staff console menu
              </div>
              <div className="mt-1 text-2xl font-black">
                <span className="font-normal italic text-[#8b8a84]">open/</span>tool
              </div>
            </div>

            <div className="rounded-full bg-black px-4 py-2 text-sm font-black text-white">
              {sessions.length} total sessions
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <ToolCard
              eyebrow="session"
              title="Create Session"
              description="Create, edit, delete, claim, and review schedule entries."
              active={activeTool === "create"}
              onClick={() => setActiveTool("create")}
              variant="primary"
            />
            <ToolCard
              eyebrow="personal"
              title="My Schedule"
              description="Your own upcoming and completed teaching sessions."
              active={activeTool === "schedule"}
              onClick={() => setActiveTool("schedule")}
            />
            <ToolCard
              eyebrow="record"
              title="Training Records"
              description="Pick trainer, then trainee, then inspect session history."
              active={activeTool === "records"}
              onClick={() => setActiveTool("records")}
            />
            {canOpenDocsManager && (
              <ToolCard
                eyebrow="docs"
                title="Manage Docs"
                description="Add and update training documents shown to members."
                href="/staff/training-docs"
              />
            )}
          </div>
        </Card>

        {(canOpenWebmasters || canOpenManualTraining || canOpenStaffList) && (
          <Card className="mb-6 border-[#0a2342]/20 bg-[#0a2342]/[0.03]">
            <div className="mb-5">
              <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
                webmaster core
              </div>
              <div className="mt-1 text-2xl font-black">
                <span className="font-normal italic text-[#8b8a84]">core/</span>management
              </div>
              <div className="mt-2 text-sm font-semibold text-[#4b4b48]">
                Visible only to accounts with core webmaster permission.
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {canOpenWebmasters && (
                <ToolCard
                  eyebrow="access"
                  title="Manage Webmasters"
                  description="Grant or remove elevated webmaster access."
                  href="/staff/webmasters"
                />
              )}
              {canOpenStaffList && (
                <ToolCard
                  eyebrow="staff list"
                  title="Manage List"
                  description="Update public trainer list and staff profile data."
                  href="/staff/training-staff"
                />
              )}
              {canOpenManualTraining && (
                <ToolCard
                  eyebrow="legacy"
                  title="Manual Add Training"
                  description="Add legacy training records manually when needed."
                  href="/staff/manual-training"
                />
              )}
            </div>
          </Card>
        )}

        {activeTool === "schedule" && (
          <TeachingSchedule
            loading={loading}
            sessions={mySessions}
            tab={teachingTab}
            setTab={setTeachingTab}
            currentUser={loginSession}
            onEdit={handleEditSession}
            onDelete={deleteSession}
          />
        )}

        {activeTool === "records" && <TraineeHistoryPanel loading={loading} sessions={sessions} />}

        {activeTool === "create" && (
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <SessionForm
              editingId={editingId}
              form={form}
              loginSession={loginSession}
              traineeLookupStatus={traineeLookupStatus}
              submitStatus={submitStatus}
              submitMessage={submitMessage}
              isSubmitting={isSubmitting}
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
              onEdit={handleEditSession}
              onDelete={deleteSession}
              onClaim={claimSession}
            />
          </div>
        )}
      </section>
    </main>
  );
}
